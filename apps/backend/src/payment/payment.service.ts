
import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, ProcessPaymentDto, CurrencyConversionDto } from './dto/create-transaction.dto';
import { CommissionService } from '../commission/commission.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
    private httpService: HttpService,
  ) {}

  public async bcAuthorize(
    accessToken: string,
    msisdn: string,
    scope: string,
    accessType: 'online' | 'offline',
    callbackUrl?: string
  ) {
    const url = 'https://sandbox.momodeveloper.mtn.com/collection/v1_0/bc-authorize';
    const data = new URLSearchParams({
      login_hint: `ID:${msisdn}/MSISDN`,
      scope,
      access_type: accessType,
    });

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'X-Target-Environment': 'sandbox',
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (callbackUrl) headers['X-Callback-Url'] = callbackUrl;

    const response = await axios.post(url, data, { headers });
    return response.data; // { auth_req_id, interval, expires_in }
  }

  public async getMTNAccessToken(): Promise<string> {
    const apiUser = process.env.MTN_MONEY_API_USER!;
    const apiKey = process.env.MTN_MONEY_API_KEY!;
    const subscriptionKey = process.env.MTN_MONEY_SUBSCRIPTION_KEY!;
    const tokenUrl = process.env.MTN_MONEY_TOKEN_URL!;

    const basicAuth = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');

    try {
      const response = await axios.post(
        tokenUrl,
        new URLSearchParams({ grant_type: 'client_credentials' }),
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Ocp-Apim-Subscription-Key': subscriptionKey,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Error fetching MTN MoMo access token:', error.response?.data || error.message);
      } else if (error instanceof Error) {
        this.logger.error('Error fetching MTN MoMo access token:', error.message);
      } else {
        this.logger.error('Error fetching MTN MoMo access token:', error);
      }
      throw new Error('Failed to get MTN MoMo access token');
    }
  }

  public async getZamtelAccessToken(): Promise<string> {
    const clientId = process.env.ZAMTEL_MONEY_CLIENT_ID!;
    const clientSecret = process.env.ZAMTEL_MONEY_CLIENT_SECRET!;
    const apiUrl = process.env.ZAMTEL_MONEY_API_URL!;

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
      const response = await axios.post(
        `${apiUrl}/auth/token`,
        new URLSearchParams({ grant_type: 'client_credentials' }),
        {
          headers: {
            Authorization: `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Error fetching Zamtel access token:', error.response?.data || error.message);
      } else if (error instanceof Error) {
        this.logger.error('Error fetching Zamtel access token:', error.message);
      } else {
        this.logger.error('Error fetching Zamtel access token:', error);
      }
      throw new Error('Failed to get Zamtel access token');
    }
  }

  async createTransaction(createTransactionDto: CreateTransactionDto, userId: number) {
    const { mediaId, resellerLinkCode, deviceInfo } = createTransactionDto;

    if (!mediaId) {
      throw new BadRequestException('mediaId is required');
    }
    if (typeof createTransactionDto.amount !== 'number' || isNaN(createTransactionDto.amount) || createTransactionDto.amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }

    try {
      return await this.prisma.$transaction(async (tx: import('@prisma/client').Prisma.TransactionClient) => {
        // Get media details
        const media = await tx.media.findUnique({
          where: { id: mediaId },
        });

        if (!media) {
          throw new BadRequestException('Media not found');
        }

        // Check if this is a reseller sale
        let resellerLink = null;
        let isResellerSale = false;
        let commissionRate = 0.2; // Default 20%

        if (resellerLinkCode) {
          resellerLink = await tx.resellerLink.findUnique({
            where: { code: resellerLinkCode },
          });

          if (resellerLink?.status === 'ACTIVE') {
            isResellerSale = true;

            const resellerUser = await tx.user.findUnique({
              where: { id: resellerLink.resellerId },
            });

            commissionRate = resellerLink.customCommissionRate ?? resellerUser?.commissionRate ?? 0.2;

            await tx.resellerLink.update({
              where: { id: resellerLink.id },
              data: { conversionCount: { increment: 1 } },
            });
          }
        }

        // Calculate amounts
        const amount = createTransactionDto.amount;
        let platformAmount = 0;
        let artistAmount = 0;
        let resellerAmount = 0;

        if (isResellerSale) {
          resellerAmount = amount * commissionRate;
          artistAmount = amount * (media.artistCommissionRate ?? 0.5);
          platformAmount = amount - resellerAmount - artistAmount;
        } else {
          artistAmount = amount * (media.artistCommissionRate ?? 0.5);
          platformAmount = amount - artistAmount;
        }

        // Build transaction payload explicitly (avoid spreading unknown fields into Prisma)
        const txData: any = {
          userId,
          mediaId,
          resellerLinkId: resellerLink?.id ?? null,
          isResellerSale,
          status: 'PENDING',
          reference: this.generateReference(),
          metadata: {
            deviceInfo: deviceInfo ?? null,
            calculatedAmounts: {
              platformAmount,
              artistAmount,
              resellerAmount,
            },
          },
          amount,
          currency: createTransactionDto.currency as any,
          paymentMethod: createTransactionDto.paymentMethod as any,
          paymentProvider: createTransactionDto.paymentProvider as any,
        };

        const transaction = await tx.transaction.create({
          data: txData,
        });

        // Create commission record if reseller sale
        if (isResellerSale && resellerLink) {
          await tx.commission.create({
            data: {
              amount: resellerAmount,
              currency: createTransactionDto.currency as any,
              resellerId: resellerLink.resellerId,
              transactionId: transaction.id,
              mediaId,
              commissionRate: commissionRate,
            },
          });
        }

        return transaction;
      });
    } catch (err) {
      this.logger.error('createTransaction error', err as any);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to create transaction');
    }
  }

  async processMobileMoneyPayment(processPaymentDto: ProcessPaymentDto, provider: string) {
    const { transactionId, providerData } = processPaymentDto;

    const transaction = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        media: true,
        resellerLink: true,
        commissions: true,
      },
    });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    try {
      let paymentResult;
      switch (provider) {
        case 'MTN_MONEY':
          paymentResult = await this.processMTNMoney(transaction, providerData);
          break;
        case 'AIRTEL_MONEY':
          paymentResult = await this.processAirtelMoney(transaction, providerData);
          break;
        case 'ZAMTEL_MONEY':
          paymentResult = await this.processZamtelMoney(transaction, providerData);
          break;
        default:
          throw new BadRequestException('Unsupported payment provider');
      }

      if (paymentResult.success) {
        await this.prisma.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            providerReference: paymentResult.reference,
            metadata: Object.assign({}, transaction.metadata, {
              providerResponse: paymentResult,
            }),
          },
        });

        await this.processInstantPayouts(transaction);

        return {
          success: true,
          transaction,
          paymentResult,
        };
      } else {
        throw new Error(`Payment failed: ${paymentResult.message}`);
      }
    } catch (error) {
      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'FAILED' },
      });
      this.logger.error('processMobileMoneyPayment error', error as any);
      throw error;
    }
  }

  private async processMTNMoney(transaction: any, providerData: { phoneNumber?: string }) {
    const baseUrl = process.env.MTN_MONEY_COLLECTION_URL!;
    const subscriptionKey = process.env.MTN_MONEY_SUBSCRIPTION_KEY!;
    const accessToken = await this.getMTNAccessToken();

    const payload = {
      amount: transaction.amount,
      currency: transaction.currency,
      externalId: transaction.reference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: providerData.phoneNumber,
      },
      payerMessage: `Payment for ${transaction.media?.title ?? ''}`,
      payeeNote: 'Music purchase',
    };

    try {
      const response = await axios.post(`${baseUrl}/requesttopay`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Reference-Id': transaction.reference,
          'X-Target-Environment': 'sandbox',
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        reference: transaction.reference,
        message: 'Payment processed successfully',
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('MTN Money payment failed:', error.response?.data || error.message);
      } else if (error instanceof Error) {
        this.logger.error('MTN Money payment failed:', error.message);
      } else {
        this.logger.error('MTN Money payment failed:', error);
      }
      throw new Error('MTN Money payment processing failed');
    }
  }

  private async processAirtelMoney(transaction: any, providerData: { phoneNumber?: string; country?: string }) {
    const airtelApiUrl = process.env.AIRTEL_MONEY_API_URL!;
    const clientId = process.env.AIRTEL_CLIENT_ID!;
    const clientSecret = process.env.AIRTEL_CLIENT_SECRET!;

    const authResponse = await firstValueFrom(
      this.httpService.post(`${airtelApiUrl}/auth/oauth2/token`,
        `grant_type=client_credentials`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )
    );

    const accessToken = authResponse.data.access_token;

    const payload = {
      reference: transaction.reference,
      subscriber: {
        country: providerData.country || 'ZM',
        currency: transaction.currency,
        msisdn: providerData.phoneNumber,
      },
      transaction: {
        amount: transaction.amount,
        country: providerData.country || 'ZM',
        currency: transaction.currency,
        id: transaction.reference,
      },
    };

    try {
      await firstValueFrom(
        this.httpService.post(`${airtelApiUrl}/standard/v1/payments/`, payload, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        })
      );

      return {
        success: true,
        reference: transaction.reference,
        message: 'Payment processed successfully',
      };
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Airtel Money payment failed:', error.message);
      } else {
        this.logger.error('Airtel Money payment failed:', error);
      }
      throw new Error('Airtel Money payment processing failed');
    }
  }

  private async processZamtelMoney(transaction: any, providerData: { phoneNumber?: string }) {
    const zamtelApiUrl = process.env.ZAMTEL_MONEY_API_URL!;
    const merchantCode = process.env.ZAMTEL_MONEY_MERCHANT_CODE!;
    const accessToken = await this.getZamtelAccessToken();

    const payload = {
      merchantCode,
      transactionId: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      phoneNumber: providerData.phoneNumber,
      description: `Payment for ${transaction.media?.title ?? ''}`,
      callbackUrl: process.env.ZAMTEL_MONEY_CALLBACK_URL,
    };

    try {
      const response = await axios.post(`${zamtelApiUrl}/payments/initiate`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        reference: transaction.reference,
        message: 'Payment processed successfully',
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error('Zamtel Money payment failed:', error.response?.data || error.message);
      } else if (error instanceof Error) {
        this.logger.error('Zamtel Money payment failed:', error.message);
      } else {
        this.logger.error('Zamtel Money payment failed:', error);
      }
      throw new Error('Zamtel Money payment processing failed');
    }
  }

  async processInstantPayouts(transaction: any) {
    const calculatedAmounts = transaction.metadata?.calculatedAmounts;

    if (!calculatedAmounts) {
      throw new Error('No calculated amounts found');
    }

    // Check float account balance before attempting payouts
    const totalPayoutAmount = calculatedAmounts.artistAmount + (calculatedAmounts.resellerAmount || 0);
    const floatBalance = await this.getFloatAccountBalance(transaction.currency);

    if (floatBalance < totalPayoutAmount) {
      this.logger.warn(
        `Insufficient float balance for payouts. Required: ${totalPayoutAmount}, Available: ${floatBalance}. Queueing payouts.`
      );

      // Queue payouts for later processing
      await this.queuePayoutsForLater(transaction);
      return;
    }

    // Payout to artist
    if (calculatedAmounts.artistAmount > 0 && transaction.media?.userId) {
      try {
        await this.payoutToUser(
          transaction.media.userId,
          calculatedAmounts.artistAmount,
          transaction.currency,
          `Commission for ${transaction.media?.title ?? ''}`,
          transaction.id
        );

        // Deduct from float account
        await this.deductFromFloatAccount(calculatedAmounts.artistAmount, transaction.currency, 'ARTIST_PAYOUT');
      } catch (error) {
        this.logger.error(`Artist payout failed for transaction ${transaction.id}:`, error);
        // Queue for retry
        await this.queuePayoutForRetry(transaction.id, transaction.media.userId, calculatedAmounts.artistAmount, transaction.currency);
      }
    }

    // Payout to reseller if applicable
    if (transaction.isResellerSale && calculatedAmounts.resellerAmount > 0) {
      const commission = transaction.commissions?.[0];
      if (commission) {
        try {
          await this.payoutToUser(
            commission.resellerId,
            calculatedAmounts.resellerAmount,
            transaction.currency,
            `Reseller commission for ${transaction.media?.title ?? ''}`,
            transaction.id
          );

          // Deduct from float account
          await this.deductFromFloatAccount(calculatedAmounts.resellerAmount, transaction.currency, 'RESELLER_PAYOUT');

          await this.prisma.commission.update({
            where: { id: commission.id },
            data: {
              status: 'PAID',
              isPaid: true,
              paidAt: new Date(),
            },
          });
        } catch (error) {
          this.logger.error(`Reseller payout failed for transaction ${transaction.id}:`, error);
          // Queue for retry
          await this.queuePayoutForRetry(transaction.id, commission.resellerId, calculatedAmounts.resellerAmount, transaction.currency);
        }
      }
    }

    // Update user earnings
    if (calculatedAmounts.artistAmount > 0 && transaction.media?.userId) {
      await this.prisma.user.update({
        where: { id: transaction.media.userId },
        data: {
          totalEarnings: { increment: calculatedAmounts.artistAmount },
        },
      });
    }

    // Check if float balance is low and send alert
    const newFloatBalance = await this.getFloatAccountBalance(transaction.currency);
    if (newFloatBalance < 100000) { // ZMW 100,000 threshold
      await this.sendFloatBalanceAlert(transaction.currency, newFloatBalance);
    }

    // Update user earnings
    if (calculatedAmounts.artistAmount > 0 && transaction.media?.userId) {
      await this.prisma.user.update({
        where: { id: transaction.media.userId },
        data: {
          totalEarnings: { increment: calculatedAmounts.artistAmount },
        },
      });
    }

    if (transaction.isResellerSale && calculatedAmounts.resellerAmount > 0) {
      const commission = transaction.commissions?.[0];
      if (commission) {
        await this.prisma.user.update({
          where: { id: commission.resellerId },
          data: {
            totalCommission: { increment: calculatedAmounts.resellerAmount },
            paidCommission: { increment: calculatedAmounts.resellerAmount },
          },
        });
      }
    }
  }

  private async payoutToUser(userId: number, amount: number, currency: string, description: string, transactionId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { paymentAccounts: true },
    });

    const defaultAccounts = user?.paymentAccounts?.filter(
      (acc: any) => acc.isDefault && acc.isVerified
    );

    if (!user || !defaultAccounts || defaultAccounts.length === 0) {
      this.logger.warn(`User ${userId} has no default payment account for payout`);
      return;
    }

    const paymentAccount = defaultAccounts[0];

    const payoutTransaction = await this.prisma.payoutTransaction.create({
      data: {
        paymentAccountId: paymentAccount.id,
        transactionId,
        amount,
        currency: currency as any,
        status: 'COMPLETED',
        reference: `POUT-${this.generateReference()}`,
        metadata: { description },
        processedAt: new Date(),
      },
    });

    await this.executePayout(paymentAccount, amount, currency, description);

    return payoutTransaction;
  }

  private async executePayout(paymentAccount: any, amount: number, currency: string, description: string) {
    switch (paymentAccount.provider) {
      case 'MTN_MONEY':
        return await this.executeMTNMoneyPayout(paymentAccount, amount, currency, description);
      case 'AIRTEL_MONEY':
        return await this.executeAirtelMoneyPayout(paymentAccount, amount, currency, description);
      case 'ZAMTEL_MONEY':
        return await this.executeZamtelMoneyPayout(paymentAccount, amount, currency, description);
      default:
        this.logger.warn(`Payout provider ${paymentAccount.provider} not implemented`);
    }
  }

  private async executeMTNMoneyPayout(paymentAccount: any, amount: number, currency: string, description: string) {
    // Implement MTN Money payout logic here
  }

  private async executeAirtelMoneyPayout(paymentAccount: any, amount: number, currency: string, description: string) {
    // Implement Airtel Money payout logic here
  }

  private async executeZamtelMoneyPayout(paymentAccount: any, amount: number, currency: string, description: string) {
    // Implement Zamtel Money payout logic here
  }

  async getFloatAccountBalance(currency: Currency): Promise<number> {
    // Get current float balance for the currency
    const floatAccount = await this.prisma.floatAccount.findUnique({
      where: { currency },
    });

    return floatAccount?.balance ?? 0;
  }

  private async deductFromFloatAccount(amount: number, currency: Currency, reason: string): Promise<void> {
    const updatedAccount = await this.prisma.floatAccount.update({
      where: { currency },
      data: {
        balance: { decrement: amount },
      },
    });

    // Log the deduction
    await this.prisma.floatTransaction.create({
      data: {
        floatAccount: { connect: { id: updatedAccount.id } },
        amount: -amount,
        currency,
        type: 'DEDUCTION',
        reason,
        balanceAfter: updatedAccount.balance,
      },
    });
  }

  private async queuePayoutsForLater(transaction: any): Promise<void> {
    const calculatedAmounts = transaction.metadata?.calculatedAmounts;

    // Queue artist payout
    if (calculatedAmounts.artistAmount > 0 && transaction.media?.userId) {
      await this.prisma.queuedPayout.create({
        data: {
          userId: transaction.media.userId,
          transactionId: transaction.id,
          amount: calculatedAmounts.artistAmount,
          currency: transaction.currency,
          type: 'ARTIST_PAYOUT',
          status: 'QUEUED',
          reason: 'Insufficient float balance',
          retryCount: 0,
        },
      });
    }

    // Queue reseller payout
    if (transaction.isResellerSale && calculatedAmounts.resellerAmount > 0) {
      const commission = transaction.commissions?.[0];
      if (commission) {
        await this.prisma.queuedPayout.create({
          data: {
            userId: commission.resellerId,
            transactionId: transaction.id,
            amount: calculatedAmounts.resellerAmount,
            currency: transaction.currency,
            type: 'RESELLER_PAYOUT',
            status: 'QUEUED',
            reason: 'Insufficient float balance',
            retryCount: 0,
          },
        });
      }
    }
  }

  private async queuePayoutForRetry(transactionId: number, userId: number, amount: number, currency: string): Promise<void> {
    await this.prisma.queuedPayout.create({
      data: {
        userId,
        transactionId,
        amount,
        currency: currency as any,
        type: 'RETRY_PAYOUT',
        status: 'QUEUED',
        reason: 'Payout execution failed',
        retryCount: 0,
      },
    });
  }

  private async sendFloatBalanceAlert(currency: string, balance: number): Promise<void> {
    // Send alert to admin/support team
    this.logger.warn(`⚠️ LOW FLOAT BALANCE ALERT: ${currency} ${balance} remaining`);

    // In production, this would send email/SMS to admins
    // For now, just log it
    await this.prisma.systemAlert.create({
      data: {
        type: 'FLOAT_BALANCE_LOW',
        message: `Float account balance low: ${currency} ${balance}`,
        severity: 'HIGH',
        resolved: false,
      },
    });
  }

  // Method to fund float account when settlement funds become available
  async fundFloatAccount(amount: number, currency: Currency, settlementReference: string): Promise<void> {
    const updatedAccount = await this.prisma.floatAccount.upsert({
      where: { currency },
      update: {
        balance: { increment: amount },
      },
      create: {
        currency,
        balance: amount,
      },
    });

    // Log the funding
    await this.prisma.floatTransaction.create({
      data: {
        floatAccount: { connect: { id: updatedAccount.id } },
        amount,
        currency,
        type: 'FUNDING',
        reason: `Settlement funds: ${settlementReference}`,
        balanceAfter: updatedAccount.balance,
      },
    });

    this.logger.log(`✅ Float account funded: +${currency} ${amount}. New balance: ${await this.getFloatAccountBalance(currency)}`);

    // Process queued payouts now that funds are available
    await this.processQueuedPayouts(currency);
  }

  // Process payouts that were queued due to insufficient float balance
  async processQueuedPayouts(currency: Currency): Promise<void> {
    const queuedPayouts = await this.prisma.queuedPayout.findMany({
      where: {
        currency,
        status: 'QUEUED',
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const payout of queuedPayouts) {
      const currentBalance = await this.getFloatAccountBalance(currency);

      if (currentBalance >= payout.amount) {
        try {
          await this.payoutToUser(
            payout.userId,
            payout.amount,
            payout.currency,
            `Delayed payout for transaction ${payout.transactionId}`,
            payout.transactionId
          );

          await this.deductFromFloatAccount(payout.amount, currency, `QUEUED_${payout.type}`);

          await this.prisma.queuedPayout.update({
            where: { id: payout.id },
            data: {
              status: 'COMPLETED',
              processedAt: new Date(),
            },
          });

          // Update user earnings if artist payout
          if (payout.type === 'ARTIST_PAYOUT') {
            await this.prisma.user.update({
              where: { id: payout.userId },
              data: {
                totalEarnings: { increment: payout.amount },
              },
            });
          }

          // Update commission if reseller payout
          if (payout.type === 'RESELLER_PAYOUT') {
            const commission = await this.prisma.commission.findFirst({
              where: { resellerId: payout.userId, transactionId: payout.transactionId },
            });

            if (commission) {
              await this.prisma.commission.update({
                where: { id: commission.id },
                data: {
                  status: 'PAID',
                  isPaid: true,
                  paidAt: new Date(),
                },
              });
            }
          }

          this.logger.log(`✅ Processed queued payout: ${payout.type} for user ${payout.userId}, amount ${payout.amount}`);
        } catch (error) {
          this.logger.error(`Failed to process queued payout ${payout.id}:`, error);

          await this.prisma.queuedPayout.update({
            where: { id: payout.id },
            data: {
              status: 'FAILED',
              retryCount: { increment: 1 },
              lastError: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      } else {
        this.logger.warn(`Still insufficient balance for queued payout ${payout.id}. Required: ${payout.amount}, Available: ${currentBalance}`);
        break; // Stop processing if we don't have enough for the next payout
      }
    }
  }

  async getTransaction(id: number) {
    return await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        media: true,
        resellerLink: true,
        commissions: true,
      },
    });
  }

  async convertCurrency(conversionDto: CurrencyConversionDto) {
    const apiKey = process.env.CURRENCY_API_KEY;
    const response = await firstValueFrom(
      this.httpService.get(`https://api.currencyapi.com/v3/latest`, {
        params: {
          apikey: apiKey,
          base_currency: conversionDto.fromCurrency,
          currencies: conversionDto.toCurrency,
        },
      })
    );

    const rate = response.data.data[conversionDto.toCurrency].value;
    const convertedAmount = conversionDto.amount * rate;

    await this.prisma.currencyExchange.upsert({
      where: {
        fromCurrency_toCurrency: {
          fromCurrency: conversionDto.fromCurrency as any,
          toCurrency: conversionDto.toCurrency as any,
        },
      },
      update: {
        rate,
        lastUpdated: new Date(),
      },
      create: {
        fromCurrency: conversionDto.fromCurrency as any,
        toCurrency: conversionDto.toCurrency as any,
        rate,
      },
    });

    return {
      originalAmount: conversionDto.amount,
      convertedAmount,
      rate,
      fromCurrency: conversionDto.fromCurrency,
      toCurrency: conversionDto.toCurrency,
    };
  }

  private generateReference(): string {
    return `TRX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

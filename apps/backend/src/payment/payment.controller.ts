import { Controller, Post, Body, Get, Param, Query, Headers } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { PaymentService } from './payment.service';
import { CreateTransactionDto, ProcessPaymentDto, CurrencyConversionDto } from './dto/create-transaction.dto';

@Controller('v1/payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

@Post('transaction')
async createTransaction(
  @Body() createTransactionDto: CreateTransactionDto,
  @Headers('user-id') userId: string
) {
  const parsedUserId = parseInt(userId);
  return this.paymentService.createTransaction(
    createTransactionDto,
    isNaN(parsedUserId) ? 1 : parsedUserId // fallback to user 1 if not provided
  );
}

  @Post('process/mobile/:provider')
  async processMobilePayment(
    @Param('provider') provider: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ) {
    return this.paymentService.processMobileMoneyPayment(processPaymentDto, provider);
  }

  @Post('subscription-transaction')
  async createSubscriptionTransaction(
    @Body() body: { plan: string; amount: number; currency: string; provider: string },
    @Headers('user-id') userId: string,
  ) {
    return this.paymentService.createSubscriptionTransaction(
      parseInt(userId),
      body.plan,
      body.amount,
      body.currency.toUpperCase() as Currency,
      body.provider,
    );
  }

  @Post('currency/convert')
  async convertCurrency(@Body() conversionDto: CurrencyConversionDto) {
    return this.paymentService.convertCurrency(conversionDto);
  }

  @Get('test-mtn-token')
  async testMtnToken(): Promise<any> {
    const token = await this.paymentService.getMTNAccessToken();
    return { token };
  }

  @Get('test-zamtel-token')
  async testZamtelToken(): Promise<any> {
    const token = await this.paymentService.getZamtelAccessToken();
    return { token };
  }

  @Get('transaction/:id')
  async getTransaction(@Param('id') id: string) {
    return this.paymentService.getTransaction(parseInt(id));
  }

  // Float Account Management Endpoints
  @Get('float/balance/:currency')
  async getFloatBalance(@Param('currency') currency: string) {
    const normalizedCurrency = currency.toUpperCase() as Currency;
    const balance = await this.paymentService.getFloatAccountBalance(normalizedCurrency);
    return { currency: normalizedCurrency, balance };
  }

  @Post('float/fund')
  async fundFloatAccount(
    @Body() body: { amount: number; currency: string; settlementReference: string }
  ) {
    const normalizedCurrency = body.currency.toUpperCase() as Currency;
    await this.paymentService.fundFloatAccount(
      body.amount,
      normalizedCurrency,
      body.settlementReference
    );
    return { message: 'Float account funded successfully' };
  }

  @Post('float/process-queued')
  async processQueuedPayouts(@Body() body: { currency: string }) {
    const normalizedCurrency = body.currency.toUpperCase() as Currency;
    await this.paymentService.processQueuedPayouts(normalizedCurrency);
    return { message: 'Queued payouts processed' };
  }
}
import { Controller, Post, Body, Get, Param, Query, Headers } from '@nestjs/common';
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

  @Post('currency/convert')
  async convertCurrency(@Body() conversionDto: CurrencyConversionDto) {
    return this.paymentService.convertCurrency(conversionDto);
  }

  @Get('test-mtn-token')
  async testMtnToken(): Promise<any> {
    const token = await this.paymentService.getMTNAccessToken();
    return { token };
  }

  @Get('transaction/:id')
  async getTransaction(@Param('id') id: string) {
    return this.paymentService.getTransaction(parseInt(id));
  }
}
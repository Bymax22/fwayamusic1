import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { Currency, PaymentProvider, SubscriptionPlan } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plan: SubscriptionPlan;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsEnum(PaymentProvider)
  @IsOptional()
  provider?: PaymentProvider;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

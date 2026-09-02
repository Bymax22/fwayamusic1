import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../db/prisma.module';
import { CommissionModule } from '../commission/commission.module';
import { PricingModule } from '../pricing/pricing.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [HttpModule, PrismaModule, CommissionModule, PricingModule, SubscriptionModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}
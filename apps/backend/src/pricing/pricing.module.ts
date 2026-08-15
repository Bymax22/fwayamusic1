import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { AdminPricingController } from './admin.controller';

@Module({
  providers: [PricingService],
  controllers: [AdminPricingController],
  exports: [PricingService],
})
export class PricingModule {}

import { Module } from '@nestjs/common';
import { CommissionService } from './commission.service';
import { PrismaModule } from '../db/prisma.module';

@Module({
  imports: [PrismaModule], // <-- Add this
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}
import { Module } from '@nestjs/common';
import { AdvertisingController } from './advertising.controller';
import { AdvertisingService } from './advertising.service';
import { PrismaModule } from '../db/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [AdvertisingController],
  providers: [AdvertisingService],
  exports: [AdvertisingService],
})
export class AdvertisingModule {}

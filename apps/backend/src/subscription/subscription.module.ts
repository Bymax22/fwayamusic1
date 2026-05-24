import { Module } from '@nestjs/common';
import { PrismaModule } from '../db/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionExpiryService } from './subscription-expiry.service';
import { SubscriptionService } from './subscription.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, SubscriptionExpiryService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}

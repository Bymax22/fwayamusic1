import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Injectable()
export class SubscriptionExpiryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SubscriptionExpiryService.name);
  private intervalId?: NodeJS.Timeout;

  constructor(private subscriptionService: SubscriptionService) {}

  async onModuleInit() {
    try {
      await this.subscriptionService.expireExpiredSubscriptions();
    } catch (error) {
      this.logger.error('Failed to expire subscriptions on startup:', error);
    }

    if (!process.env.VERCEL) {
      this.intervalId = setInterval(async () => {
        try {
          await this.subscriptionService.expireExpiredSubscriptions();
        } catch (error) {
          this.logger.error('Failed to expire subscriptions on interval:', error);
        }
      }, 1000 * 60 * 60); // Every hour
    }
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

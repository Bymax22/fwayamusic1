import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionService } from './subscription.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { Currency } from '@prisma/client';

@Controller('v1/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @UseGuards(FirebaseAuthGuard)
  @Post('upgrade')
  async upgradeSubscription(@Req() req: any, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionService.upgradeSubscription(
      req.user.id,
      dto.plan,
      dto.amount,
      dto.currency ?? Currency.USD,
      dto.provider,
      dto.autoRenew ?? false,
    );
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getMySubscription(@Req() req: any) {
    await this.subscriptionService.refreshUserPremiumStatus(req.user.id);
    return this.subscriptionService.getLatestSubscription(req.user.id);
  }

  @Post('expire')
  async expireSubscriptions() {
    return this.subscriptionService.expireExpiredSubscriptions();
  }
}

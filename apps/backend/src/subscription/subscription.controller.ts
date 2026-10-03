import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
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

  @UseGuards(FirebaseAuthGuard)
  @Post('mobile/sync')
  async syncMobileSubscription(@Req() req: any) {
    return this.subscriptionService.syncRevenueCatEntitlement(req.user.id);
  }

  @Post('revenuecat/webhook')
  async handleRevenueCatWebhook(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const expectedAuthorization = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION;
    if (!expectedAuthorization) {
      throw new ServiceUnavailableException('RevenueCat webhooks are not configured');
    }
    if (
      !authorization ||
      Buffer.byteLength(authorization) !== Buffer.byteLength(expectedAuthorization) ||
      !timingSafeEqual(Buffer.from(authorization), Buffer.from(expectedAuthorization))
    ) {
      throw new UnauthorizedException('Invalid RevenueCat webhook authorization');
    }
    if (
      !body ||
      typeof body !== 'object' ||
      !('event' in body) ||
      !body.event ||
      typeof body.event !== 'object'
    ) {
      throw new BadRequestException('RevenueCat webhook event is missing');
    }

    const event = body.event;
    const candidateIds: unknown[] = [
      'app_user_id' in event ? event.app_user_id : null,
      'original_app_user_id' in event ? event.original_app_user_id : null,
      ...('transferred_from' in event && Array.isArray(event.transferred_from)
        ? event.transferred_from
        : []),
      ...('transferred_to' in event && Array.isArray(event.transferred_to)
        ? event.transferred_to
        : []),
    ];
    const userIds = Array.from(
      new Set(
        candidateIds
          .filter((id): id is string => typeof id === 'string' && /^\d+$/.test(id))
          .map(Number)
          .filter((id) => Number.isSafeInteger(id) && id > 0),
      ),
    );
    if (userIds.length === 0) {
      throw new BadRequestException('RevenueCat webhook does not identify a Fwaya account');
    }

    await Promise.all(userIds.map((userId) =>
      this.subscriptionService.syncRevenueCatEntitlement(userId),
    ));
    return { processedUserCount: userIds.length };
  }

  @Post('expire')
  async expireSubscriptions() {
    return this.subscriptionService.expireExpiredSubscriptions();
  }
}

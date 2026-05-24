import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { Currency, PaymentProvider, SubscriptionPlan, SubscriptionStatus, UserRole } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  private getDurationDays(plan: SubscriptionPlan) {
    switch (plan) {
      case SubscriptionPlan.DAILY:
        return 1;
      case SubscriptionPlan.WEEKLY:
        return 7;
      case SubscriptionPlan.MONTHLY:
        return 30;
      case SubscriptionPlan.YEARLY:
        return 365;
      default:
        throw new BadRequestException('Unsupported subscription plan');
    }
  }

  private getExpiryDate(start: Date, plan: SubscriptionPlan) {
    const days = this.getDurationDays(plan);
    const expiry = new Date(start.getTime());
    expiry.setDate(expiry.getDate() + days);
    return expiry;
  }

  async getLatestSubscription(userId: number) {
    return this.prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upgradeSubscription(
    userId: number,
    plan: SubscriptionPlan,
    amount: number,
    currency: Currency = Currency.USD,
    provider?: PaymentProvider,
    autoRenew = false,
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Subscription amount must be greater than zero');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const now = new Date();
    const startDate = user.premiumUntil && user.premiumUntil > now ? user.premiumUntil : now;
    const expiresAt = this.getExpiryDate(startDate, plan);

    const subscription = await this.prisma.subscription.create({
      data: {
        user: { connect: { id: userId } },
        plan,
        status: SubscriptionStatus.ACTIVE,
        price: amount,
        currency,
        provider,
        autoRenew,
        startedAt: now,
        expiresAt,
        metadata: {
          source: 'account_upgrade',
          requestedAt: now.toISOString(),
        },
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: true,
        premiumUntil: expiresAt,
      },
    });

    await this.notificationService.createNotification(
      userId,
      'Subscription Activated',
      `Your ${plan.toLowerCase()} subscription is active until ${expiresAt.toDateString()}. Premium features are now available.`,
      'SUBSCRIPTION',
      {
        plan,
        expiresAt: expiresAt.toISOString(),
      },
    );

    this.logger.log(`Subscription upgraded for user ${userId}: ${plan} until ${expiresAt.toISOString()}`);
    return subscription;
  }

  async expireExpiredSubscriptions() {
    const now = new Date();
    const expiredSubscriptions = await this.prisma.subscription.findMany({
      where: {
        expiresAt: { lt: now },
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!expiredSubscriptions.length) {
      return { expiredCount: 0 };
    }

    const expiredIds = expiredSubscriptions.map((subscription) => subscription.id);
    const userIds = Array.from(new Set(expiredSubscriptions.map((subscription) => subscription.userId)));

    await this.prisma.$transaction([
      this.prisma.subscription.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: SubscriptionStatus.EXPIRED },
      }),
      this.prisma.user.updateMany({
        where: {
          id: { in: userIds },
          premiumUntil: { lt: now },
        },
        data: {
          isPremium: false,
          premiumUntil: null,
        },
      }),
    ]);

    const notifications = userIds.map((userId) => ({
      userId,
      title: 'Subscription Expired',
      message: 'Your premium subscription has expired. Your account has been reverted to the standard plan.',
      type: 'SUBSCRIPTION_EXPIRED',
      metadata: { expiredAt: now.toISOString() },
    }));

    await this.notificationService.createMany(notifications);

    this.logger.log(`Expired ${expiredIds.length} subscription(s) for ${userIds.length} user(s)`);
    return { expiredCount: expiredIds.length, userCount: userIds.length };
  }

  async refreshUserPremiumStatus(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const now = new Date();
    if (user.premiumUntil && user.premiumUntil < now) {
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id: userId },
          data: { isPremium: false, premiumUntil: null },
        }),
        this.prisma.subscription.updateMany({
          where: {
            userId,
            expiresAt: { lt: now },
            status: SubscriptionStatus.ACTIVE,
          },
          data: { status: SubscriptionStatus.EXPIRED },
        }),
      ]);

      await this.notificationService.createNotification(
        userId,
        'Subscription Expired',
        'Your premium plan has expired and your account has been downgraded to the regular plan.',
        'SUBSCRIPTION_EXPIRED',
        { expiredAt: now.toISOString() },
      );

      return false;
    }

    return user.isPremium;
  }

  async ensureActivePremiumArtistOrProducer(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const now = new Date();
    const premiumRoles = [UserRole.ARTIST, UserRole.PRODUCER] as const;
    if (
      !user ||
      !user.isPremium ||
      !user.premiumUntil ||
      user.premiumUntil < now ||
      !premiumRoles.includes(user.role as typeof premiumRoles[number])
    ) {
      throw new ForbiddenException('This action requires an active premium artist or producer account.');
    }

    return user;
  }
}

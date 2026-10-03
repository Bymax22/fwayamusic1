import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { Currency, NotificationType, PaymentProvider, SubscriptionPlan, SubscriptionStatus, UserRole } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

  async syncRevenueCatEntitlement(userId: number) {
    const apiKey = process.env.REVENUECAT_SECRET_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('Mobile purchases are not configured on the server');
    }

    const entitlementId = process.env.REVENUECAT_PREMIUM_ENTITLEMENT || 'fwaya_premium';
    let response: Response;
    try {
      response = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(String(userId))}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(10_000),
        },
      );
    } catch (error) {
      this.logger.error(
        `RevenueCat entitlement lookup failed for user ${userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      throw new BadGatewayException('Could not verify the mobile purchase with RevenueCat');
    }

    if (!response.ok && response.status !== 404) {
      this.logger.error(`RevenueCat entitlement lookup returned ${response.status} for user ${userId}`);
      throw new BadGatewayException('Could not verify the mobile purchase with RevenueCat');
    }

    const payload: unknown = response.status === 404 ? null : await response.json().catch(() => null);
    if (response.status !== 404 && (!isRecord(payload) || !isRecord(payload.subscriber))) {
      throw new BadGatewayException('RevenueCat returned an invalid subscriber response');
    }

    const subscriber = isRecord(payload) ? payload.subscriber : null;
    const entitlements =
      isRecord(subscriber) && isRecord(subscriber.entitlements)
        ? subscriber.entitlements
        : null;
    const entitlement = entitlements?.[entitlementId] ?? null;
    const now = new Date();
    const expirationValue =
      entitlement && typeof entitlement === 'object' && 'expires_date' in entitlement
        ? entitlement.expires_date
        : null;
    const entitlementExpiry = typeof expirationValue === 'string'
      ? new Date(expirationValue)
      : null;
    if (entitlementExpiry && Number.isNaN(entitlementExpiry.getTime())) {
      throw new BadGatewayException('RevenueCat returned an invalid entitlement expiration');
    }
    const revenueCatActive = Boolean(
      entitlement && (!entitlementExpiry || entitlementExpiry > now),
    );

    const providerSubscriptionId = `revenuecat:${userId}:${entitlementId}`;
    const existingRevenueCatSubscription = await this.prisma.subscription.findFirst({
      where: { userId, providerSubscriptionId },
      select: { id: true, startedAt: true },
    });

    if (revenueCatActive) {
      const productValue =
        entitlement && typeof entitlement === 'object' && 'product_identifier' in entitlement
          ? entitlement.product_identifier
          : null;
      const productId = typeof productValue === 'string' ? productValue.toLowerCase() : '';
      const plan = productId.includes('lifetime')
        ? SubscriptionPlan.LIFETIME
        : productId.includes('year') || productId.includes('annual')
          ? SubscriptionPlan.YEARLY
          : productId.includes('week')
            ? SubscriptionPlan.WEEKLY
            : productId.includes('day')
              ? SubscriptionPlan.DAILY
              : SubscriptionPlan.MONTHLY;
      const expiry = entitlementExpiry || new Date('9999-12-31T23:59:59.999Z');
      const purchaseValue =
        entitlement && typeof entitlement === 'object' && 'purchase_date' in entitlement
          ? entitlement.purchase_date
          : null;
      const purchaseDate =
        typeof purchaseValue === 'string' ? new Date(purchaseValue) : now;
      const startedAt = Number.isNaN(purchaseDate.getTime()) ? now : purchaseDate;
      const metadata = {
        source: 'revenuecat',
        entitlementId,
        productId,
        verifiedAt: now.toISOString(),
      };

      if (existingRevenueCatSubscription) {
        await this.prisma.subscription.update({
          where: { id: existingRevenueCatSubscription.id },
          data: {
            plan,
            status: SubscriptionStatus.ACTIVE,
            currency: Currency.USD,
            expiresAt: expiry,
            metadata,
          },
        });
      } else {
        await this.prisma.subscription.create({
          data: {
            user: { connect: { id: userId } },
            plan,
            status: SubscriptionStatus.ACTIVE,
            price: 0,
            currency: Currency.USD,
            provider: PaymentProvider.OTHER,
            providerSubscriptionId,
            autoRenew: false,
            startedAt,
            expiresAt: expiry,
            metadata,
          },
        });
      }
    } else if (existingRevenueCatSubscription) {
      await this.prisma.subscription.update({
        where: { id: existingRevenueCatSubscription.id },
        data: { status: SubscriptionStatus.EXPIRED, updatedAt: now },
      });
    }

    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      select: { expiresAt: true },
    });
    const subscriptionPremiumUntil = activeSubscriptions.reduce<Date | null>(
      (latest, subscription) =>
        !latest || subscription.expiresAt > latest ? subscription.expiresAt : latest,
      null,
    );
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumUntil: true },
    });
    const preservedManualPremiumUntil =
      !revenueCatActive &&
      !existingRevenueCatSubscription &&
      existingUser?.isPremium &&
      existingUser.premiumUntil &&
      existingUser.premiumUntil > now
        ? existingUser.premiumUntil
        : null;
    const premiumUntil =
      subscriptionPremiumUntil &&
      (!preservedManualPremiumUntil || subscriptionPremiumUntil > preservedManualPremiumUntil)
        ? subscriptionPremiumUntil
        : preservedManualPremiumUntil || subscriptionPremiumUntil;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: premiumUntil !== null,
        premiumUntil,
      },
      select: { id: true, isPremium: true, premiumUntil: true },
    });

    return user;
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
      NotificationType.SYSTEM,
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

    const notifications: Array<{ userId: number; title: string; message: string; type: NotificationType; metadata: any }> = userIds.map((userId) => ({
      userId,
      title: 'Subscription Expired',
      message: 'Your premium subscription has expired. Your account has been reverted to the standard plan.',
      type: NotificationType.SYSTEM,
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
        NotificationType.SYSTEM,
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

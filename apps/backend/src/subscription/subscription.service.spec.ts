import { Currency, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionService RevenueCat synchronization', () => {
  const originalApiKey = process.env.REVENUECAT_SECRET_API_KEY;
  const originalEntitlement = process.env.REVENUECAT_PREMIUM_ENTITLEMENT;

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalApiKey === undefined) delete process.env.REVENUECAT_SECRET_API_KEY;
    else process.env.REVENUECAT_SECRET_API_KEY = originalApiKey;
    if (originalEntitlement === undefined) delete process.env.REVENUECAT_PREMIUM_ENTITLEMENT;
    else process.env.REVENUECAT_PREMIUM_ENTITLEMENT = originalEntitlement;
  });

  it('verifies an active entitlement with RevenueCat and links it to the Fwaya user', async () => {
    process.env.REVENUECAT_SECRET_API_KEY = 'test-secret';
    process.env.REVENUECAT_PREMIUM_ENTITLEMENT = 'fwaya_premium';
    const expiresAt = new Date(Date.now() + 86_400_000);
    const prisma = {
      subscription: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 7 }),
        findMany: jest.fn().mockResolvedValue([{ expiresAt }]),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ isPremium: false, premiumUntil: null }),
        update: jest.fn().mockResolvedValue({
          id: 17,
          isPremium: true,
          premiumUntil: expiresAt,
        }),
      },
    };
    const revenueCatResponse = {
      subscriber: {
        entitlements: {
          fwaya_premium: {
            expires_date: expiresAt.toISOString(),
            product_identifier: 'fwaya_monthly',
            purchase_date: new Date().toISOString(),
          },
        },
      },
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => revenueCatResponse,
    } as Response);
    const service = new SubscriptionService(prisma as any, {} as any);

    await expect(service.syncRevenueCatEntitlement(17)).resolves.toEqual({
      id: 17,
      isPremium: true,
      premiumUntil: expiresAt,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.revenuecat.com/v1/subscribers/17',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-secret' }),
      }),
    );
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plan: SubscriptionPlan.MONTHLY,
          status: SubscriptionStatus.ACTIVE,
          currency: Currency.USD,
          providerSubscriptionId: 'revenuecat:17:fwaya_premium',
          metadata: expect.objectContaining({ source: 'revenuecat' }),
        }),
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 17 },
        data: { isPremium: true, premiumUntil: expiresAt },
      }),
    );
  });

  it('removes access when RevenueCat reports no subscriber entitlements', async () => {
    process.env.REVENUECAT_SECRET_API_KEY = 'test-secret';
    const prisma = {
      subscription: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ isPremium: false, premiumUntil: null }),
        update: jest.fn().mockResolvedValue({
          id: 17,
          isPremium: false,
          premiumUntil: null,
        }),
      },
    };
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);
    const service = new SubscriptionService(prisma as any, {} as any);

    await expect(service.syncRevenueCatEntitlement(17)).resolves.toEqual({
      id: 17,
      isPremium: false,
      premiumUntil: null,
    });
    expect(prisma.subscription.create).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isPremium: false, premiumUntil: null },
      }),
    );
  });
});

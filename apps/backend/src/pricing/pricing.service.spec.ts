import PricingService from './pricing.service';

// Minimal mock Prisma (not used by the tested pure methods)
const mockPrisma = { businessSetting: { findUnique: async () => null } };

describe('PricingService', () => {
  const svc = new PricingService(mockPrisma);

  test('VAT extraction and shareable amount for K10 with 16% VAT and 5% provision', () => {
    const sellingPrice = 10.0;
    const vatRate = 16;
    const provisionPercent = 5;

    const { priceBeforeVat, vat } = svc.extractVatInclusiveAmount(sellingPrice, vatRate);
    // priceBeforeVat ~ 8.620689655172414 -> rounded display 8.62
    expect(parseFloat(priceBeforeVat.toFixed(2))).toBeCloseTo(8.62, 2);
    expect(parseFloat(vat.toFixed(2))).toBeCloseTo(1.38, 2);

    const provision = svc.calculatePaymentProvision(sellingPrice, provisionPercent);
    expect(parseFloat(provision.toFixed(2))).toBeCloseTo(0.5, 2);

    const { vat: vat2, provision: prov2, shareable } = svc.calculateShareableAmount(sellingPrice, vatRate, provisionPercent);
    expect(parseFloat(vat2.toFixed(2))).toBeCloseTo(1.38, 2);
    expect(parseFloat(prov2.toFixed(2))).toBeCloseTo(0.5, 2);
    expect(parseFloat(shareable.toFixed(2))).toBeCloseTo(8.12, 2);
  });

  test('Protected payouts for K10 example using 65/20/15 shares', () => {
    const directPrice = 10.0;
    const vatRate = 16;
    const provisionPercent = 5;
    const artistSharePercent = 65;
    const resellerSharePercent = 20;
    const fwayaSharePercent = 15;

    const res = svc.calculateProtectedPayouts(directPrice, vatRate, provisionPercent, artistSharePercent, resellerSharePercent, fwayaSharePercent);
    // Shareable ~ 8.12
    expect(parseFloat(res.shareable.toFixed(2))).toBeCloseTo(8.12, 2);
    expect(parseFloat(res.protectedArtistPayout.toFixed(2))).toBeCloseTo(5.28, 2);
    expect(parseFloat(res.approvedResellerEarning.toFixed(2))).toBeCloseTo(1.62, 2);
    expect(parseFloat(res.fwayaStandardShare.toFixed(2))).toBeCloseTo(1.22, 2);
  });

  test('validate reseller discount fails when it reduces margin below min', () => {
    const directPrice = 10;
    const resellerPrice = 1; // absurdly low
    const vatRate = 16;
    const provisionPercent = 5;
    const protectedArtistPayout = 5.28;
    const approvedResellerEarning = 1.62;
    const minMargin = 0.5;

    const validation = svc.validateResellerDiscount({ directPrice, resellerPrice, vatRate, provisionPercent, protectedArtistPayout, approvedResellerEarning, minFwayaMargin: minMargin });
    expect(validation.valid).toBe(false);
  });
});

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private prisma: PrismaService) {}

  async getBusinessSettingFloat(key: string, fallback = 0): Promise<number> {
    const setting = await this.prisma.businessSetting.findUnique({ where: { key } });
    if (!setting) return fallback;
    const v = parseFloat(setting.value);
    return isNaN(v) ? fallback : v;
  }

  // Extract VAT from a VAT-inclusive price. vatRate is a percent (e.g., 16 for 16%)
  extractVatInclusiveAmount(sellingPrice: number, vatRate: number) {
    const divisor = 1 + vatRate / 100;
    const priceBeforeVat = sellingPrice / divisor;
    const vat = sellingPrice - priceBeforeVat;
    return { priceBeforeVat, vat };
  }

  calculatePaymentProvision(sellingPrice: number, provisionPercent: number) {
    return (sellingPrice * provisionPercent) / 100;
  }

  calculateShareableAmount(sellingPrice: number, vatRate: number, provisionPercent: number) {
    const { vat } = this.extractVatInclusiveAmount(sellingPrice, vatRate);
    const provision = this.calculatePaymentProvision(sellingPrice, provisionPercent);
    const shareable = sellingPrice - vat - provision;
    return { vat, provision, shareable };
  }

  // Standard shareable at direct price and protected payouts
  calculateProtectedPayouts(directPrice: number, vatRate: number, provisionPercent: number, artistSharePercent: number, resellerSharePercent: number, fwayaSharePercent: number) {
    const { vat, provision, shareable } = this.calculateShareableAmount(directPrice, vatRate, provisionPercent);
    const protectedArtistPayout = parseFloat((shareable * (artistSharePercent / 100)).toFixed(2));
    const approvedResellerEarning = parseFloat((shareable * (resellerSharePercent / 100)).toFixed(2));
    const fwayaStandardShare = parseFloat((shareable * (fwayaSharePercent / 100)).toFixed(2));
    return { vat, provision, shareable, protectedArtistPayout, approvedResellerEarning, fwayaStandardShare };
  }

  // Validate that a reseller discount does not break minimum margin
  validateResellerDiscount(params: { directPrice: number; resellerPrice: number; vatRate: number; provisionPercent: number; protectedArtistPayout: number; approvedResellerEarning: number; minFwayaMargin: number; }) {
    const { resellerPrice, vatRate, provisionPercent, protectedArtistPayout, approvedResellerEarning, minFwayaMargin } = params;
    const { vat } = this.extractVatInclusiveAmount(resellerPrice, vatRate);
    const provision = this.calculatePaymentProvision(resellerPrice, provisionPercent);
    const actualShareable = resellerPrice - vat - provision;
    const required = protectedArtistPayout + approvedResellerEarning + minFwayaMargin;
    return { actualShareable, required, valid: actualShareable >= required };
  }

  // Convenience: compute derived transaction splits for a given charging amount using protected values
  computeActualSplits(chargingAmount: number, vatRate: number, provisionPercent: number, protectedArtistPayout: number, approvedResellerEarning: number) {
    const { vat } = this.extractVatInclusiveAmount(chargingAmount, vatRate);
    const provision = this.calculatePaymentProvision(chargingAmount, provisionPercent);
    const actualShareable = chargingAmount - vat - provision;
    const artist = protectedArtistPayout;
    const reseller = approvedResellerEarning || 0;
    const platform = parseFloat((actualShareable - artist - reseller).toFixed(2));
    return { vat: parseFloat(vat.toFixed(2)), provision: parseFloat(provision.toFixed(2)), actualShareable: parseFloat(actualShareable.toFixed(2)), artist, reseller, platform };
  }
}

export default PricingService;

import { Controller, Get, Post, Body, Param, Put, Delete, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PricingService } from './pricing.service';

@Controller('admin/pricing')
export class AdminPricingController {
  constructor(private prisma: PrismaService, private pricingService: PricingService) {}

  // PriceTier CRUD
  @Get('price-tiers')
  async listPriceTiers() {
    return this.prisma.priceTier.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Get('price-tiers/:id')
  async getPriceTier(@Param('id') id: string) {
    const tier = await this.prisma.priceTier.findUnique({ where: { id: Number(id) } });
    if (!tier) throw new BadRequestException('PriceTier not found');
    return tier;
  }

  @Post('price-tiers')
  async createPriceTier(@Body() body: any) {
    const { productTypeId, name, directPrice, resellerDiscount, minPrice, maxPrice, active, resellerAllowed, attributionPeriodDays, effectiveFrom, effectiveTo } = body;

    // If activating a video price tier, validate minimum FWAYA margin (simple check)
    if (active) {
      const productType = await this.prisma.productType.findUnique({ where: { id: productTypeId } });
      if (productType && /video/i.test(productType.name)) {
        const vatRate = await this.pricingService.getBusinessSettingFloat('VAT_RATE', 16);
        const paymentProvisionPercent = await this.pricingService.getBusinessSettingFloat('PAYMENT_PROVISION_PERCENT', 5);
        const artistSharePercentReseller = await this.pricingService.getBusinessSettingFloat('ARTIST_SHARE_PERCENT_RESELLER', 65);
        const resellerSharePercent = await this.pricingService.getBusinessSettingFloat('RESELLER_SHARE_PERCENT', 20);
        const fwayaSharePercentReseller = await this.pricingService.getBusinessSettingFloat('FWAYA_SHARE_PERCENT', 15);
        const minFwayaMargin = await this.pricingService.getBusinessSettingFloat('MIN_FWAYA_MARGIN', 0);

        const protectedVals = this.pricingService.calculateProtectedPayouts(directPrice, vatRate, paymentProvisionPercent, artistSharePercentReseller, resellerSharePercent, fwayaSharePercentReseller);
        // Ensure FWAYA standard share can at least meet the configured minimum margin
        if (protectedVals.fwayaStandardShare < minFwayaMargin) {
          throw new BadRequestException('Video price tier cannot be activated because expected FWAYA share does not meet minimum FWAYA margin');
        }
      }
    }

    return this.prisma.priceTier.create({ data: { productTypeId, name, directPrice, effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : undefined, effectiveTo: effectiveTo ? new Date(effectiveTo) : undefined, resellerDiscount: resellerDiscount ?? 0, minPrice, maxPrice, active: active ?? true, resellerAllowed: resellerAllowed ?? true, attributionPeriodDays: attributionPeriodDays ?? 7 } });
  }

  @Put('price-tiers/:id')
  async updatePriceTier(@Param('id') id: string, @Body() body: any) {
    return this.prisma.priceTier.update({ where: { id: Number(id) }, data: body });
  }

  @Delete('price-tiers/:id')
  async deletePriceTier(@Param('id') id: string) {
    await this.prisma.priceTier.delete({ where: { id: Number(id) } });
    return { success: true };
  }

  // Business settings CRUD
  @Get('settings')
  async listSettings() {
    return this.prisma.businessSetting.findMany({ orderBy: { key: 'asc' } });
  }

  @Get('settings/:key')
  async getSetting(@Param('key') key: string) {
    const s = await this.prisma.businessSetting.findUnique({ where: { key } });
    if (!s) throw new BadRequestException('Setting not found');
    return s;
  }

  @Post('settings')
  async createSetting(@Body() body: any) {
    const { key, value } = body;
    return this.prisma.businessSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  @Put('settings/:key')
  async updateSetting(@Param('key') key: string, @Body() body: any) {
    return this.prisma.businessSetting.update({ where: { key }, data: { value: body.value } });
  }

  @Delete('settings/:key')
  async deleteSetting(@Param('key') key: string) {
    await this.prisma.businessSetting.delete({ where: { key } });
    return { success: true };
  }
}

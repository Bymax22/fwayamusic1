import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  InternalServerErrorException,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../db/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { CurrentUser } from '../decorators/user.decorator';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { Request } from 'express';

@Controller('v1/media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  private readonly MAX_FILE_SIZE = 200 * 1024 * 1024;

  constructor(private readonly mediaService: MediaService, private readonly pricingService: PricingService, private readonly prisma: PrismaService) {}

  // Pricing preview for UI: given a price tier or direct price, return calculated values per FWAYA guide
  @Get('pricing/preview')
  async pricingPreview(@Req() req: any) {
    const q = req.query || {};
    const priceTierId = q.priceTierId ? parseInt(q.priceTierId) : undefined;
    const directPrice = q.directPrice ? parseFloat(q.directPrice) : undefined;

    let tier: any = null;
    if (priceTierId) tier = await this.prisma.priceTier.findUnique({ where: { id: priceTierId } });

    const vatRate = await this.pricingService.getBusinessSettingFloat('VAT_RATE', 16);
    const provisionPercent = await this.pricingService.getBusinessSettingFloat('PAYMENT_PROVISION_PERCENT', 5);
    const artistSharePercentReseller = await this.pricingService.getBusinessSettingFloat('ARTIST_SHARE_PERCENT_RESELLER', 65);
    const resellerSharePercent = await this.pricingService.getBusinessSettingFloat('RESELLER_SHARE_PERCENT', 20);
    const fwayaSharePercentReseller = await this.pricingService.getBusinessSettingFloat('FWAYA_SHARE_PERCENT', 15);
    const artistSharePercentDirect = await this.pricingService.getBusinessSettingFloat('ARTIST_SHARE_PERCENT_DIRECT', 75);
    const fwayaSharePercentDirect = await this.pricingService.getBusinessSettingFloat('FWAYA_SHARE_PERCENT_DIRECT', 25);
    const minFwayaMargin = await this.pricingService.getBusinessSettingFloat('MIN_FWAYA_MARGIN', 0);

    const price = tier ? tier.directPrice : (directPrice ?? 0);
    const resellerDiscount = tier ? (tier.resellerDiscount ?? 0) : 0;
    const resellerPrice = Math.max(0, price - resellerDiscount);

    const standard = this.pricingService.calculateShareableAmount(price, vatRate, provisionPercent);
    const protectedVals = this.pricingService.calculateProtectedPayouts(price, vatRate, provisionPercent, artistSharePercentReseller, resellerSharePercent, fwayaSharePercentReseller);

    // resale (discounted) values
    const resellerCalc = this.pricingService.calculateShareableAmount(resellerPrice, vatRate, provisionPercent);
    const resellerValidation = this.pricingService.validateResellerDiscount({ directPrice: price, resellerPrice, vatRate, provisionPercent, protectedArtistPayout: protectedVals.protectedArtistPayout, approvedResellerEarning: protectedVals.approvedResellerEarning, minFwayaMargin });

    return {
      priceTier: tier || null,
      directPrice: parseFloat(price.toFixed(2)),
      resellerDiscount: parseFloat(resellerDiscount.toFixed(2)),
      resellerPrice: parseFloat(resellerPrice.toFixed(2)),
      vatRate,
      provisionPercent,
      standardShareable: parseFloat(standard.shareable.toFixed(2)),
      protectedArtistPayout: parseFloat(protectedVals.protectedArtistPayout.toFixed(2)),
      approvedResellerEarning: parseFloat(protectedVals.approvedResellerEarning.toFixed(2)),
      resellerActualShareable: parseFloat(resellerCalc.shareable.toFixed(2)),
      resellerValidation,
      shares: {
        artistResellerPercent: artistSharePercentReseller,
        resellerPercent: resellerSharePercent,
        fwayaResellerPercent: fwayaSharePercentReseller,
        artistDirectPercent: artistSharePercentDirect,
        fwayaDirectPercent: fwayaSharePercentDirect,
      }
    };
  }

  // Convert Prisma/BigInt values to JSON-safe values
  private sanitizeForJson(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value === 'bigint') {
      // Convert to number when safe, otherwise to string
      try {
        const asNumber = Number(value);
        if (Number.isSafeInteger(asNumber)) return asNumber;
      } catch (_) {}
      return value.toString();
    }
    if (Array.isArray(value)) return value.map((v) => this.sanitizeForJson(v));
    if (typeof value === 'object') {
      const out: any = {};
      for (const k of Object.keys(value)) {
        out[k] = this.sanitizeForJson(value[k]);
      }
      return out;
    }
    return value;
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body(new ValidationPipe({ transform: true, skipMissingProperties: true })) createMediaDto: CreateMediaDto,
    @CurrentUser() user: any
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (file.size > this.MAX_FILE_SIZE) {
        throw new BadRequestException(`File size exceeds limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      if (!user || !user.id) {
        throw new BadRequestException('User authentication required');
      }

      const userId = user.id;
      this.logger.log(`Starting upload for user ${userId}, file: ${file.originalname}, size: ${file.size}`);
      
      const result = await this.mediaService.createMedia(file, userId, createMediaDto);

      this.logger.log(`Upload success for user ${userId}, media ID: ${result.id}`);
      return this.sanitizeForJson(result);
    } catch (error) {
      this.logger.error(`Upload error: ${error instanceof Error ? error.message : error}`, error);
      throw error;
    }
  }

  // Public avatar upload for signup
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    
    // Upload to Cloudinary as avatar
    const uploadResult = await this.mediaService.uploadToCloudinary(file, 'avatar');
    return {
      avatarUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('upload-cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: any
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!user || !user.id) throw new BadRequestException('User authentication required');
    const result = await this.mediaService.uploadCoverAndModerate(file, user.id);
    return result;
  }

  // Cloudinary webhook to receive moderation/async notifications
  @Post('cloudinary-webhook')
  async cloudinaryWebhook(@Req() req: Request) {
    // Cloudinary sends JSON body; pass it to service for handling
    try {
      const body = req.body as any;
      await this.mediaService.handleCloudinaryWebhook(body);
      return { ok: true };
    } catch (err) {
      this.logger.error('Cloudinary webhook handling failed', err instanceof Error ? err.message : String(err));
      throw new InternalServerErrorException('Webhook processing failed');
    }
  }

  // NEW: Save metadata only (file already uploaded to Cloudinary client-side)
  @UseGuards(FirebaseAuthGuard)
  @Post('save-metadata')
  async saveMediaMetadata(
    @Body() metadata: { title: string; type: string; url: string; cloudinaryPublicId: string; duration: number; format: string; resourceType: string; description?: string; genre?: string; releaseDate?: string; isExplicit?: boolean; isPremium?: boolean; coverUrl?: string; releaseType?: string },
    @CurrentUser() user: any
  ) {
    try {
      if (!metadata.title || !metadata.type || !metadata.url) {
        throw new BadRequestException('Missing required fields: title, type, url');
      }

      if (!user || !user.id) {
        throw new BadRequestException('User authentication required');
      }

      const userId = user.id;
      this.logger.log(`Saving metadata for user ${userId}, title: ${metadata.title}, url: ${metadata.url}, coverUrl: ${metadata.coverUrl || 'none'}`);
      
        const result = await this.mediaService.createMediaFromMetadata(userId, metadata);

        this.logger.log(`Metadata saved successfully for user ${userId}, media ID: ${result.id}`);
        return this.sanitizeForJson(result);
    } catch (error) {
      this.logger.error(`Error saving metadata: ${error instanceof Error ? error.message : error}`, error);
      throw error;
    }
  }

  // NEW: Homepage sections endpoint (must come before generic @Get())
  @Get('homepage-sections')
  async getHomepageSections() {
    try {
      const sections = await this.mediaService.getHomepageSections();
      return this.sanitizeForJson(sections);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown homepage sections error';
      this.logger.error(`Homepage sections failed: ${message}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to load homepage sections');
    }
  }

  @Get()
  async getAllMedia() {
    try {
      // Return all public media (for browse page, landing page, etc)
      const media = await this.mediaService.getAllMedia();
      return this.sanitizeForJson(media);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown media fetch error';
      this.logger.error(`Media list fetch failed: ${message}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Failed to load media');
    }
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('user/me')
  async getUserOwnMedia(@CurrentUser() user: any) {
    // Return only authenticated user's media (for artist dashboard)
    if (!user || !user.id) {
      throw new BadRequestException('User authentication required');
    }
    const userId = user.id;
    const media = await this.mediaService.getUserMedia(userId);
    return this.sanitizeForJson(media);
  }

  @Get(':id')
  async getMediaById(@Param('id') id: string) {
    const media = await this.mediaService.getMediaById(parseInt(id));
    return this.sanitizeForJson(media);
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':id')
  async deleteMedia(@Param('id') id: string, @CurrentUser() user: any) {
    if (!user || !user.id) {
      throw new BadRequestException('User authentication required');
    }
    const userId = user.id;
    const result = await this.mediaService.deleteMedia(parseInt(id), userId);
    return this.sanitizeForJson(result);
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch(':id')
  async updateMedia(
    @Param('id') id: string,
    @Body() updates: Partial<CreateMediaDto>,
    @CurrentUser() user: any
  ) {
    if (!user || !user.id) {
      throw new BadRequestException('User authentication required');
    }
    const userId = user.id;
    const updated = await this.mediaService.updateMedia(parseInt(id), userId, updates);
    return this.sanitizeForJson(updated);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post(':id/accept-pricing')
  async acceptPricing(@Param('id') id: string, @Body() body: { priceTierId?: number }, @CurrentUser() user: any) {
    if (!user || !user.id) {
      throw new BadRequestException('User authentication required');
    }
    const userId = user.id;
    const snapshot = await this.mediaService.acceptPricingArrangement(parseInt(id), userId, body?.priceTierId);
    return this.sanitizeForJson(snapshot);
  }
}
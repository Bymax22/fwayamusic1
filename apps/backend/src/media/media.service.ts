import { ForbiddenException, Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { PricingService } from '../pricing/pricing.service';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { MediaType, MediaAccessType, NotificationType, UserRole, ModerationStatus } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventsGateway: EventsGateway,
    private readonly pricingService: PricingService,
  ) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      this.logger.log('Cloudinary configured successfully');
    } catch (error) {
      this.logger.error('Failed to configure Cloudinary:', error);
    }
  }

  // Artist accepts a pricing arrangement for their media: create pricing snapshot and link it
  async acceptPricingArrangement(mediaId: number, userId: number, priceTierId?: number) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new InternalServerErrorException('Media not found');
    if (media.userId !== userId) throw new ForbiddenException('You can only accept pricing for your own media');

    // Determine price tier and direct price
    let priceTier = null;
    if (priceTierId) {
      priceTier = await this.prisma.priceTier.findUnique({ where: { id: priceTierId } });
      if (!priceTier) throw new BadRequestException('Price tier not found');
    } else if (media.priceTierId) {
      priceTier = await this.prisma.priceTier.findUnique({ where: { id: media.priceTierId } });
    }

    const directPrice = priceTier ? priceTier.directPrice : (media.price ?? 0);
    const resellerDiscount = priceTier ? priceTier.resellerDiscount : (media.resellerCommissionRate ?? 0);

    // Load business settings
    const vatRate = await this.pricingService.getBusinessSettingFloat('VAT_RATE', 16);
    const paymentProvisionPercent = await this.pricingService.getBusinessSettingFloat('PAYMENT_PROVISION_PERCENT', 5);
    const artistSharePercentReseller = await this.pricingService.getBusinessSettingFloat('ARTIST_SHARE_PERCENT_RESELLER', 65);
    const resellerSharePercent = await this.pricingService.getBusinessSettingFloat('RESELLER_SHARE_PERCENT', 20);
    const fwayaSharePercentReseller = await this.pricingService.getBusinessSettingFloat('FWAYA_SHARE_PERCENT', 15);
    // Direct-sale shares
    const artistSharePercentDirect = await this.pricingService.getBusinessSettingFloat('ARTIST_SHARE_PERCENT_DIRECT', 75);
    const fwayaSharePercentDirect = await this.pricingService.getBusinessSettingFloat('FWAYA_SHARE_PERCENT_DIRECT', 25);
    const minFwayaMargin = await this.pricingService.getBusinessSettingFloat('MIN_FWAYA_MARGIN', 0);

    // Calculate protected amounts
    // For pricing snapshot, persist both direct-sale shares and reseller arrangement shares
    const protectedVals = this.pricingService.calculateProtectedPayouts(directPrice, vatRate, paymentProvisionPercent, artistSharePercentReseller, resellerSharePercent, fwayaSharePercentReseller);

    // Create pricing snapshot
    const snapshot = await this.prisma.pricingSnapshot.create({
      data: {
        mediaId: media.id,
        priceTierId: priceTier ? priceTier.id : undefined,
        directPrice,
        resellerDiscount,
        protectedArtistPayout: protectedVals.protectedArtistPayout,
        approvedResellerEarning: protectedVals.approvedResellerEarning,
        vatRate,
        paymentProvisionPercent,
        // store direct-sale shares as the main artist/fwaya shares for readability
        artistSharePercent: artistSharePercentDirect,
        resellerSharePercent,
        fwayaSharePercent: fwayaSharePercentDirect,
        minFwayaMargin,
      }
    });

    // Update media to reference accepted pricing snapshot and price tier
    await this.prisma.media.update({ where: { id: media.id }, data: { priceTierId: priceTier ? priceTier.id : undefined, acceptedPricingSnapshotId: snapshot.id } });

    return snapshot;
  }

  // Upload file using base64 encoding (proven to work, simpler than streaming)
  async uploadToCloudinary(file: Express.Multer.File, type: 'avatar' | 'media' = 'media'): Promise<UploadApiResponse> {
    const folder = type === 'avatar' ? 'fwaya-avatars' : 'fwaya-media';
    const resourceType = type === 'avatar' ? 'image' : 'auto';
    
    try {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder,
          resource_type: resourceType,
          public_id: type === 'avatar' 
            ? `avatar_${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, "")}`
            : file.originalname.replace(/\.[^/.]+$/, ""),
          quality: 'auto',
          width: type === 'avatar' ? 200 : undefined,
          height: type === 'avatar' ? 200 : undefined,
          crop: type === 'avatar' ? 'fill' : undefined,
        }
      );
      return uploadResult;
    } catch (error) {
      throw new InternalServerErrorException(
        `Cloudinary upload failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // New: upload cover image, run moderation and generate social-sized derivative
  async uploadCoverAndModerate(file: Express.Multer.File, userId: number) {
    // Basic validations
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Unsupported image format');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Cover image too large (max 5MB)');
    }

    // Upload to Cloudinary with eager transformation for OG image
    try {
      const uploadRes = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: 'fwaya-covers',
          resource_type: 'image',
          quality: 'auto',
          eager: [
            { width: 1200, height: 630, crop: 'fill', format: 'jpg', quality: 'auto' },
            { width: 400, height: 400, crop: 'fill', format: 'webp', quality: 'auto' }
          ],
          moderation: 'aws_rek',
          allowed_formats: ['jpg','jpeg','png','webp']
        }
      );

      // Cloudinary returns moderation info in uploadRes.moderation
      const moderation: any = uploadRes.moderation && (Array.isArray(uploadRes.moderation) ? uploadRes.moderation[0] : uploadRes.moderation);
      // Auto-approve unless explicit rejection; system will only mark REJECTED when provider rejects
      const isRejected = moderation && moderation.status === 'rejected';

      // Extract OG-ready derivative from eager transforms (1200x630) if present
      const eager = uploadRes.eager || [];
      let ogEntry: any = null;
      if (Array.isArray(eager) && eager.length > 0) {
        ogEntry = eager.find((e: any) => (e.width >= 1200 && e.height >= 630) || (e.format && e.format === 'jpg')) || eager[0];
      }

      const coverData: any = {
        userId,
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        format: uploadRes.format,
        width: uploadRes.width,
        height: uploadRes.height,
        moderationStatus: isRejected ? 'REJECTED' : 'APPROVED',
        moderationResponse: JSON.stringify(uploadRes.moderation || {}),
      };

      if (ogEntry && ogEntry.secure_url) {
        coverData.ogUrl = ogEntry.secure_url;
        if (ogEntry.public_id) coverData.ogPublicId = ogEntry.public_id;
      }

      // Create DB entry for the cover asset (auto-publish unless explicitly rejected)
      const cover = await this.prisma.cover.create({ data: coverData });

      if (isRejected) {
        this.logger.warn(`Cover image explicitly rejected by moderation for user ${userId}: ${uploadRes.public_id}`);
      }

      // Return available derivatives (use eager results if present)
      const derivatives = eager.map((e: any) => ({ url: e.secure_url, width: e.width, height: e.height, format: e.format }));
      return { cover, derivatives };
    } catch (err) {
      this.logger.error('Cover upload failed', err);
      throw new InternalServerErrorException('Cover upload failed');
    }
  }

  // Handle Cloudinary webhook payloads (moderation/processing updates)
  async handleCloudinaryWebhook(payload: any) {
    try {
      // Try extract public_id from common payload shapes
      const publicId = payload.public_id || payload.resource && payload.resource.public_id || payload.data && payload.data.public_id;
      if (!publicId) {
        this.logger.warn('Cloudinary webhook received without public_id');
        return;
      }

      // moderation info may exist at payload.moderation or payload.resource.moderation
      const moderation = payload.moderation || (payload.resource && payload.resource.moderation) || (payload.data && payload.data.moderation);
      let status: string | null = null;
      if (Array.isArray(moderation) && moderation.length > 0) {
        status = moderation[0].status;
      } else if (moderation && moderation.status) {
        status = moderation.status;
      }

      const cover = await this.prisma.cover.findFirst({ where: { publicId } });
      if (!cover) {
        this.logger.warn(`Webhook: cover not found for publicId ${publicId}`);
        return;
      }

      if (!status) {
        this.logger.log(`Webhook: no moderation status for ${publicId}`);
        return;
      }

      let newStatus: any = 'PENDING';
      if (status === 'approved') newStatus = 'APPROVED';
      else if (status === 'rejected') newStatus = 'REJECTED';
      else newStatus = 'UNDER_REVIEW';

      // If approved, attempt to fetch eager derivatives to ensure OG URL is stored
      const updateData: any = { moderationStatus: newStatus, moderationResponse: JSON.stringify(moderation) };
      if (newStatus === 'APPROVED') {
        try {
          const resource = await (cloudinary.api as any).resource(publicId, { resource_type: 'image' });
          const eagerList = resource.eager || resource.derived || [];
          if (Array.isArray(eagerList) && eagerList.length > 0) {
            const ogEntry = eagerList.find((e: any) => (e.width >= 1200 && e.height >= 630) || (e.format && e.format === 'jpg')) || eagerList[0];
            if (ogEntry && ogEntry.secure_url) {
              updateData.ogUrl = ogEntry.secure_url;
              if (ogEntry.public_id) updateData.ogPublicId = ogEntry.public_id;
            }
          }
        } catch (e) {
          this.logger.warn(`Failed to fetch resource for ${publicId} to populate OG derivative: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      await this.prisma.cover.update({ where: { id: cover.id }, data: updateData });
      this.logger.log(`Updated cover ${cover.id} moderation status -> ${newStatus}`);
    } catch (err) {
      this.logger.error('Failed to handle Cloudinary webhook', err);
      throw err;
    }
  }

  // Admin actions for covers
  async listPendingCovers() {
    return this.prisma.cover.findMany({ where: { moderationStatus: 'PENDING' }, orderBy: { createdAt: 'desc' } });
  }

  async approveCover(coverId: number, reviewerId: number) {
    const cover = await this.prisma.cover.findUnique({ where: { id: coverId } });
    if (!cover) throw new Error('Cover not found');
    await this.prisma.cover.update({ where: { id: coverId }, data: { moderationStatus: 'APPROVED' } });
    // Optionally link to user's profile as default cover
    return { ok: true };
  }

  async rejectCover(coverId: number, reviewerId: number, reason: string) {
    const cover = await this.prisma.cover.findUnique({ where: { id: coverId } });
    if (!cover) throw new Error('Cover not found');
    // Try delete from Cloudinary (best-effort)
    try {
      await cloudinary.uploader.destroy(cover.publicId, { resource_type: 'image' });
    } catch (e) {
      this.logger.warn('Failed to destroy cover on Cloudinary', e);
    }
    await this.prisma.cover.update({ where: { id: coverId }, data: { moderationStatus: 'REJECTED' } });
    // Note: contentModeration.create expects a mediaId (media table) which doesn't apply to covers.
    // For now, log the rejection for audit purposes and skip creating a contentModeration record.
    this.logger.log(`Cover ${coverId} rejected by reviewer ${reviewerId}; reason: ${reason}`);
    return { ok: true };
  }

  // Check video content for inappropriate material using Cloudinary's moderation API
  async checkVideoModeration(publicId: string): Promise<{ flagged: boolean; flags: string[] }> {
    try {
      this.logger.log(`Starting content moderation check for: ${publicId}`);
      
      // Use Cloudinary's moderation API to check the video
      const response = await (cloudinary.api as any).call("get", `/resources/video/${publicId}`, {
        moderation_status: true,
        tags: true,
      });

      const moderationData = response.moderation && response.moderation[response.moderation.length - 1];
      
      if (!moderationData) {
        this.logger.log(`No moderation data available for ${publicId}, allowing upload`);
        return { flagged: false, flags: [] };
      }

      const result = moderationData.result;
      const flags: string[] = [];
      let flagged = false;

      // Check for explicit content flags
      if (result && result.explicit_detection) {
        if (result.explicit_detection.status === 'ok' && result.explicit_detection.confidence > 0.85) {
          flags.push('EXPLICIT_CONTENT');
          flagged = true;
        }
      }

      // Check for nudity using Cloudinary's manual tagging (if available)
      if (result && result.detection) {
        if (result.detection === 'nudity' || result.detection === 'explicit') {
          flags.push('NUDITY_DETECTED');
          flagged = true;
        }
      }

      // Additional check: if video has common adult tags, flag it
      if (response.tags && response.tags.some((tag: string) => 
        tag.toLowerCase().includes('adult') || 
        tag.toLowerCase().includes('nsfw') ||
        tag.toLowerCase().includes('18+')
      )) {
        flags.push('ADULT_TAGS');
        flagged = true;
      }

      this.logger.log(`Moderation check for ${publicId}: flagged=${flagged}, flags=${flags.join(',')}`);
      return { flagged, flags };
    } catch (error) {
      this.logger.warn(
        `Could not perform moderation check for ${publicId}: ${error instanceof Error ? error.message : String(error)}`
      );
      // If moderation check fails, allow upload but log warning
      return { flagged: false, flags: [] };
    }
  }

  async createMedia(file: Express.Multer.File, userId: number, createMediaDto: any) {
    try {
      this.logger.log(`Creating media for user ${userId}, file: ${file.originalname}, size: ${file.size} bytes`);
      
      if (!file) {
        throw new Error('No file provided');
      }

      if (!process.env.CLOUDINARY_CLOUD_NAME) {
        throw new Error('CLOUDINARY_CLOUD_NAME not configured');
      }

      // 1. Upload to Cloudinary using base64 with timeout
      this.logger.log(`Starting Cloudinary base64 encoding...`);
      const startTime = Date.now();
      const base64Data = file.buffer.toString('base64');
      const encodeTime = Date.now() - startTime;
      this.logger.log(`Base64 encoding completed in ${encodeTime}ms, uploading to Cloudinary...`);
      
      // Use Promise.race to implement timeout
      const uploadPromise = cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64Data}`,
        {
          folder: 'fwaya-media',
          resource_type: 'auto',
          public_id: file.originalname.replace(/\.[^/.]+$/, ""),
          quality: 'auto',
        }
      );

      // 45 second timeout for upload (Vercel limit is 60s, leaving buffer)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => {
          const elapsed = Date.now() - startTime;
          reject(new Error(`Cloudinary upload timeout after ${elapsed}ms (limit: 45s)`));
        }, 45000)
      );

      const uploadResult = await Promise.race([uploadPromise, timeoutPromise]) as UploadApiResponse;
      const totalTime = Date.now() - startTime;
      this.logger.log(`Cloudinary upload success: ${uploadResult.public_id} (${totalTime}ms total)`);

      // 1.5 Check video content moderation if video upload
      let videoModerationFlags: string[] = [];
      const isVideo = uploadResult.resource_type === 'video';
      if (isVideo) {
        const moderationResult = await this.checkVideoModeration(uploadResult.public_id);
        videoModerationFlags = moderationResult.flags;
        if (moderationResult.flagged) {
          this.logger.warn(`Video ${uploadResult.public_id} flagged for moderation: ${videoModerationFlags.join(', ')}`);
        }
      }

      // 2. Create database record
      const defaultCoverUrl = 'https://www.fwayainnovations.com/default-cover.jpg';

      // Parse tags if it's a string (JSON)
      let tags: string[] = [];
      if (createMediaDto.tags) {
        try {
          tags = typeof createMediaDto.tags === 'string' ? JSON.parse(createMediaDto.tags) : createMediaDto.tags;
        } catch (e) {
          this.logger.warn('Failed to parse tags:', e);
          tags = [];
        }
      }

      if (createMediaDto.accessType === 'PREMIUM') {
        const uploader = await this.prisma.user.findUnique({ where: { id: userId } });
        const allowedRoles: UserRole[] = [UserRole.ARTIST, UserRole.PRODUCER];
        if (!uploader || !uploader.isPremium || !uploader.premiumUntil || uploader.premiumUntil < new Date() || !allowedRoles.includes(uploader.role)) {
          throw new ForbiddenException('Only active premium artists and producers can upload premium content');
        }
      }

      const normalizedType = this.normalizeMediaType(createMediaDto.type || this.determineMediaType(uploadResult.resource_type));
      const normalizedReleaseTags = this.buildReleaseTags(createMediaDto.releaseType, tags);

      const mediaData = {
        url: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        title: createMediaDto.title || file.originalname.replace(/\.[^/.]+$/, ""),
        description: createMediaDto.description || null,
        format: uploadResult.format,
        duration: Math.floor(uploadResult.duration || 0),
        type: normalizedType,
        accessType: createMediaDto.accessType || 'FREE',
        price: createMediaDto.price ? parseFloat(createMediaDto.price as any) : null,
        isExplicit: createMediaDto.isExplicit === 'true' || createMediaDto.isExplicit === true || false,
        genre: createMediaDto.genre || null,
        tags: normalizedReleaseTags,
        allowReselling: createMediaDto.allowReselling === 'true' || createMediaDto.allowReselling === true || true,
        artistCommissionRate: createMediaDto.artistCommissionRate ? parseFloat(createMediaDto.artistCommissionRate as any) : 0.5,
        platformCommissionRate: 0.5,
        user: { connect: { id: userId } },
        artCoverUrl:
          uploadResult.thumbnail_url
            ? uploadResult.thumbnail_url
            : (uploadResult.secure_url.endsWith('.jpg') || uploadResult.secure_url.endsWith('.png'))
              ? uploadResult.secure_url
              : defaultCoverUrl,
        // only set priceTierId when defined (Prisma types don't accept null for this field in 'data')
        ...(createMediaDto.priceTierId ? { priceTier: { connect: { id: Number(createMediaDto.priceTierId) } } } : {}),
        // Additional fields for pricing
      };

      const media = await this.prisma.media.create({
        data: mediaData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            }
          }
        }
      });

      // If video was flagged, create a moderation record
      if (isVideo && videoModerationFlags.length > 0) {
        await this.prisma.contentModeration.create({
          data: {
            mediaId: media.id,
            contentCreatorId: userId,
            status: ModerationStatus.PENDING,
            flags: videoModerationFlags,
            reason: `Automatic flagging: ${videoModerationFlags.join(', ')}`,
          },
        });
        this.logger.log(`Created moderation record for video ${media.id}`);
      }

      // If a priceTierId was provided, create a PricingSnapshot and attach it as the accepted snapshot
      if (createMediaDto.priceTierId) {
        const chosenPriceTier = await this.prisma.priceTier.findUnique({ where: { id: Number(createMediaDto.priceTierId) } });
        if (chosenPriceTier) {
          // Load business settings for snapshot
          const vatRate = await this.pricingService.getBusinessSettingFloat('VAT_RATE', 16);
          const paymentProvisionPercent = await this.pricingService.getBusinessSettingFloat('PAYMENT_PROVISION_PERCENT', 5);
          const artistSharePercentDirect = await this.pricingService.getBusinessSettingFloat('ARTIST_SHARE_PERCENT_DIRECT', 75);
          const resellerSharePercent = await this.pricingService.getBusinessSettingFloat('RESELLER_SHARE_PERCENT', 20);
          const fwayaSharePercentDirect = await this.pricingService.getBusinessSettingFloat('FWAYA_SHARE_PERCENT_DIRECT', 25);
          const minFwayaMargin = await this.pricingService.getBusinessSettingFloat('MIN_FWAYA_MARGIN', 0);

          const protectedVals = this.pricingService.calculateProtectedPayouts(chosenPriceTier.directPrice, vatRate, paymentProvisionPercent, artistSharePercentDirect, resellerSharePercent, fwayaSharePercentDirect);

          const snapshot = await this.prisma.pricingSnapshot.create({
            data: {
              mediaId: media.id,
              priceTierId: chosenPriceTier.id,
              directPrice: chosenPriceTier.directPrice,
              resellerDiscount: chosenPriceTier.resellerDiscount ?? 0,
              protectedArtistPayout: protectedVals.protectedArtistPayout,
              approvedResellerEarning: protectedVals.approvedResellerEarning,
              vatRate,
              paymentProvisionPercent,
              artistSharePercent: artistSharePercentDirect,
              resellerSharePercent: resellerSharePercent,
              fwayaSharePercent: fwayaSharePercentDirect,
              minFwayaMargin,
            }
          });
          await this.prisma.media.update({ where: { id: media.id }, data: { acceptedPricingSnapshotId: snapshot.id } });
        }
      }

      try {
        await this.notifyFollowersOfUpload(media);
      } catch (notificationError) {
        this.logger.error(
          `Media created but failed to notify followers: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`,
          notificationError instanceof Error ? notificationError.stack : undefined
        );
      }

      try {
        this.eventsGateway.emitMediaUploaded({
          mediaId: media.id,
          userId,
          type: media.type,
          albumId: (media as any).albumId || null,
          title: media.title,
        });
      } catch (emitError) {
        this.logger.error(
          `Failed to emit media uploaded event: ${emitError instanceof Error ? emitError.message : String(emitError)}`,
        );
      }

      this.logger.log(`Media created successfully: ${media.id}`);
      return media;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Media creation failed: ${errorMsg}`, error);
      throw new InternalServerErrorException(`Failed to create media: ${errorMsg}`);
    }
  }

  async createMediaFromMetadata(userId: number, metadata: { title: string; type: string; url: string; cloudinaryPublicId: string; duration: number; format: string; resourceType: string; description?: string; genre?: string; releaseDate?: string; isExplicit?: boolean; isPremium?: boolean; accessType?: string; price?: number; allowReselling?: boolean; artistCommissionRate?: number; platformCommissionRate?: number; tags?: string[] | string; coverUrl?: string; thumbnailUrl?: string; releaseType?: string; albumId?: number; priceTierId?: number }) {
    try {
      this.logger.log(`Creating media from metadata for user ${userId}, title: ${metadata.title}`);

      const defaultCoverUrl = 'https://www.fwayainnovations.com/default-cover.jpg';
      const normalizedAccessType = metadata.accessType?.toUpperCase() === 'PREMIUM' || metadata.accessType?.toUpperCase() === 'PAY_PER_VIEW'
        ? metadata.accessType.toUpperCase()
        : (metadata.isPremium ? 'PREMIUM' : 'FREE');

      if (metadata.isPremium || normalizedAccessType === 'PREMIUM' || normalizedAccessType === 'PAY_PER_VIEW') {
        const uploader = await this.prisma.user.findUnique({ where: { id: userId } });
        const allowedRoles: UserRole[] = [UserRole.ARTIST, UserRole.PRODUCER];
        if (!uploader || !uploader.isPremium || !uploader.premiumUntil || uploader.premiumUntil < new Date() || !allowedRoles.includes(uploader.role)) {
          throw new ForbiddenException('Only active premium artists and producers can upload premium content');
        }
      }

      let tags: string[] = [];
      if (metadata.tags) {
        try {
          tags = typeof metadata.tags === 'string' ? JSON.parse(metadata.tags) : metadata.tags;
        } catch (error) {
          this.logger.warn('Failed to parse metadata tags:', error);
          tags = [];
        }
      }

      const normalizedType = this.normalizeMediaType(metadata.type);
      const normalizedReleaseTags = this.buildReleaseTags(metadata.releaseType || metadata.type, tags);
      const albumId = metadata.albumId ? Number(metadata.albumId) : undefined;

      if (albumId) {
        const album = await this.prisma.album.findUnique({ where: { id: albumId } });
        if (!album) {
          throw new InternalServerErrorException('Album release not found');
        }
        if (album.userId !== userId) {
          throw new ForbiddenException('You can only add tracks to your own album');
        }
      }

      // Check video moderation if this is a video
      let videoModerationFlags: string[] = [];
      const isVideo = metadata.resourceType === 'video' || normalizedType === MediaType.VIDEO;
      if (isVideo && metadata.cloudinaryPublicId) {
        const moderationResult = await this.checkVideoModeration(metadata.cloudinaryPublicId);
        videoModerationFlags = moderationResult.flags;
        if (moderationResult.flagged) {
          this.logger.warn(`Video ${metadata.cloudinaryPublicId} flagged for moderation: ${videoModerationFlags.join(', ')}`);
        }
      }

      const mediaData = {
        url: metadata.url,
        cloudinaryPublicId: metadata.cloudinaryPublicId,
        title: metadata.title,
        description: metadata.description || null,
        format: metadata.format,
        duration: Math.floor(metadata.duration || 0),
        releaseDate: metadata.releaseDate ? new Date(metadata.releaseDate) : undefined,
        type: normalizedType,
        accessType: normalizedAccessType === 'PAY_PER_VIEW'
          ? MediaAccessType.PAY_PER_VIEW
          : normalizedAccessType === 'PREMIUM'
            ? MediaAccessType.PREMIUM
            : MediaAccessType.FREE,
        price: normalizedAccessType === 'PREMIUM' || normalizedAccessType === 'PAY_PER_VIEW'
          ? (metadata.price ? Number(metadata.price) : 2.99)
          : null,
        isExplicit: metadata.isExplicit || false,
        genre: metadata.genre || null,
        tags: normalizedReleaseTags,
        allowReselling: metadata.allowReselling !== false,
        artistCommissionRate: metadata.artistCommissionRate ? Number(metadata.artistCommissionRate) : 0.5,
        platformCommissionRate: metadata.platformCommissionRate ? Number(metadata.platformCommissionRate) : 0.5,
        user: { connect: { id: userId } },
        artCoverUrl: metadata.coverUrl || metadata.thumbnailUrl || defaultCoverUrl,
        thumbnailUrl: metadata.coverUrl || metadata.thumbnailUrl || defaultCoverUrl,
        ...(albumId ? { album: { connect: { id: albumId } } } : {}),
        ...(metadata.priceTierId ? { priceTier: { connect: { id: Number(metadata.priceTierId) } } } : {}),
      };

      const media = await this.prisma.media.create({
        data: mediaData,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            }
          }
        }
      });

      // If video was flagged, create a moderation record
      if (isVideo && videoModerationFlags.length > 0) {
        await this.prisma.contentModeration.create({
          data: {
            mediaId: media.id,
            contentCreatorId: userId,
            status: ModerationStatus.PENDING,
            flags: videoModerationFlags,
            reason: `Automatic flagging: ${videoModerationFlags.join(', ')}`,
          },
        });
        this.logger.log(`Created moderation record for video ${media.id}`);
      }

      try {
        await this.notifyFollowersOfUpload(media);
      } catch (notificationError) {
        this.logger.error(
          `Media metadata created but failed to notify followers: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`,
          notificationError instanceof Error ? notificationError.stack : undefined
        );
      }

      try {
        this.eventsGateway.emitMediaUploaded({
          mediaId: media.id,
          userId,
          type: media.type,
          albumId: (media as any).albumId || null,
          title: media.title,
        });
      } catch (emitError) {
        this.logger.error(
          `Failed to emit media uploaded event: ${emitError instanceof Error ? emitError.message : String(emitError)}`,
        );
      }

      this.logger.log(`Media created from metadata: ${media.id}`);
      // If a priceTierId was provided in metadata, create and attach a pricing snapshot
      try {
        if (metadata.price && metadata.priceTierId) {
          await this.acceptPricingArrangement(media.id, userId, Number(metadata.priceTierId));
        }
      } catch (err) {
        this.logger.warn('Failed to auto-accept pricing arrangement after metadata save', err);
      }

      return media;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Media metadata creation failed: ${errorMsg}`, error);
      throw new InternalServerErrorException(`Failed to create media from metadata: ${errorMsg}`);
    }
  }

  private async notifyFollowersOfUpload(media: any) {
    const followers = await this.prisma.follower.findMany({
      where: { followingId: media.user.id },
      select: { followerId: true },
    });

    if (followers.length === 0) {
      return;
    }

    const uploaderName = media.user.displayName || media.user.username || 'A creator';
    const notifications: Array<{ userId: number; title: string; message: string; type: NotificationType; metadata: any }> = followers.map((follower) => ({
      userId: follower.followerId,
        title: `${uploaderName} uploaded new ${media.type?.toLowerCase() || 'content'}`,
        message: `${uploaderName} has uploaded "${media.title}". Tap to view it now.`,
      type: NotificationType.NEW_RELEASE,
      metadata: {
        mediaId: media.id,
        uploaderId: media.user.id,
          link: `/track/${media.id}`,
          title: media.title,
          coverUrl: media.artCoverUrl,
      },
    }));

    await this.notificationService.createMany(notifications);
  }

  private normalizeMediaType(type?: string | null): MediaType {
    switch ((type || '').toUpperCase()) {
      case 'VIDEO':
        return MediaType.VIDEO;
      case 'PODCAST':
        return MediaType.PODCAST;
      case 'LIVE_STREAM':
        return MediaType.LIVE_STREAM;
      case 'ALBUM':
      case 'EP':
      case 'COLLECTION':
      case 'PLAYLIST':
        return MediaType.ALBUM;
      default:
        return MediaType.AUDIO;
    }
  }

  private buildReleaseTags(releaseType?: string | null, tags: string[] = []): string[] {
    const normalizedTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    const normalizedReleaseType = (releaseType || '').toUpperCase();

    if (normalizedReleaseType === 'EP') {
      return [...new Set([...normalizedTags, 'ep'])];
    }

    if (normalizedReleaseType === 'ALBUM') {
      return [...new Set([...normalizedTags, 'album'])];
    }

    return normalizedTags;
  }

  private determineMediaType(resourceType: string): MediaType {
    switch(resourceType) {
      case 'video': return MediaType.VIDEO;
      case 'raw': return MediaType.PODCAST;
      default: return MediaType.AUDIO;
    }
  }

  async getAllMedia(type?: string) {
    try {
      const media = await this.prisma.media.findMany({
        where: type ? { type: type.toUpperCase() as MediaType } : undefined,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return media.filter(m => m.userId !== null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown database error';
      this.logger.error(`getAllMedia failed: ${message}`, error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException('Unable to fetch media list');
    }
  }

  async getUserMedia(userId: number) {
    return this.prisma.media.findMany({
      where: { userId },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getMediaById(mediaId: number) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      }
    });

    if (!media) {
      throw new Error('Media not found');
    }

    return media;
  }

  async deleteMedia(mediaId: number, userId: number) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId }
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Check if user owns this media
    if (media.userId !== userId) {
      throw new Error('Unauthorized: You can only delete your own media');
    }

    try {
      if (media.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(media.cloudinaryPublicId);
      }
      return await this.prisma.media.delete({ where: { id: mediaId } });
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Media deletion failed'
      );
    }
  }

  async updateMedia(mediaId: number, userId: number, updates: any) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId }
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Check if user owns this media
    if (media.userId !== userId) {
      throw new Error('Unauthorized: You can only update your own media');
    }

    // Prepare update data - only allow certain fields to be updated
    const updateData: any = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.genre) updateData.genre = updates.genre;
    if (updates.isExplicit !== undefined) updateData.isExplicit = updates.isExplicit;
    if (updates.accessType) updateData.accessType = updates.accessType;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.priceTierId !== undefined) updateData.priceTierId = updates.priceTierId;
    if (updates.accessType === 'FREE') {
      updateData.price = null;
      updateData.priceTierId = null;
      updateData.acceptedPricingSnapshotId = null;
    }
    if (updates.allowReselling !== undefined) updateData.allowReselling = updates.allowReselling;
    if (updates.artistCommissionRate !== undefined) updateData.artistCommissionRate = updates.artistCommissionRate;
    if (updates.tags) updateData.tags = updates.tags;

    try {
      const updated = await this.prisma.media.update({
        where: { id: mediaId },
        data: updateData,
        include: {
          user: {
            select: { id: true, username: true, displayName: true, avatarUrl: true }
          }
        }
      });

      return updated;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Media update failed'
      );
    }
  }

  // NEW: Homepage sections with fallback logic
async getHomepageSections() {
  // Featured Songs / New Releases
  let featuredSongs = await this.prisma.media.findMany({
    where: {
      accessType: 'FREE',
      type: { in: [MediaType.AUDIO, MediaType.ALBUM] },
      OR: [
        { tags: { has: "featured" } },
        { tags: { has: "new" } }
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  featuredSongs = featuredSongs.filter(m => m.userId !== null);
  if (featuredSongs.length < 8) {
      const latest = await this.prisma.media.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 8 - featuredSongs.length,
        where: { id: { notIn: featuredSongs.map((m: any) => m.id) }, accessType: 'FREE', type: { in: [MediaType.AUDIO, MediaType.ALBUM] } }
      });
      const filteredLatest = latest.filter((m: any) => m.userId !== null);
      featuredSongs = featuredSongs.concat(filteredLatest);
    }
  // Trending Songs
  let trendingSongs = await this.prisma.media.findMany({
    where: { tags: { has: "trending" }, accessType: 'FREE', type: { in: [MediaType.AUDIO, MediaType.ALBUM] } },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { playCount: "desc" },
    take: 8,
  });
  trendingSongs = trendingSongs.filter(m => m.userId !== null);
  if (trendingSongs.length < 8) {
    const mostPlayed = await this.prisma.media.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { playCount: "desc" },
      take: 8 - trendingSongs.length,
      where: { id: { notIn: trendingSongs.map((m: any) => m.id) }, accessType: 'FREE', type: { in: [MediaType.AUDIO, MediaType.ALBUM] } }
    });
    const filteredMostPlayed = mostPlayed.filter((m: any) => m.userId !== null);
    trendingSongs = trendingSongs.concat(filteredMostPlayed);
  }

  // Beats and Instruments (filter by genre, not type)
  let beats = await this.prisma.media.findMany({
    where: {
      accessType: 'FREE',
      type: { in: [MediaType.AUDIO, MediaType.ALBUM] },
      OR: [
        { genre: { contains: "beat", mode: "insensitive" } },
        { genre: { contains: "instrumental", mode: "insensitive" } },
        { tags: { has: "album" } },
        { tags: { has: "ep" } }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    },
    take: 8,
  });
  beats = beats.filter(m => m.userId !== null);

  // Top Charts
  let topCharts = await this.prisma.media.findMany({
    where: { accessType: 'FREE', type: { in: [MediaType.AUDIO, MediaType.ALBUM] } },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { playCount: "desc" },
    take: 8,
  });
  topCharts = topCharts.filter(m => m.userId !== null);
  if (topCharts.length < 8) {
    const latest = await this.prisma.media.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 8 - topCharts.length,
      where: { id: { notIn: topCharts.map((m: any) => m.id) }, accessType: 'FREE', type: { in: [MediaType.AUDIO, MediaType.ALBUM] } }
    });
    const filteredLatest = latest.filter((m: any) => m.userId !== null);
    topCharts = topCharts.concat(filteredLatest);
  }

  // Music videos from DB (only verified/published)
  let musicVideos = await this.prisma.media.findMany({
    where: { 
      type: MediaType.VIDEO,
      OR: [
        { tags: { has: "music" } },
        { tags: { has: "song" } },
        { tags: { has: "mv" } },
        { genre: { contains: "music", mode: "insensitive" } }
      ],
      contentModerations: {
        none: {
          status: 'PENDING'
        }
      }
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      },
      contentModerations: true
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  musicVideos = musicVideos.filter(m => m.userId !== null);

  // Other videos from DB - comedy, entertainment, tutorials, etc (only verified/published)
  let otherVideos = await this.prisma.media.findMany({
    where: { 
      type: MediaType.VIDEO,
      NOT: {
        OR: [
          { tags: { has: "music" } },
          { tags: { has: "song" } },
          { tags: { has: "mv" } },
        ]
      },
      contentModerations: {
        none: {
          status: 'PENDING'
        }
      }
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      },
      contentModerations: true
    },
    orderBy: { playCount: "desc" },
    take: 6,
  });
  otherVideos = otherVideos.filter(m => m.userId !== null);

  // Fetch featured albums from Album table
  let featuredAlbums = await this.prisma.album.findMany({
    where: {
      contentStatus: { in: ['PUBLISHED', 'APPROVED', 'DRAFT', 'SUBMITTED'] },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true
        }
      },
      media: {
        where: { deletedAt: null },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          media: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  
  // Transform albums to match media format for frontend compatibility
  const transformedAlbums = featuredAlbums.map((album: any) => ({
    id: album.id,
    title: album.title,
    description: album.description,
    artCoverUrl: album.coverUrl,
    coverArt: album.coverUrl,
    thumbnailUrl: album.coverUrl,
    type: album.type?.toUpperCase() === 'EP' ? 'EP' : 'ALBUM',
    trackCount: album._count?.media ?? 0,
    userId: album.userId,
    user: album.user,
    createdAt: album.createdAt,
    tags: ['album'],
  }));

  return {
    featuredSongs,
    trendingSongs,
    beats,
    topCharts,
    musicVideos,
    otherVideos,
    featuredAlbums: transformedAlbums,
  };
}
}
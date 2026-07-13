import { ForbiddenException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
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

  async createMediaFromMetadata(userId: number, metadata: { title: string; type: string; url: string; cloudinaryPublicId: string; duration: number; format: string; resourceType: string; description?: string; genre?: string; isExplicit?: boolean; isPremium?: boolean; accessType?: string; price?: number; allowReselling?: boolean; artistCommissionRate?: number; platformCommissionRate?: number; tags?: string[] | string; coverUrl?: string; thumbnailUrl?: string; releaseType?: string; albumId?: number }) {
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

  async getAllMedia() {
    try {
      const media = await this.prisma.media.findMany({
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

  return {
    featuredSongs,
    trendingSongs,
    beats,
    topCharts,
    musicVideos,
    otherVideos,
  };
}
}
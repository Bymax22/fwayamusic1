import { ForbiddenException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Prisma, MediaType, MediaAccessType, UserRole } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(private readonly prisma: PrismaService, private readonly notificationService: NotificationService) {
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

      const mediaData = {
        url: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        title: createMediaDto.title || file.originalname.replace(/\.[^/.]+$/, ""),
        description: createMediaDto.description || null,
        format: uploadResult.format,
        duration: Math.floor(uploadResult.duration || 0),
        type: createMediaDto.type || this.determineMediaType(uploadResult.resource_type),
        accessType: createMediaDto.accessType || 'FREE',
        price: createMediaDto.price ? parseFloat(createMediaDto.price as any) : null,
        isExplicit: createMediaDto.isExplicit === 'true' || createMediaDto.isExplicit === true || false,
        genre: createMediaDto.genre || null,
        tags: tags,
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

      await this.notifyFollowersOfUpload(media);
      this.logger.log(`Media created successfully: ${media.id}`);
      return media;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Media creation failed: ${errorMsg}`, error);
      throw new InternalServerErrorException(`Failed to create media: ${errorMsg}`);
    }
  }

  async createMediaFromMetadata(userId: number, metadata: { title: string; type: string; url: string; cloudinaryPublicId: string; duration: number; format: string; resourceType: string; description?: string; genre?: string; isExplicit?: boolean; isPremium?: boolean; coverUrl?: string }) {
    try {
      this.logger.log(`Creating media from metadata for user ${userId}, title: ${metadata.title}`);

      const defaultCoverUrl = 'https://www.fwayainnovations.com/default-cover.jpg';

      if (metadata.isPremium) {
        const uploader = await this.prisma.user.findUnique({ where: { id: userId } });
        const allowedRoles: UserRole[] = [UserRole.ARTIST, UserRole.PRODUCER];
        if (!uploader || !uploader.isPremium || !uploader.premiumUntil || uploader.premiumUntil < new Date() || !allowedRoles.includes(uploader.role)) {
          throw new ForbiddenException('Only active premium artists and producers can upload premium content');
        }
      }

      const mediaData = {
        url: metadata.url,
        cloudinaryPublicId: metadata.cloudinaryPublicId,
        title: metadata.title,
        description: metadata.description || null,
        format: metadata.format,
        duration: Math.floor(metadata.duration || 0),
        type: metadata.type as MediaType,
        accessType: metadata.isPremium ? MediaAccessType.PREMIUM : MediaAccessType.FREE,
        price: metadata.isPremium ? 2.99 : null, // Default price for premium
        isExplicit: metadata.isExplicit || false,
        genre: metadata.genre || null,
        tags: [],
        allowReselling: true,
        artistCommissionRate: 0.5,
        platformCommissionRate: 0.5,
        user: { connect: { id: userId } },
        artCoverUrl: metadata.coverUrl || defaultCoverUrl,
        thumbnailUrl: metadata.coverUrl || defaultCoverUrl,
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

      await this.notifyFollowersOfUpload(media);
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
    const notifications = followers.map((follower) => ({
      userId: follower.followerId,
      title: 'New upload available',
      message: `${uploaderName} has uploaded a new track: ${media.title}. Check it out now.`,
      type: 'FOLLOWER_UPLOAD',
      metadata: {
        mediaId: media.id,
        uploaderId: media.user.id,
      },
    }));

    await this.notificationService.createMany(notifications);
  }

  private determineMediaType(resourceType: string): MediaType {
    switch(resourceType) {
      case 'video': return MediaType.VIDEO;
      case 'raw': return MediaType.PODCAST;
      default: return MediaType.AUDIO;
    }
  }

  async getAllMedia() {
    const media = await this.prisma.media.findMany({
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return media.filter(m => m.userId !== null);
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
      OR: [
        { tags: { has: "featured" } },
        { tags: { has: "new" } }
      ],
      accessType: 'FREE'
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
      where: { id: { notIn: featuredSongs.map((m: any) => m.id) }, accessType: 'FREE' }
    });    latest.filter(m => m.userId !== null);    featuredSongs = featuredSongs.concat(latest);
  }

  // Trending Songs
  let trendingSongs = await this.prisma.media.findMany({
    where: { tags: { has: "trending" }, accessType: 'FREE' },
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
      where: { id: { notIn: trendingSongs.map((m: any) => m.id) }, accessType: 'FREE' }
    });    mostPlayed.filter(m => m.userId !== null);    trendingSongs = trendingSongs.concat(mostPlayed);
  }

  // Beats and Instruments (filter by genre, not type)
  let beats = await this.prisma.media.findMany({
    where: {
      OR: [
        { genre: { contains: "beat", mode: "insensitive" } },
        { genre: { contains: "instrumental", mode: "insensitive" } }
      ],
      accessType: 'FREE'
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
    where: { accessType: 'FREE' },
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
      where: { id: { notIn: topCharts.map((m: any) => m.id) }, accessType: 'FREE' }
    });
    latest.filter(m => m.userId !== null);
    topCharts = topCharts.concat(latest);
  }

  return {
    featuredSongs,
    trendingSongs,
    beats,
    topCharts,
  };
}
}
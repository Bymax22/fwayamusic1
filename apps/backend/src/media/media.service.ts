import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Prisma } from '@prisma/client';
import { MediaType } from '@fwaya-music/types/enums';
import { Readable } from 'stream';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Upload file using streaming to avoid base64 overhead
  async uploadToCloudinary(file: Express.Multer.File, type: 'avatar' | 'media' = 'media'): Promise<UploadApiResponse> {
    const folder = type === 'avatar' ? 'fwaya-avatars' : 'fwaya-media';
    const resourceType = type === 'avatar' ? 'image' : 'auto'; // Use 'auto' for media to detect audio/video
    
    return new Promise((resolve, reject) => {
      // Create a readable stream from the buffer
      const stream = Readable.from(file.buffer);
      
      // Use cloudinary's upload_stream for streaming
      const uploadStream = cloudinary.uploader.upload_stream(
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
        },
        (error: any, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(new InternalServerErrorException(`Cloudinary upload failed: ${error.message}`));
          } else if (result) {
            resolve(result);
          } else {
            reject(new InternalServerErrorException('Cloudinary upload returned no result'));
          }
        }
      );

      // Handle stream errors
      stream.on('error', (error) => {
        reject(new InternalServerErrorException(`Stream error: ${error.message}`));
      });

      // Pipe the buffer stream to Cloudinary
      stream.pipe(uploadStream);
    });
  }

  async createMedia(file: Express.Multer.File, userId: number, createMediaDto: any) {
    try {
      console.log(`[MediaService] Creating media for user ${userId}, file size: ${file.size} bytes`);
      
      // 1. Upload to Cloudinary using streaming
      console.log(`[MediaService] Uploading to Cloudinary via stream...`);
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = Readable.from(file.buffer);
        
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'fwaya-media',
            resource_type: 'auto',
            public_id: file.originalname.replace(/\.[^/.]+$/, ""),
            quality: 'auto',
          },
          (error: any, result: UploadApiResponse | undefined) => {
            if (error) {
              reject(new InternalServerErrorException(`Cloudinary upload failed: ${error.message}`));
            } else if (result) {
              resolve(result);
            } else {
              reject(new InternalServerErrorException('Cloudinary upload returned no result'));
            }
          }
        );

        stream.on('error', (error) => {
          reject(new InternalServerErrorException(`Stream error: ${error.message}`));
        });

        stream.pipe(uploadStream);
      });
      
      console.log(`[MediaService] Cloudinary upload success: ${uploadResult.public_id}`);

      // 2. Create database record
      const defaultCoverUrl = 'https://www.fwayainnovations.com/default-cover.jpg';

      // Parse tags if it's a string (JSON)
      let tags: string[] = [];
      if (createMediaDto.tags) {
        try {
          tags = typeof createMediaDto.tags === 'string' ? JSON.parse(createMediaDto.tags) : createMediaDto.tags;
        } catch (e) {
          tags = [];
        }
      }

      const mediaData = {
        url: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        title: createMediaDto.title || file.originalname.replace(/\.[^/.]+$/, ""),
        description: createMediaDto.description,
        format: uploadResult.format,
        duration: Math.floor(uploadResult.duration || 0),
        type: createMediaDto.type || this.determineMediaType(uploadResult.resource_type),
        accessType: createMediaDto.accessType || 'FREE',
        price: createMediaDto.price ? parseFloat(createMediaDto.price) : null,
        isExplicit: createMediaDto.isExplicit === 'true' || createMediaDto.isExplicit === true,
        genre: createMediaDto.genre,
        tags,
        allowReselling: createMediaDto.allowReselling === 'true' || createMediaDto.allowReselling === true,
        artistCommissionRate: parseFloat(createMediaDto.artistCommissionRate) || 0.5,
        platformCommissionRate: 0.5, // Default platform commission
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

      return media;
    } catch (error) {
      console.error('Media creation error:', error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Media creation failed'
      );
    }
  }

  private determineMediaType(resourceType: string): MediaType {
    switch(resourceType) {
      case 'video': return MediaType.VIDEO;
      case 'raw': return MediaType.PODCAST;
      default: return MediaType.AUDIO;
    }
  }

  async getAllMedia() {
    return this.prisma.media.findMany({
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
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
      where: { id: { notIn: featuredSongs.map(m => m.id) }, accessType: 'FREE' }
    });
    featuredSongs = featuredSongs.concat(latest);
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
      where: { id: { notIn: trendingSongs.map(m => m.id) }, accessType: 'FREE' }
    });
    trendingSongs = trendingSongs.concat(mostPlayed);
  }

  // Beats and Instruments (filter by genre, not type)
  const beats = await this.prisma.media.findMany({
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
      where: { id: { notIn: topCharts.map(m => m.id) }, accessType: 'FREE' }
    });
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
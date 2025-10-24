import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs/promises';
import { Prisma } from '@prisma/client';
import { MediaType } from '@fwaya-music/types/enums';

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async createMedia(file: Express.Multer.File, userId: number, metadata?: { title?: string, description?: string }) {
    try {
      // 1. Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: 'fwaya-media',
        resource_type: 'auto',
      });

      // 2. Create database record
      const defaultCoverUrl = 'http://localhost:3000/default-cover.jpg'; // or your deployed frontend URL

      const mediaData = {
        url: uploadResult.secure_url,
        cloudinaryPublicId: uploadResult.public_id,
        title: metadata?.title || file.originalname.replace(/\.[^/.]+$/, ""),
        description: metadata?.description,
        format: uploadResult.format,
        duration: Math.floor(uploadResult.duration || 0),
        type: this.determineMediaType(uploadResult.resource_type),
        user: { connect: { id: userId } },
        artCoverUrl:
          uploadResult.thumbnail_url
            ? uploadResult.thumbnail_url
            : (uploadResult.secure_url.endsWith('.jpg') || uploadResult.secure_url.endsWith('.png'))
              ? uploadResult.secure_url
              : defaultCoverUrl, // Use absolute URL for default
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

      // 3. Clean up temp file
      await fs.unlink(file.path);

      return media;
    } catch (error) {
      if (file?.path) await fs.unlink(file.path).catch(() => {});
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
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteMedia(mediaId: number) {
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId }
    });

    if (!media) {
      throw new Error('Media not found');
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

  // NEW: Homepage sections with fallback logic
async getHomepageSections() {
  // Featured Songs / New Releases
  let featuredSongs = await this.prisma.media.findMany({
    where: {
      OR: [
        { tags: { has: "featured" } },
        { tags: { has: "new" } }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  if (featuredSongs.length < 8) {
    const latest = await this.prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 8 - featuredSongs.length,
      where: { id: { notIn: featuredSongs.map(m => m.id) } }
    });
    featuredSongs = featuredSongs.concat(latest);
  }

  // Trending Songs
  let trendingSongs = await this.prisma.media.findMany({
    where: { tags: { has: "trending" } },
    orderBy: { playCount: "desc" },
    take: 8,
  });
  if (trendingSongs.length < 8) {
    const mostPlayed = await this.prisma.media.findMany({
      orderBy: { playCount: "desc" },
      take: 8 - trendingSongs.length,
      where: { id: { notIn: trendingSongs.map(m => m.id) } }
    });
    trendingSongs = trendingSongs.concat(mostPlayed);
  }

  // Beats and Instruments (filter by genre, not type)
  const beats = await this.prisma.media.findMany({
    where: {
      OR: [
        { genre: { contains: "beat", mode: "insensitive" } },
        { genre: { contains: "instrumental", mode: "insensitive" } }
      ]
    },
    take: 8,
  });

  // Top Charts
  let topCharts = await this.prisma.media.findMany({
    orderBy: { playCount: "desc" },
    take: 8,
  });
  if (topCharts.length < 8) {
    const latest = await this.prisma.media.findMany({
      orderBy: { createdAt: "desc" },
      take: 8 - topCharts.length,
      where: { id: { notIn: topCharts.map(m => m.id) } }
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
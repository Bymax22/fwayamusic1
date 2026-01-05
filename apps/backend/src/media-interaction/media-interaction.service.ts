import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class MediaInteractionService {
  constructor(private prisma: PrismaService) {}

  async likeMedia(mediaId: number, userId: number) {
    return this.prisma.mediaInteraction.upsert({
      where: { mediaId_userId: { mediaId, userId } },
      update: { liked: true },
      create: { mediaId, userId, liked: true },
    });
  }

  async heartMedia(mediaId: number, userId: number) {
    return this.prisma.mediaInteraction.upsert({
      where: { mediaId_userId: { mediaId, userId } },
      update: { saved: true },
      create: { mediaId, userId, saved: true },
    });
  }

  async playMedia(mediaId: number, userId: number) {
    await this.prisma.media.update({
      where: { id: mediaId },
      data: { playCount: { increment: 1 } },
    });
    return this.prisma.mediaInteraction.upsert({
      where: { mediaId_userId: { mediaId, userId } },
      update: { played: true },
      create: { mediaId, userId, played: true },
    });
  }

  async downloadMedia(mediaId: number, userId: number, deviceId?: string) {
    // Check if media is free
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.accessType !== 'FREE') {
      throw new Error('Only free media can be downloaded');
    }

    await this.prisma.media.update({
      where: { id: mediaId },
      data: { downloadCount: { increment: 1 } },
    });

    // Create download record
    const download = await this.prisma.download.create({
      data: { 
        mediaId, 
        userId,
        deviceId: deviceId || 'web',
        isDRMProtected: true,
      },
      include: { media: true }
    });

    return {
      downloadId: download.id,
      downloadUrl: download.media.url, // For now, return the media URL
      isDRMProtected: download.isDRMProtected,
    };
  }
}
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class MediaInteractionService {
  constructor(private prisma: PrismaService, private eventsGateway: EventsGateway) {}

  async likeMedia(mediaId: number, userId: number) {
    // Toggle behaviour: if already liked -> unlike, otherwise like
    const existing = await this.prisma.mediaInteraction.findUnique({ where: { mediaId_userId: { mediaId, userId } } });

    let newState;
    if (existing && existing.liked) {
      // Unlike
      await this.prisma.mediaInteraction.update({ where: { id: existing.id }, data: { liked: false } });
      newState = false;
    } else if (existing) {
      await this.prisma.mediaInteraction.update({ where: { id: existing.id }, data: { liked: true } });
      newState = true;
    } else {
      await this.prisma.mediaInteraction.create({ data: { mediaId, userId, liked: true } });
      newState = true;
    }

    // Compute updated like count
    const likesCount = await this.prisma.mediaInteraction.count({ where: { mediaId, liked: true } });

    // Emit realtime event
    try {
      this.eventsGateway.emitMediaLiked({ mediaId, userId, liked: newState, likes: likesCount });
    } catch (err) {
      // swallow emission errors but log via gateway
    }

    return { mediaId, userId, liked: newState, likes: likesCount };
  }

  async heartMedia(mediaId: number, userId: number) {
    return this.prisma.mediaInteraction.upsert({
      where: { mediaId_userId: { mediaId, userId } },
      update: { saved: true },
      create: { mediaId, userId, saved: true },
    });
  }

  async playMedia(mediaId: number, userId: number) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new Error('Media not found');
    await this.assertMediaAccess(media, userId);

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
    // Check if media exists
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new Error('Media not found');
    }

    if (media.accessType === 'PAY_PER_VIEW') {
      throw new ForbiddenException('Pay-per-view media must be purchased separately');
    }
    await this.assertMediaAccess(media, userId);

    if (!media.url) {
      throw new Error('Media file not available for download');
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
        accessType: 'OFFLINE',
        isDRMProtected: true,
        licenseKey: this.generateLicenseKey(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      include: { media: true }
    });

    return {
      downloadId: download.id,
      downloadUrl: download.media.url, // For now, return the media URL
      isDRMProtected: download.isDRMProtected,
    };
  }

  private async assertMediaAccess(media: { accessType: string }, userId: number) {
    if (media.accessType !== 'PREMIUM') return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true, premiumUntil: true },
    });
    const active = Boolean(user?.isPremium && user.premiumUntil && user.premiumUntil > new Date());
    if (!active) {
      throw new ForbiddenException('An active premium subscription is required for this media');
    }
  }

  private generateLicenseKey(): string {
    return 'DRM-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
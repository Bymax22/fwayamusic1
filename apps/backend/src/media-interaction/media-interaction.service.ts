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
    const normalizedDeviceId = deviceId?.trim();
    if (!normalizedDeviceId || normalizedDeviceId.length > 160) {
      throw new ForbiddenException('A valid device identifier is required to download media');
    }

    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new Error('Media not found');

    let premiumExpiresAt: Date | null = null;
    if (media.userId !== userId && media.accessType === 'PREMIUM') {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isPremium: true, premiumUntil: true },
      });
      if (!user?.isPremium || !user.premiumUntil || user.premiumUntil <= new Date()) {
        throw new ForbiddenException('An active Fwaya Premium subscription is required to download this track');
      }
      premiumExpiresAt = user.premiumUntil;
    } else if (media.userId !== userId && media.accessType === 'PAY_PER_VIEW') {
      const purchase = await this.prisma.transaction.findFirst({
        where: { userId, mediaId, status: 'COMPLETED' },
        select: { id: true },
      });
      if (!purchase) throw new ForbiddenException('Purchase this track before downloading it');
    } else if (!['FREE', 'PREMIUM', 'PAY_PER_VIEW'].includes(media.accessType)) {
      throw new ForbiddenException('This media type cannot be downloaded');
    }

    if (!media.url) {
      throw new Error('Media file not available for download');
    }

    const deviceBound = media.accessType !== 'FREE';
    if (deviceBound) {
      const deviceFamily = normalizedDeviceId.startsWith('native-') ? 'native' : 'web';
      const priorDownloads = await this.prisma.download.findMany({
        where: { mediaId, userId, accessType: 'OFFLINE' },
        select: { deviceId: true, extraData: true },
      });
      const priorDevices = priorDownloads.filter((download) => {
        const metadata = download.extraData;
        return Boolean(
          metadata &&
          typeof metadata === 'object' &&
          !Array.isArray(metadata) &&
          'deviceBound' in metadata &&
          metadata.deviceBound === true
        );
      }).map((download) => download.deviceId).filter((id): id is string => Boolean(id));
      const priorDeviceInFamily = priorDevices.find((id) =>
        (id.startsWith('native-') ? 'native' : 'web') === deviceFamily
      );
      if (priorDeviceInFamily && priorDeviceInFamily !== normalizedDeviceId) {
        throw new ForbiddenException(
          `This protected download is already bound to another ${deviceFamily === 'native' ? 'app installation' : 'browser'}`
        );
      }
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
        deviceId: normalizedDeviceId,
        accessType: 'OFFLINE',
        isDRMProtected: deviceBound,
        expiresAt: premiumExpiresAt,
        extraData: {
          deviceBound,
          storage: 'private-platform',
          version: 1,
        },
      },
      include: { media: true }
    });

    return {
      downloadId: download.id,
      deviceId: normalizedDeviceId,
      accessType: media.accessType,
      expiresAt: premiumExpiresAt?.toISOString() ?? null,
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

}
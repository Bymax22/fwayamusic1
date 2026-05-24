import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentStatus, MediaAccessType, DeletionReason, UserRole } from '@prisma/client';

@Injectable()
export class TracksService {
  constructor(private prisma: PrismaService) {}

  // Get artist's tracks
  async getArtistTracks(userId: number, includeDeleted = false) {
    const where: any = { userId };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    const tracks = await this.prisma.media.findMany({
      where,
      include: {
        album: true,
        collaborators: {
          include: {
            producer: {
              select: {
                id: true,
                displayName: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tracks;
  }

  // Get track by ID
  async getTrackById(trackId: number) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        // top-level producer relation removed; use collaborators to access producers
        album: true,
        collaborators: {
          include: {
            producer: {
              select: {
                id: true,
                displayName: true,
                username: true,
              },
            },
          },
        },
        contentModerations: true,
      },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    return track;
  }

  // Update track details
  async updateTrack(trackId: number, userId: number, updateData: any) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.userId !== userId) {
      throw new ForbiddenException('You can only edit your own tracks');
    }

    const updated = await this.prisma.media.update({
      where: { id: trackId },
      data: updateData,
      include: {
        album: true,
        collaborators: true,
      },
    });

    return updated;
  }

  // Change track pricing/access type
  async changePricing(
    trackId: number,
    userId: number,
    accessType: MediaAccessType,
    price?: number,
  ) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.userId !== userId) {
      throw new ForbiddenException('You can only modify pricing for your own tracks');
    }

    if (accessType === MediaAccessType.PREMIUM) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.isPremium || !user.premiumUntil || user.premiumUntil < new Date() || ![UserRole.ARTIST, UserRole.PRODUCER].includes(user.role)) {
        throw new ForbiddenException('Only active premium artists and producers can set premium pricing for tracks');
      }
    }

    const updated = await this.prisma.media.update({
      where: { id: trackId },
      data: {
        accessType,
        price: price || 0,
      },
    });

    return updated;
  }

  // Make track free (from premium or pay-per-view)
  async makeTrackFree(trackId: number, userId: number) {
    return this.changePricing(trackId, userId, MediaAccessType.FREE, 0);
  }

  // Make track premium
  async makeTrackPremium(trackId: number, userId: number, price: number) {
    if (price <= 0) {
      throw new BadRequestException('Premium track price must be greater than 0');
    }
    return this.changePricing(trackId, userId, MediaAccessType.PREMIUM, price);
  }

  // Make track pay-per-view
  async makeTrackPayPerView(trackId: number, userId: number, price: number) {
    if (price <= 0) {
      throw new BadRequestException('Pay-per-view price must be greater than 0');
    }
    return this.changePricing(trackId, userId, MediaAccessType.PAY_PER_VIEW, price);
  }

  // Update track cover/artwork
  async updateTrackCover(
    trackId: number,
    userId: number,
    artCoverUrl: string,
    cloudinaryPublicId?: string,
  ) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.userId !== userId) {
      throw new ForbiddenException('You can only update your own track cover');
    }

    const updated = await this.prisma.media.update({
      where: { id: trackId },
      data: {
        artCoverUrl,
        cloudinaryPublicId,
      },
    });

    return updated;
  }

  // Rename track
  async renameTrack(trackId: number, userId: number, newTitle: string) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.userId !== userId) {
      throw new ForbiddenException('You can only rename your own tracks');
    }

    if (!newTitle || newTitle.trim().length === 0) {
      throw new BadRequestException('Track title cannot be empty');
    }

    const updated = await this.prisma.media.update({
      where: { id: trackId },
      data: { title: newTitle.trim() },
    });

    return updated;
  }

  // Delete track (soft delete)
  async deleteTrack(
    trackId: number,
    userId: number,
    reason: DeletionReason = DeletionReason.USER_REQUEST,
  ) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.userId !== userId) {
      throw new ForbiddenException('You can only delete your own tracks');
    }

    await this.prisma.media.update({
      where: { id: trackId },
      data: {
        deletedAt: new Date(),
        deletionReason: reason,
        contentStatus: ContentStatus.DELETED,
      },
    });

    return { message: 'Track deleted successfully' };
  }

  // Get track analytics/statistics
  async getTrackStats(trackId: number, userId?: number) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    // If user specified, check ownership
    if (userId && track.userId !== userId) {
      throw new ForbiddenException('You can only view analytics for your own tracks');
    }

    const totalStats = {
      totalPlays: track.playCount,
      totalDownloads: track.downloadCount,
      totalShares: track.shareCount,
      accessType: track.accessType,
      price: track.price,
    };

    return {
      track: {
        id: track.id,
        title: track.title,
        artist: track.userId,
        accessType: track.accessType,
      },
      totalStats,
      dailyAnalytics: [],
    };
  }

  // Publish track
  async publishTrack(trackId: number, userId: number) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.userId !== userId) {
      throw new ForbiddenException('You can only publish your own tracks');
    }

    const updated = await this.prisma.media.update({
      where: { id: trackId },
      data: { contentStatus: ContentStatus.PUBLISHED },
    });

    return updated;
  }

  // Archive track
  async archiveTrack(trackId: number, userId: number) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.userId !== userId) {
      throw new ForbiddenException('You can only archive your own tracks');
    }

    const updated = await this.prisma.media.update({
      where: { id: trackId },
      data: { contentStatus: ContentStatus.ARCHIVED },
    });

    return updated;
  }

  // Submit track for review
  async submitTrackForReview(trackId: number, userId: number) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.userId !== userId) {
      throw new ForbiddenException('You can only submit your own tracks');
    }

    const updated = await this.prisma.media.update({
      where: { id: trackId },
      data: { contentStatus: ContentStatus.SUBMITTED },
    });

    return updated;
  }

  // Bulk update tracks (change pricing for multiple tracks)
  async bulkUpdateTracks(
    userId: number,
    trackIds: number[],
    updateData: any,
  ) {
    // Verify all tracks belong to user
    const tracks = await this.prisma.media.findMany({
      where: {
        id: { in: trackIds },
        userId,
      },
    });

    if (tracks.length !== trackIds.length) {
      throw new ForbiddenException('Some tracks do not belong to you');
    }

    const updated = await this.prisma.media.updateMany({
      where: {
        id: { in: trackIds },
        userId,
      },
      data: updateData,
    });

    return updated;
  }

  // Enable/disable reselling for track
  async setResellingStatus(trackId: number, userId: number, allowReselling: boolean) {
    const track = await this.prisma.media.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new NotFoundException('Track not found');
    }

    if (track.userId !== userId) {
      throw new ForbiddenException('You can only modify your own tracks');
    }

    const updated = await this.prisma.media.update({
      where: { id: trackId },
      data: { allowReselling },
    });

    return updated;
  }
}

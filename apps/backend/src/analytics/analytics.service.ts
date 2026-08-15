import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Record daily analytics for a track
  async recordDailyAnalytics(
    mediaId: number,
    artistId: number,
    data: {
      date: Date;
      playsCount?: number;
      downloadsCount?: number;
      sharesCount?: number;
      likesCount?: number;
      topCountries?: Record<string, number>;
      topRegions?: Record<string, number>;
      deviceTypes?: Record<string, number>;
      platforms?: Record<string, number>;
      averagePlayDuration?: number;
      completionRate?: number;
      totalRevenue?: number;
    },
  ) {
    // The DB does not include a daily `trackAnalytics` table. As a fallback,
    // recordDailyAnalytics will increment aggregate counters on the media row.
    // This is a simplified approach — for full daily analytics enable the
    // appropriate table and model in the database.
    await this.prisma.media.update({
      where: { id: mediaId },
      data: {
        playCount: { increment: data.playsCount || 0 } as any,
        downloadCount: { increment: data.downloadsCount || 0 } as any,
        shareCount: { increment: data.sharesCount || 0 } as any,
      },
    });

    return { success: true };
  }

  // Get track analytics for date range
  async getTrackAnalytics(
    mediaId: number,
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Verify ownership
    const track = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!track || track.userId !== userId) {
      throw new ForbiddenException('You can only view analytics for your own tracks');
    }

    const where: any = { mediaId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    // Fallback: return aggregates from the media row since daily analytics
    // are not available in the DB schema.
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException('Track not found');

    const aggregated = {
      totalPlays: media.playCount || 0,
      totalDownloads: media.downloadCount || 0,
      totalShares: media.shareCount || 0,
    };

    return {
      trackId: mediaId,
      dailyAnalytics: [],
      aggregatedStats: aggregated,
    };
  }

  // Get artist's dashboard analytics
  async getArtistDashboardAnalytics(userId: number, startDate?: Date, endDate?: Date) {
    const where: any = { artistId: userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    // Simplified artist dashboard: list user's media and aggregate counters
    const tracks = await this.prisma.media.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        artCoverUrl: true,
        playCount: true,
        downloadCount: true,
        shareCount: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const trackStats = tracks.map((t) => ({
      trackId: t.id,
      trackTitle: t.title,
      trackCover: t.artCoverUrl,
      totalPlays: t.playCount || 0,
      totalDownloads: t.downloadCount || 0,
      totalShares: t.shareCount || 0,
    }));

    const totalStats = trackStats.reduce(
      (acc, t) => ({
        totalPlays: acc.totalPlays + t.totalPlays,
        totalDownloads: acc.totalDownloads + t.totalDownloads,
        totalShares: acc.totalShares + t.totalShares,
      }),
      { totalPlays: 0, totalDownloads: 0, totalShares: 0 },
    );

    return {
      userId,
      dateRange: { startDate, endDate },
      totalStats,
      trackStats,
    };
  }

  // Get top performing tracks for artist
  async getTopTracksForArtist(userId: number, limit = 10, period = 30) {
    const tracks = await this.prisma.media.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        artCoverUrl: true,
        accessType: true,
        price: true,
        playCount: true,
        downloadCount: true,
        shareCount: true,
      },
      orderBy: { playCount: 'desc' },
      take: limit,
    });

    return tracks.map((track) => ({
      trackId: track.id,
      title: track.title,
      artCoverUrl: track.artCoverUrl,
      accessType: track.accessType,
      price: track.price,
      playsCount: track.playCount || 0,
      downloadsCount: track.downloadCount || 0,
      sharesCount: track.shareCount || 0,
    }));
  }

  // Get revenue analytics
  async getRevenueAnalytics(userId: number, startDate?: Date, endDate?: Date) {
    const tracks = await this.prisma.media.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        accessType: true,
        price: true,
        playCount: true,
        downloadCount: true,
        shareCount: true,
      },
    });

    const totalRevenue = 0;
    const byType: Record<string, number> = {};
    const dailyRevenue: Record<string, number> = {};

    for (const track of tracks) {
      const type = track.accessType || 'FREE';
      byType[type] = (byType[type] || 0) + 0;
    }

    return {
      userId,
      totalRevenue,
      revenueByType: byType,
      dailyRevenue,
      currency: 'USD',
      dateRange: {
        startDate,
        endDate,
      },
    };
  }

  // Get geographic analytics
  async getGeographicAnalytics(userId: number, startDate?: Date, endDate?: Date) {
    return {
      userId,
      topCountries: {},
      topRegions: {},
    };
  }

  // Get device/platform analytics
  async getDeviceAnalytics(userId: number, startDate?: Date, endDate?: Date) {
    return {
      userId,
      devices: {},
      platforms: {},
    };
  }

  private _aggregateStats(analytics: any[]) {
    let totalPlays = 0;
    let totalDownloads = 0;
    let totalShares = 0;
    let totalLikes = 0;
    let totalRevenue = 0;
    let totalPlayDuration = 0;
    let avgCompletionRate = 0;

    for (const analytic of analytics) {
      totalPlays += analytic.playsCount || 0;
      totalDownloads += analytic.downloadsCount || 0;
      totalShares += analytic.sharesCount || 0;
      totalLikes += analytic.likesCount || 0;
      totalRevenue += analytic.totalRevenue || 0;
      totalPlayDuration += analytic.averagePlayDuration || 0;
      if (analytic.completionRate) {
        avgCompletionRate += analytic.completionRate;
      }
    }

    const count = analytics.length || 1;
    return {
      totalPlays,
      totalDownloads,
      totalShares,
      totalLikes,
      totalRevenue,
      averagePlayDuration: Math.round(totalPlayDuration / count),
      averageCompletionRate: Number((avgCompletionRate / count).toFixed(2)),
      recordCount: count,
    };
  }
}

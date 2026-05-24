import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    const existing = await this.prisma.trackAnalytics.findUnique({
      where: {
        mediaId_date: {
          mediaId,
          date: data.date,
        },
      },
    });

    if (existing) {
      // Update existing record
      return this.prisma.trackAnalytics.update({
        where: { id: existing.id },
        data: {
          playsCount: data.playsCount ?? existing.playsCount,
          downloadsCount: data.downloadsCount ?? existing.downloadsCount,
          sharesCount: data.sharesCount ?? existing.sharesCount,
          likesCount: data.likesCount ?? existing.likesCount,
          topCountries: data.topCountries ?? existing.topCountries,
          topRegions: data.topRegions ?? existing.topRegions,
          deviceTypes: data.deviceTypes ?? existing.deviceTypes,
          platforms: data.platforms ?? existing.platforms,
          averagePlayDuration: data.averagePlayDuration ?? existing.averagePlayDuration,
          completionRate: data.completionRate ?? existing.completionRate,
          totalRevenue: data.totalRevenue ?? existing.totalRevenue,
        },
      });
    }

    // Create new record
    return this.prisma.trackAnalytics.create({
      data: {
        mediaId,
        artistId,
        date: new Date(data.date),
        playsCount: data.playsCount || 0,
        downloadsCount: data.downloadsCount || 0,
        sharesCount: data.sharesCount || 0,
        likesCount: data.likesCount || 0,
        topCountries: data.topCountries,
        topRegions: data.topRegions,
        deviceTypes: data.deviceTypes,
        platforms: data.platforms,
        averagePlayDuration: data.averagePlayDuration,
        completionRate: data.completionRate,
        totalRevenue: data.totalRevenue || 0,
      },
    });
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

    const analytics = await this.prisma.trackAnalytics.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    // Aggregate statistics
    const totalStats = this._aggregateStats(analytics);

    return {
      trackId: mediaId,
      dailyAnalytics: analytics,
      aggregatedStats: totalStats,
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

    const analytics = await this.prisma.trackAnalytics.findMany({
      where,
      include: {
        media: {
          select: {
            id: true,
            title: true,
            artCoverUrl: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Group by track
    const byTrack: Record<number, any[]> = {};
    for (const analytic of analytics) {
      if (!byTrack[analytic.mediaId]) {
        byTrack[analytic.mediaId] = [];
      }
      byTrack[analytic.mediaId].push(analytic);
    }

    // Calculate stats per track
    const trackStats = Object.entries(byTrack).map(([trackId, stats]) => ({
      trackId: parseInt(trackId),
      trackTitle: stats[0]?.media?.title,
      trackCover: stats[0]?.media?.artCoverUrl,
      ...this._aggregateStats(stats),
    }));

    const totalStats = this._aggregateStats(analytics);

    return {
      userId,
      dateRange: {
        startDate,
        endDate,
      },
      totalStats,
      trackStats,
    };
  }

  // Get top performing tracks for artist
  async getTopTracksForArtist(userId: number, limit = 10, period = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const analytics = await this.prisma.trackAnalytics.findMany({
      where: {
        artistId: userId,
        date: {
          gte: startDate,
        },
      },
      include: {
        media: {
          select: {
            id: true,
            title: true,
            artCoverUrl: true,
            accessType: true,
            price: true,
          },
        },
      },
    });

    // Group by track and aggregate
    const byTrack: Record<number, any> = {};
    for (const analytic of analytics) {
      if (!byTrack[analytic.mediaId]) {
        byTrack[analytic.mediaId] = {
          media: analytic.media,
          playsCount: 0,
          downloadsCount: 0,
          sharesCount: 0,
          likesCount: 0,
          totalRevenue: 0,
          count: 0,
        };
      }
      byTrack[analytic.mediaId].playsCount += analytic.playsCount;
      byTrack[analytic.mediaId].downloadsCount += analytic.downloadsCount;
      byTrack[analytic.mediaId].sharesCount += analytic.sharesCount;
      byTrack[analytic.mediaId].likesCount += analytic.likesCount;
      byTrack[analytic.mediaId].totalRevenue += analytic.totalRevenue;
      byTrack[analytic.mediaId].count += 1;
    }

    return Object.values(byTrack)
      .sort((a, b) => b.playsCount - a.playsCount)
      .slice(0, limit);
  }

  // Get revenue analytics
  async getRevenueAnalytics(userId: number, startDate?: Date, endDate?: Date) {
    const where: any = { artistId: userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const analytics = await this.prisma.trackAnalytics.findMany({
      where,
      include: {
        media: {
          select: {
            accessType: true,
            price: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    let totalRevenue = 0;
    const byType: Record<string, number> = {};
    const dailyRevenue: Record<string, number> = {};

    for (const analytic of analytics) {
      totalRevenue += analytic.totalRevenue;
      const type = analytic.media?.accessType || 'FREE';
      byType[type] = (byType[type] || 0) + analytic.totalRevenue;

      const dateKey = analytic.date.toISOString().split('T')[0];
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + analytic.totalRevenue;
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
    const where: any = { artistId: userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const analytics = await this.prisma.trackAnalytics.findMany({
      where,
    });

    const countries: Record<string, number> = {};
    const regions: Record<string, number> = {};

    for (const analytic of analytics) {
      if (analytic.topCountries) {
        const countryData = analytic.topCountries as Record<string, number>;
        for (const [country, count] of Object.entries(countryData)) {
          countries[country] = (countries[country] || 0) + count;
        }
      }

      if (analytic.topRegions) {
        const regionData = analytic.topRegions as Record<string, number>;
        for (const [region, count] of Object.entries(regionData)) {
          regions[region] = (regions[region] || 0) + count;
        }
      }
    }

    // Sort by count
    const topCountries = Object.entries(countries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    const topRegions = Object.entries(regions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20);

    return {
      userId,
      topCountries: Object.fromEntries(topCountries),
      topRegions: Object.fromEntries(topRegions),
    };
  }

  // Get device/platform analytics
  async getDeviceAnalytics(userId: number, startDate?: Date, endDate?: Date) {
    const where: any = { artistId: userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const analytics = await this.prisma.trackAnalytics.findMany({
      where,
    });

    const devices: Record<string, number> = {};
    const platforms: Record<string, number> = {};

    for (const analytic of analytics) {
      if (analytic.deviceTypes) {
        const deviceData = analytic.deviceTypes as Record<string, number>;
        for (const [device, count] of Object.entries(deviceData)) {
          devices[device] = (devices[device] || 0) + count;
        }
      }

      if (analytic.platforms) {
        const platformData = analytic.platforms as Record<string, number>;
        for (const [platform, count] of Object.entries(platformData)) {
          platforms[platform] = (platforms[platform] || 0) + count;
        }
      }
    }

    return {
      userId,
      devices,
      platforms,
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

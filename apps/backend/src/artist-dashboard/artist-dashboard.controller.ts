import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TracksService } from '../track/tracks.service';
import { AlbumsService } from '../albums/albums.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../db/prisma.service';
import { PricingService } from '../pricing/pricing.service';

@ApiTags('Artist Dashboard')
@Controller('api/v1/artist/dashboard')
export class ArtistDashboardController {
  constructor(
    private tracksService: TracksService,
    private albumsService: AlbumsService,
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
    private pricingService: PricingService,
  ) {}

  // Overview/Summary
  @Get('overview')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getDashboardOverview(@Request() req: any) {
    const user = req.user;

    // Get counts
    const [tracks, albums, followers, totalEarnings] = await Promise.all([
      this.prisma.media.count({
        where: { userId: user.id, deletedAt: null },
      }),
      this.prisma.album.count({
        where: { userId: user.id },
      }),
      this.prisma.follower.count({
        where: { followingId: user.id },
      }),
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: { totalEarnings: true },
      }),
    ]);

    // Get recent activity
    const recentTracks = await this.prisma.media.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        accessType: true,
        playCount: true,
        createdAt: true,
      },
    });

    return {
      stats: {
        totalTracks: tracks,
        totalAlbums: albums,
        followers,
        totalEarnings: totalEarnings?.totalEarnings || 0,
      },
      recentTracks,
    };
  }

  // Get all content (tracks and albums)
  @Get('content')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getContent(@Request() req: any) {
    const [tracks, albums] = await Promise.all([
      this.tracksService.getArtistTracks(req.user.id),
      this.albumsService.getArtistAlbums(req.user.id),
    ]);

    return { tracks, albums };
  }

  // Analytics Dashboard
  @Get('analytics')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getAnalytics(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const dashboardAnalytics = await this.analyticsService.getArtistDashboardAnalytics(
      req.user.id,
      start,
      end,
    );

    const topTracks = await this.analyticsService.getTopTracksForArtist(req.user.id, 5, 30);

    const revenue = await this.analyticsService.getRevenueAnalytics(req.user.id, start, end);

    return {
      ...dashboardAnalytics,
      topTracks,
      revenue,
    };
  }

  // Revenue Analytics
  @Get('revenue')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getRevenue(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getRevenueAnalytics(req.user.id, start, end);
  }

  // Geographic Analytics
  @Get('analytics/geographic')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getGeographicAnalytics(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getGeographicAnalytics(req.user.id, start, end);
  }

  // Device/Platform Analytics
  @Get('analytics/devices')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getDeviceAnalytics(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.analyticsService.getDeviceAnalytics(req.user.id, start, end);
  }

  // Quick stats
  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getStats(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        totalEarnings: true,
        walletBalance: true,
        isPremium: true,
        createdAt: true,
        _count: {
          select: {
            media: true,
            albums: true,
            followers: true,
            following: true,
            playlists: true,
            downloads: true,
          },
        },
      },
    });

    return user;
  }

  // Pending moderation
  @Get('moderation')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getPendingModeration(@Request() req: any) {
    const moderations = await this.prisma.contentModeration.findMany({
      where: { contentCreatorId: req.user.id },
      include: {
        media: {
          select: {
            id: true,
            title: true,
            artCoverUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return moderations;
  }

  // Get collaborations
  @Get('collaborations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getCollaborations(@Request() req: any) {
    const collaborations = await this.prisma.producerCollaboration.findMany({
      where: {
        OR: [{ artistId: req.user.id }, { producerId: req.user.id }],
      },
      include: {
        media: {
          select: {
            id: true,
            title: true,
          },
        },
        artist: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
        producer: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return collaborations;
  }

  // Get per-track expected earnings and accumulated totals
  @Get('tracks/:id/earnings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getTrackEarnings(@Request() req: any, @Param('id') id: string) {
    const trackId = parseInt(id);
    const media = await this.prisma.media.findUnique({ where: { id: trackId } });
    if (!media) throw new Error('Track not found');

    // Only owner or collaborators can view detailed earnings
    const isOwner = media.userId === req.user.id;
    const isCollaborator = await this.prisma.producerCollaboration.findFirst({ where: { mediaId: trackId, producerId: req.user.id, isConfirmed: true } });
    if (!isOwner && !isCollaborator) throw new Error('Unauthorized');

    // Determine canonical charging amount per sale
    const pricingSnapshot = media.acceptedPricingSnapshotId ? await this.prisma.pricingSnapshot.findUnique({ where: { id: media.acceptedPricingSnapshotId } }) : null;

    const vatRate = await this.pricingService.getBusinessSettingFloat('VAT_RATE', 16);
    const provisionPercent = await this.pricingService.getBusinessSettingFloat('PAYMENT_PROVISION_PERCENT', 5);

    const unitPrice = pricingSnapshot?.directPrice ?? media.price ?? 0;

    let unitSplits: any;
    if (pricingSnapshot) {
      unitSplits = this.pricingService.computeActualSplits(unitPrice, vatRate, provisionPercent, pricingSnapshot.protectedArtistPayout ?? 0, pricingSnapshot.approvedResellerEarning ?? 0);
    } else {
      const calc = this.pricingService.calculateShareableAmount(unitPrice, vatRate, provisionPercent);
      const artistSharePercent = await this.pricingService.getBusinessSettingFloat('ARTIST_SHARE_PERCENT_DIRECT', 75);
      const artist = parseFloat((calc.shareable * (artistSharePercent / 100)).toFixed(2));
      const platform = parseFloat((calc.shareable - artist).toFixed(2));
      unitSplits = { vat: calc.vat, provision: calc.provision, actualShareable: calc.shareable, artist, reseller: 0, platform };
    }

    // Aggregate completed transactions for this media
    const completed = await this.prisma.transaction.findMany({ where: { mediaId: trackId, status: 'COMPLETED' } });
    let salesCount = completed.length;
    let grossRevenue = 0;
    let totalArtist = 0;
    let totalPlatform = 0;
    let totalReseller = 0;

    for (const tx of completed) {
      const amount = tx.amount || 0;
      grossRevenue += amount;
      // If transaction metadata has calculatedAmounts, trust it
      const calc = (tx.metadata as any)?.calculatedAmounts ?? null;
      if (calc) {
        totalArtist += calc.artistAmount ?? 0;
        totalPlatform += calc.platformAmount ?? 0;
        totalReseller += calc.resellerAmount ?? 0;
      } else {
        // recompute using unitSplits proportionally
        // compute split ratios from unitSplits
        const totalShareable = unitSplits.actualShareable ?? (unitSplits.artist + unitSplits.reseller + unitSplits.platform);
        if (totalShareable > 0) {
          const factor = amount / (unitPrice || 1);
          totalArtist += (unitSplits.artist || 0) * factor;
          totalPlatform += (unitSplits.platform || 0) * factor;
          totalReseller += (unitSplits.reseller || 0) * factor;
        }
      }
    }

    return {
      track: { id: media.id, title: media.title },
      unitPrice,
      unitSplits: {
        artist: parseFloat((unitSplits.artist || 0).toFixed(2)),
        platform: parseFloat((unitSplits.platform || 0).toFixed(2)),
        reseller: parseFloat((unitSplits.reseller || 0).toFixed(2)),
        vat: parseFloat((unitSplits.vat || 0).toFixed(2)),
        provision: parseFloat((unitSplits.provision || 0).toFixed(2)),
        shareable: parseFloat((unitSplits.actualShareable || 0).toFixed(2)),
      },
      totals: {
        salesCount,
        grossRevenue: parseFloat(grossRevenue.toFixed(2)),
        totalArtist: parseFloat(totalArtist.toFixed(2)),
        totalPlatform: parseFloat(totalPlatform.toFixed(2)),
        totalReseller: parseFloat(totalReseller.toFixed(2)),
      },
    };
  }

  // Approve/Reject collaboration
  @Post('collaborations/:id/approve')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async approveCollaboration(@Param('id') id: string, @Request() req: any) {
    const collaboration = await this.prisma.producerCollaboration.findUnique({
      where: { id: parseInt(id) },
    });

    if (!collaboration) {
      throw new Error('Collaboration not found');
    }

    if (collaboration.producerId !== req.user.id && collaboration.artistId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    return this.prisma.producerCollaboration.update({
      where: { id: parseInt(id) },
      data: {
        isConfirmed: true,
        confirmedAt: new Date(),
      },
    });
  }

  @Post('collaborations/:id/reject')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async rejectCollaboration(@Param('id') id: string, @Request() req: any) {
    const collaboration = await this.prisma.producerCollaboration.findUnique({
      where: { id: parseInt(id) },
    });

    if (!collaboration) {
      throw new Error('Collaboration not found');
    }

    if (collaboration.producerId !== req.user.id && collaboration.artistId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    return this.prisma.producerCollaboration.update({
      where: { id: parseInt(id) },
      data: {
        isConfirmed: false,
        confirmedAt: new Date(),
      },
    });
  }
}

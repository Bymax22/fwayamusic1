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
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Artist Dashboard')
@Controller('api/v1/artist/dashboard')
export class ArtistDashboardController {
  constructor(
    private tracksService: TracksService,
    private albumsService: AlbumsService,
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
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

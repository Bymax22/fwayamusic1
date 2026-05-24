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
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

@ApiTags('Producer Dashboard')
@Controller('api/v1/producer/dashboard')
export class ProducerDashboardController {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {}

  // Producer overview
  @Get('overview')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getDashboardOverview(@Request() req: any) {
    const user = req.user;

    // Get producer stats
    const [producedTracks, collaborations, earnings] = await Promise.all([
      this.prisma.media.count({
        where: { producerId: user.id, deletedAt: null },
      }),
      this.prisma.producerCollaboration.count({
        where: { producerId: user.id },
      }),
      this.prisma.user.findUnique({
        where: { id: user.id },
        select: { totalEarnings: true, walletBalance: true },
      }),
    ]);

    // Get recent production work
    const recentWork = await this.prisma.media.findMany({
      where: { producerId: user.id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { displayName: true, username: true },
        },
      },
    });

    // Get pending collaboration requests
    const pendingRequests = await this.prisma.producerCollaboration.count({
      where: {
        producerId: user.id,
        status: 'PENDING',
      },
    });

    return {
      stats: {
        producedTracks,
        totalCollaborations: collaborations,
        pendingRequests,
        totalEarnings: earnings?.totalEarnings || 0,
        walletBalance: earnings?.walletBalance || 0,
      },
      recentWork,
    };
  }

  // Get all collaborations (as producer)
  @Get('collaborations')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getCollaborations(
    @Request() req: any,
    @Query('status') status?: string,
  ) {
    const where: any = { producerId: req.user.id };
    if (status) where.status = status;

    const collaborations = await this.prisma.producerCollaboration.findMany({
      where,
      include: {
        media: {
          select: {
            id: true,
            title: true,
            artCoverUrl: true,
          },
        },
        artist: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return collaborations;
  }

  // Get produced tracks
  @Get('tracks')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getProducedTracks(@Request() req: any) {
    const tracks = await this.prisma.media.findMany({
      where: { producerId: req.user.id, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        collaborations: {
          include: {
            artist: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tracks;
  }

  // Get collaboration earnings
  @Get('earnings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getEarnings(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const where: any = {
      collaborations: {
        some: {
          producerId: req.user.id,
          isPaid: true,
        },
      },
    };

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (start || end) {
      where.createdAt = {};
      if (start) where.createdAt.gte = start;
      if (end) where.createdAt.lte = end;
    }

    const collaborations = await this.prisma.producerCollaboration.findMany({
      where: {
        producerId: req.user.id,
        isPaid: true,
      },
      include: {
        media: {
          select: {
            title: true,
          },
        },
      },
    });

    const totalEarnings = collaborations.reduce((sum, c) => sum + (c.flatFee || 0), 0);

    return {
      collaborations,
      totalEarnings,
      currency: 'USD',
    };
  }

  // Approve/Reject collaboration request
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

    if (collaboration.producerId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    return this.prisma.producerCollaboration.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        respondedAt: new Date(),
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

    if (collaboration.producerId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    return this.prisma.producerCollaboration.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
    });
  }

  // Get portfolio/samples
  @Get('portfolio')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getPortfolio(@Request() req: any) {
    const tracks = await this.prisma.media.findMany({
      where: { producerId: req.user.id, deletedAt: null },
      select: {
        id: true,
        title: true,
        artCoverUrl: true,
        genre: true,
        bpm: true,
        key: true,
        duration: true,
        playCount: true,
        user: {
          select: {
            displayName: true,
          },
        },
      },
      take: 20,
    });

    return {
      portfolioItems: tracks,
      totalProductions: tracks.length,
    };
  }

  // Get stats/analytics
  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getStats(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        totalEarnings: true,
        walletBalance: true,
        _count: {
          select: {
            collaborationRequests: true,
            collaborations: true,
          },
        },
      },
    });

    const producedTracks = await this.prisma.media.count({
      where: { producerId: req.user.id, deletedAt: null },
    });

    const approvedCollaborations = await this.prisma.producerCollaboration.count({
      where: {
        producerId: req.user.id,
        status: 'APPROVED',
      },
    });

    return {
      ...user,
      producedTracks,
      approvedCollaborations,
    };
  }

  // Get reputation/verification
  @Get('verification')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getVerification(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        status: true,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    });

    return user;
  }
}

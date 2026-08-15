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
import { PrismaService } from '../db/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PricingService } from '../pricing/pricing.service';

@ApiTags('Producer Dashboard')
@Controller('api/v1/producer/dashboard')
export class ProducerDashboardController {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
    private pricingService: PricingService,
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
        where: {
          deletedAt: null,
          collaborators: {
            some: { producerId: user.id },
          },
        },
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
      where: {
        deletedAt: null,
        collaborators: {
          some: { producerId: user.id },
        },
      },
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
        isConfirmed: false,
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
    if (status === 'PENDING') where.isConfirmed = false;
    if (status === 'APPROVED') where.isConfirmed = true;

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
      orderBy: { createdAt: 'desc' },
    });

    return collaborations;
  }

  // Get produced tracks
  @Get('tracks')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getProducedTracks(@Request() req: any) {
    const tracks = await this.prisma.media.findMany({
      where: {
        deletedAt: null,
        collaborators: {
          some: { producerId: req.user.id },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
          },
        },
        collaborators: {
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
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const collaborations = await this.prisma.producerCollaboration.findMany({
      where: {
        producerId: req.user.id,
        isConfirmed: true,
      },
      include: {
        media: {
          select: {
            title: true,
          },
        },
      },
    });

    const totalEarnings = 0;

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

    if (collaboration.producerId !== req.user.id) {
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

  // Get portfolio/samples
  @Get('portfolio')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getPortfolio(@Request() req: any) {
    const tracks = await this.prisma.media.findMany({
      where: {
        deletedAt: null,
        collaborators: {
          some: { producerId: req.user.id },
        },
      },
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

  // Get per-track expected earnings (for producers)
  @Get('tracks/:id/earnings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getTrackEarnings(@Request() req: any, @Param('id') id: string) {
    const trackId = parseInt(id);
    const media = await this.prisma.media.findUnique({ where: { id: trackId } });
    if (!media) throw new Error('Track not found');

    // Only confirmed producer collaborators or owner can view
    const isOwner = media.userId === req.user.id;
    const confirmedCollab = await this.prisma.producerCollaboration.findFirst({ where: { mediaId: trackId, producerId: req.user.id, isConfirmed: true } });
    if (!isOwner && !confirmedCollab) throw new Error('Unauthorized');

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

    const completed = await this.prisma.transaction.findMany({ where: { mediaId: trackId, status: 'COMPLETED' } });
    let salesCount = completed.length;
    let grossRevenue = 0;
    let totalArtist = 0;
    let totalPlatform = 0;
    let totalReseller = 0;

    for (const tx of completed) {
      const amount = tx.amount || 0;
      grossRevenue += amount;
      const calc = (tx.metadata as any)?.calculatedAmounts ?? null;
      if (calc) {
        totalArtist += calc.artistAmount ?? 0;
        totalPlatform += calc.platformAmount ?? 0;
        totalReseller += calc.resellerAmount ?? 0;
      } else {
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
      where: {
        deletedAt: null,
        collaborators: {
          some: { producerId: req.user.id },
        },
      },
    });

    const approvedCollaborations = await this.prisma.producerCollaboration.count({
      where: {
        producerId: req.user.id,
        isConfirmed: true,
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

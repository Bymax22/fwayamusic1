import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateResellerLinkDto, ResellerStatsDto } from './dto/create-reseller-link.dto';

@Injectable()
export class ResellerService {
  constructor(private prisma: PrismaService) {}

  async createResellerLink(createResellerLinkDto: CreateResellerLinkDto, resellerId: number) {
    const { mediaId, customCommissionRate, expiresAt } = createResellerLinkDto;

    // Verify media exists and allows reselling
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Use correct field name from your schema
    if (!media.allowReselling) {
      throw new Error('This media does not allow reselling');
    }

    // Check if link already exists
    const existingLink = await this.prisma.resellerLink.findFirst({
      where: {
        resellerId,
        mediaId,
      },
    });

    if (existingLink) {
      return existingLink;
    }

    // Generate unique code
    const code = this.generateResellerCode();

    return await this.prisma.resellerLink.create({
      data: {
        code,
        resellerId,
        mediaId,
        customCommissionRate,
        expiresAt,
      },
    });
  }

  async getResellerLinks(resellerId: number) {
    return await this.prisma.resellerLink.findMany({
      where: { resellerId },
      include: {
        media: {
          select: {
            id: true,
            title: true,
            artCoverUrl: true,
            price: true,
            accessType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResellerStats(resellerId: number): Promise<ResellerStatsDto> {
    const commissions = await this.prisma.commission.aggregate({
      where: { resellerId },
      _sum: { amount: true },
      _count: { id: true },
    });

    const paidCommissions = await this.prisma.commission.aggregate({
      where: { 
        resellerId,
        isPaid: true,
      },
      _sum: { amount: true },
    });

    const links = await this.prisma.resellerLink.findMany({
      where: { resellerId },
      select: { clickCount: true, conversionCount: true },
    });

    // Use correct field names from schema
    const totalClicks = links.reduce((sum, link) => sum + (link.clickCount || 0), 0);
    const totalConversions = links.reduce((sum, link) => sum + (link.conversionCount || 0), 0);
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      totalCommission: commissions._sum.amount || 0,
      paidCommission: paidCommissions._sum.amount || 0,
      pendingCommission: (commissions._sum.amount || 0) - (paidCommissions._sum.amount || 0),
      totalSales: commissions._count.id || 0,
      conversionRate,
    };
  }

  async trackLinkClick(code: string) {
    return await this.prisma.resellerLink.update({
      where: { code },
      data: {
        clickCount: { increment: 1 },
      },
    });
  }

  async getResellerCommissions(resellerId: number) {
    return await this.prisma.commission.findMany({
      where: { resellerId },
      include: {
        transaction: {
          include: {
            media: {
              select: {
                title: true,
                artCoverUrl: true,
              },
            },
            user: {
              select: {
                displayName: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private generateResellerCode(): string {
    return `RSL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BeatsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  async getAllBeats(filters?: {
    genre?: string;
    bpm?: number;
    accessType?: string;
    skip?: number;
    take?: number;
  }) {
    const skip = filters?.skip || 0;
    const take = filters?.take || 20;

    const where: any = {
      type: 'AUDIO',
      genre: { contains: 'beat', mode: 'insensitive' }
    };

    if (filters?.genre) {
      where.genre = { contains: filters.genre, mode: 'insensitive' };
    }

    if (filters?.bpm) {
      where.bpm = filters.bpm;
    }

    if (filters?.accessType) {
      where.accessType = filters.accessType;
    }

    return this.prisma.media.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        artCoverUrl: true,
        thumbnailUrl: true,
        genre: true,
        bpm: true,
        key: true,
        duration: true,
        playCount: true,
        downloadCount: true,
        price: true,
        accessType: true,
        tags: true,
        createdAt: true,
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true } }
      }
    });
  }

  async searchBeats(query: string, skip: number = 0, take: number = 20) {
    return this.prisma.media.findMany({
      where: {
        AND: [
          { type: 'AUDIO' },
          {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { genre: { contains: query, mode: 'insensitive' } },
              { tags: { hasSome: [query] } }
            ]
          }
        ]
      },
      skip,
      take,
      orderBy: { playCount: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        artCoverUrl: true,
        genre: true,
        bpm: true,
        playCount: true,
        downloadCount: true,
        price: true,
        accessType: true,
        createdAt: true,
        user: { select: { id: true, username: true, displayName: true } }
      }
    });
  }

  async getBeatById(beatId: number) {
    const beat = await this.prisma.media.findUnique({
      where: { id: beatId },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        artCoverUrl: true,
        thumbnailUrl: true,
        genre: true,
        bpm: true,
        key: true,
        duration: true,
        playCount: true,
        downloadCount: true,
        shareCount: true,
        price: true,
        accessType: true,
        isExplicit: true,
        allowReselling: true,
        tags: true,
        createdAt: true,
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, stageName: true } }
      }
    });

    if (!beat) {
      throw new NotFoundException('Beat not found');
    }

    return beat;
  }

  async createBeat(userId: number, beatData: {
    title: string;
    description: string;
    genre: string;
    bpm: number | null;
    key: string | null;
    price: number | null;
    accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW';
    audioFile: Express.Multer.File;
    coverFile?: Express.Multer.File;
  }) {
    if (!beatData.title || !beatData.genre) {
      throw new BadRequestException('Title and genre are required');
    }

    // Upload files to Cloudinary (integrate with your upload service)
    // For now, we'll assume URLs are provided
    const audioUrl = await this.uploadToCloudinary(beatData.audioFile);
    const coverUrl = beatData.coverFile ? await this.uploadToCloudinary(beatData.coverFile) : null;

    const duration = beatData.audioFile.size; // This should be calculated properly

    const beat = await this.prisma.media.create({
      data: {
        title: beatData.title,
        description: beatData.description,
        genre: beatData.genre,
        bpm: beatData.bpm,
        key: beatData.key,
        type: 'AUDIO',
        url: audioUrl,
        artCoverUrl: coverUrl,
        thumbnailUrl: coverUrl,
        price: beatData.price,
        accessType: beatData.accessType,
        duration: duration,
        userId: userId,
        playCount: 0,
        downloadCount: 0,
        shareCount: 0,
        isExplicit: false,
        allowReselling: true,
        artistCommissionRate: 0.7,
        platformCommissionRate: 0.3,
        tags: [beatData.genre]
      }
    });

    return beat;
  }

  async updateBeat(userId: number, beatId: number, updateData: any) {
    // Verify ownership
    const beat = await this.prisma.media.findUnique({
      where: { id: beatId }
    });

    if (!beat || beat.userId !== userId) {
      throw new ForbiddenException('You can only update your own beats');
    }

    const updated = await this.prisma.media.update({
      where: { id: beatId },
      data: {
        title: updateData.title || beat.title,
        description: updateData.description || beat.description,
        genre: updateData.genre || beat.genre,
        bpm: updateData.bpm || beat.bpm,
        key: updateData.key || beat.key,
        price: updateData.price !== undefined ? updateData.price : beat.price,
        accessType: updateData.accessType || beat.accessType,
      }
    });

    return updated;
  }

  async deleteBeat(userId: number, beatId: number) {
    // Verify ownership
    const beat = await this.prisma.media.findUnique({
      where: { id: beatId }
    });

    if (!beat || beat.userId !== userId) {
      throw new ForbiddenException('You can only delete your own beats');
    }

    await this.prisma.media.delete({
      where: { id: beatId }
    });

    return { message: 'Beat deleted successfully' };
  }

  async getProducerBeats(producerId: number, skip: number = 0, take: number = 20) {
    return this.prisma.media.findMany({
      where: {
        userId: producerId,
        type: 'AUDIO'
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        artCoverUrl: true,
        genre: true,
        bpm: true,
        key: true,
        duration: true,
        playCount: true,
        downloadCount: true,
        shareCount: true,
        price: true,
        accessType: true,
        createdAt: true
      }
    });
  }

  async getProducerStats(producerId: number) {
    const beats = await this.prisma.media.findMany({
      where: { userId: producerId, type: 'AUDIO' }
    });

    const totalPlays = beats.reduce((sum, beat) => sum + beat.playCount, 0);
    const totalDownloads = beats.reduce((sum, beat) => sum + beat.downloadCount, 0);

    // Get transactions for revenue
    const transactions = await this.prisma.transaction.findMany({
      where: {
        media: { userId: producerId },
        status: 'COMPLETED'
      }
    });

    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Get this month's data
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyPlays = beats.reduce((sum, beat) => {
      const beatMonth = new Date(beat.lastPlayedAt || beat.createdAt);
      return beatMonth >= monthStart ? sum + beat.playCount : sum;
    }, 0);

    const monthlyTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.createdAt);
      return txDate >= monthStart;
    });

    const monthlyRevenue = monthlyTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Get followers (if implemented)
    const followers = await this.prisma.follower.findMany({
      where: { followingId: producerId }
    });

    return {
      totalBeats: beats.length,
      totalPlays,
      monthlyPlays,
      totalDownloads,
      monthlyDownloads: 0, // Would need to track by date
      totalRevenue,
      monthlyRevenue,
      totalSales: transactions.length,
      monthlySales: monthlyTransactions.length,
      followerCount: followers.length
    };
  }

  async getProducerAnalytics(producerId: number, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const beats = await this.prisma.media.findMany({
      where: {
        userId: producerId,
        type: 'AUDIO',
        createdAt: { gte: startDate }
      }
    });

    // Daily breakdown
    const playsByDay: number[] = [];
    for (let i = 0; i < days; i++) {
      playsByDay[i] = 0;
    }

    // Calculate top genres
    const genreCounts: Record<string, number> = {};
    beats.forEach(beat => {
      const genre = beat.genre || 'Unknown';
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    return {
      playsByDay,
      topGenres: Object.entries(genreCounts)
        .map(([genre, count]) => ({ genre, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      totalBeatsAnalyzed: beats.length,
      dateRange: { start: startDate, end: new Date() }
    };
  }

  async getTopBeats(producerId: number, limit: number = 10) {
    return this.prisma.media.findMany({
      where: {
        userId: producerId,
        type: 'AUDIO'
      },
      orderBy: { playCount: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        genre: true,
        bpm: true,
        playCount: true,
        downloadCount: true,
        shareCount: true,
        price: true,
        createdAt: true
      }
    });
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    // Implement actual Cloudinary upload
    // For now, returning a placeholder
    return `https://res.cloudinary.com/placeholder/${file.filename}`;
  }
}
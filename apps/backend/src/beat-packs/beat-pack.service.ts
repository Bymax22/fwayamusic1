import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class BeatPackService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async createBeatPack(userId: number, beatPackData: {
    title: string;
    description?: string;
    genre?: string;
    price?: number;
    accessType?: 'FREE' | 'PREMIUM';
    beatIds?: number[];
    coverFile?: Express.Multer.File;
  }) {
    if (!beatPackData.title) {
      throw new BadRequestException('Title is required');
    }

    let coverUrl = null;
    if (beatPackData.coverFile) {
      coverUrl = await this.uploadToCloudinary(beatPackData.coverFile);
    }

    const normalizedBeatIds = (beatPackData.beatIds || [])
      .filter((beatId): beatId is number => typeof beatId === 'number' && Number.isFinite(beatId));

    // Create beat pack with beats relationship
    const beatPack = await this.prisma.beatPack.create({
      data: {
        title: beatPackData.title,
        description: beatPackData.description || '',
        genre: beatPackData.genre,
        price: beatPackData.price || 0,
        accessType: beatPackData.accessType || 'FREE',
        coverUrl,
        userId,
        beatPackBeats: {
          create: normalizedBeatIds.map((beatId, index) => ({
            beatId,
            order: index
          }))
        }
      },
      include: {
        beatPackBeats: { include: { beat: true } }
      }
    });

    return beatPack;
  }

  async updateBeatPack(userId: number, packId: number, updateData: any, coverFile?: Express.Multer.File) {
    const pack = await this.prisma.beatPack.findUnique({
      where: { id: packId }
    });

    if (!pack || pack.userId !== userId) {
      throw new ForbiddenException('You can only update your own beat packs');
    }

    let coverUrl = pack.coverUrl;
    if (coverFile) {
      coverUrl = await this.uploadToCloudinary(coverFile);
    }

    const updated = await this.prisma.beatPack.update({
      where: { id: packId },
      data: {
        title: updateData.title !== undefined ? updateData.title : pack.title,
        description: updateData.description !== undefined ? updateData.description : pack.description,
        genre: updateData.genre !== undefined ? updateData.genre : pack.genre,
        price: updateData.price !== undefined ? updateData.price : pack.price,
        accessType: updateData.accessType !== undefined ? updateData.accessType : pack.accessType,
        coverUrl
      }
    });

    return updated;
  }

  async toggleAccessType(userId: number, packId: number, newAccessType: 'FREE' | 'PREMIUM') {
    const pack = await this.prisma.beatPack.findUnique({
      where: { id: packId }
    });

    if (!pack || pack.userId !== userId) {
      throw new ForbiddenException('You can only update your own beat packs');
    }

    const updated = await this.prisma.beatPack.update({
      where: { id: packId },
      data: { accessType: newAccessType }
    });

    return { message: `Beat pack access type changed to ${newAccessType}`, pack: updated };
  }

  async getBeatPackAnalytics(userId: number | null, packId: number) {
    const pack = await this.prisma.beatPack.findUnique({
      where: { id: packId },
      include: {
        beatPackBeats: { include: { beat: true } }
      }
    });

    if (!pack || pack.userId !== userId) {
      throw new ForbiddenException('You can only view analytics for your own beat packs');
    }

    // Aggregate stats from all beats in the pack
    const totalPlayCount = pack.beatPackBeats.reduce((sum, bp) => sum + (bp.beat.playCount || 0), 0);
    const totalDownloadCount = pack.beatPackBeats.reduce((sum, bp) => sum + (bp.beat.downloadCount || 0), 0);
    const totalLikeCount = pack.beatPackBeats.reduce((sum, bp) => sum + (bp.beat.likeCount || 0), 0);

    const followerCount = await this.prisma.follower.count({
      where: { followingId: userId }
    });

    const totalEngagements = totalPlayCount + totalDownloadCount + totalLikeCount;
    const engagementRate = totalPlayCount > 0 ? ((totalEngagements / totalPlayCount) * 100).toFixed(2) : '0';

    return {
      pack: {
        id: pack.id,
        title: pack.title,
        genre: pack.genre,
        accessType: pack.accessType,
        beatCount: pack.beatPackBeats.length,
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt
      },
      analytics: {
        playCount: totalPlayCount,
        downloadCount: totalDownloadCount,
        likeCount: totalLikeCount,
        followerCount,
        engagementRate: parseFloat(engagementRate),
        estimatedRevenue: (totalDownloadCount * (pack.price || 0) * 0.7).toFixed(2)
      }
    };
  }

  async deleteBeatPack(userId: number, packId: number) {
    const pack = await this.prisma.beatPack.findUnique({
      where: { id: packId }
    });

    if (!pack || pack.userId !== userId) {
      throw new ForbiddenException('You can only delete your own beat packs');
    }

    await this.prisma.beatPack.delete({
      where: { id: packId }
    });

    return { message: 'Beat pack deleted successfully' };
  }

  async getProducerBeatPacks(producerId: number, skip: number = 0, take: number = 20) {
    return this.prisma.beatPack.findMany({
      where: { userId: producerId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        beatPackBeats: { include: { beat: true } }
      }
    });
  }

  async addBeatsToPack(userId: number, packId: number, beatIds: number[]) {
    const pack = await this.prisma.beatPack.findUnique({ where: { id: packId } });
    if (!pack || pack.userId !== userId) {
      throw new ForbiddenException('You can only modify your own beat packs');
    }

    // Create entries for beats not already present
    const existing = await this.prisma.beatPackBeat.findMany({ where: { packId } });
    const existingBeatIds = new Set(existing.map(e => e.beatId));

    const toCreate = beatIds.filter(id => !existingBeatIds.has(id)).map((beatId, idx) => ({
      packId,
      beatId,
      order: existing.length + idx
    }));

    if (toCreate.length === 0) return { message: 'No new beats added' };

    await this.prisma.beatPackBeat.createMany({ data: toCreate });
    return { message: `Added ${toCreate.length} beats to pack` };
  }

  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'fwaya-beat-packs',
          resource_type: 'image',
          public_id: `${Date.now()}_${file.originalname.split('.')[0]}`,
          overwrite: true,
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(new BadRequestException(`Failed to upload file: ${error?.message || 'No upload URL returned'}`));
          } else {
            resolve(result.secure_url);
          }
        }
      );

      const bufferStream = Readable.from([file.buffer]);
      bufferStream.pipe(uploadStream);
    });
  }
}

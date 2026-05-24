import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { SubscriptionService } from '../subscription/subscription.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService, private subscriptionService: SubscriptionService) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
    } catch (error) {
      this.logger.error('Failed to configure Cloudinary:', error);
    }
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    // 1️⃣ Defensive guard
    if (!id || isNaN(Number(id))) {
      this.logger.error(`findOne called with invalid id: ${id}`);
      throw new BadRequestException('User ID is required and must be a valid number');
    }

    // 2️⃣ Fetch user safely
    const user = await this.prisma.user.findUnique({
      where: { id: Number(id) },
    });

    // 3️⃣ Optional: better error message
    if (!user) {
      this.logger.warn(`User not found for id=${id}`);
      throw new BadRequestException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Return a richer profile for the given user email
   */
  async getProfileByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        playlists: { include: { entries: { include: { media: true } } } },
        interactions: { include: { media: true } },
        downloads: { include: { media: true } },
        verifications: true,
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!user) throw new BadRequestException('User not found');

    await this.subscriptionService.refreshUserPremiumStatus(user.id);

    return this.prisma.user.findUnique({
      where: { email },
      include: {
        playlists: { include: { entries: { include: { media: true } } } },
        interactions: { include: { media: true } },
        downloads: { include: { media: true } },
        verifications: true,
        subscriptions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
  }

  async getPlaylistsForUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new BadRequestException('User not found');
    return this.prisma.playlist.findMany({ where: { userId: user.id }, include: { entries: { include: { media: true } } } });
  }

  async getLikedMediaByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new BadRequestException('User not found');
    return this.prisma.mediaInteraction.findMany({ where: { userId: user.id, liked: true }, include: { media: true } });
  }

  async getRecentPlaysByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new BadRequestException('User not found');
    return this.prisma.mediaInteraction.findMany({ where: { userId: user.id, played: true }, include: { media: true }, orderBy: { interactedAt: 'desc' }, take: 50 });
  }

  async getDownloadsByEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new BadRequestException('User not found');
    return this.prisma.download.findMany({ where: { userId: user.id }, include: { media: true }, orderBy: { downloadedAt: 'desc' } });
  }

  async updateProfileByEmail(email: string, updateData: { displayName?: string; bio?: string; location?: string; website?: string; country?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new BadRequestException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return this.getProfileByEmail(email);
  }

  async uploadToCloudinary(file: Express.Multer.File, type: 'avatar' | 'cover' = 'avatar'): Promise<UploadApiResponse> {
    const folder = type === 'avatar' ? 'fwaya-avatars' : 'fwaya-covers';
    
    try {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder,
          resource_type: 'image',
          public_id: `${type}_${Date.now()}_${file.originalname.replace(/\.[^/.]+$/, "")}`,
          quality: 'auto',
          width: type === 'avatar' ? 200 : 1920,
          height: type === 'avatar' ? 200 : 400,
          crop: 'fill',
          gravity: 'face',
        }
      );
      return uploadResult;
    } catch (error) {
      this.logger.error(`Cloudinary ${type} upload failed:`, error);
      throw new BadRequestException(
        `Failed to upload ${type}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async updateAvatarByEmail(email: string, avatarUrl: string, cloudinaryPublicId: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new BadRequestException('User not found');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl, cloudinaryPublicId },
    });

    return this.getProfileByEmail(email);
  }

  async updateCoverByEmail(email: string, coverImageUrl: string, coverCloudinaryPublicId: string) {
    const user = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new BadRequestException('User not found');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { coverImageUrl, cloudinaryPublicId: coverCloudinaryPublicId },
    });

    return this.getProfileByEmail(email);
  }
}

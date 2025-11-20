import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

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
      },
    });

    if (!user) throw new BadRequestException('User not found');

    return user;
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
}

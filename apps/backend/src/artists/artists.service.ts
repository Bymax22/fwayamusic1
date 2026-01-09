import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArtistsService {
  constructor(private prisma: PrismaService) {}

  async getAllArtists() {
    // Use User model and filter by role
    const artists = await this.prisma.user.findMany({
      where: { role: 'ARTIST' },
      include: {
        _count: {
          select: { media: true }
        }
      }
    });

    // Transform to match frontend Artist interface
    return artists.map(artist => ({
      id: artist.id.toString(),
      name: artist.displayName || artist.username,
      imageUrl: artist.avatarUrl || '/default-artist.png',
      avatarUrl: artist.avatarUrl || '/default-artist.png',
      followers: Math.floor(Math.random() * 10000) + 1000, // Placeholder - implement proper follower count later
      isVerified: artist.status === 'VERIFIED', // Assuming status field exists
      isFollowing: false, // This would be user-specific
      mediaCount: artist._count.media
    }));
  }
}
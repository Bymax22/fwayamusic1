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
          select: {
            media: true,
            followers: true,
          }
        },
        media: {
          select: {
            playCount: true
          }
        }
      }
    });

    // Transform to match frontend Artist interface
    return artists.map(artist => ({
      id: artist.id.toString(),
      name: artist.displayName || artist.username,
      imageUrl: artist.avatarUrl || '/default-artist.png',
      avatarUrl: artist.avatarUrl || '/default-artist.png',
      followers: artist._count.followers,
      isVerified: artist.status === 'VERIFIED',
      isFollowing: false, // This would be user-specific
      mediaCount: artist._count.media
    }));
  }

  async getArtistById(id: number) {
    const artist = await this.prisma.user.findUnique({
      where: { id },
      include: {
        media: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            media: true,
            followers: true,
          }
        }
      }
    });

    if (!artist || artist.role !== 'ARTIST') {
      throw new Error('Artist not found');
    }

    // Transform media to include artist field
    const transformedMedia = artist.media.map((media: any) => ({
      ...media,
      artist: artist.displayName || artist.username
    }));

    return {
      id: artist.id.toString(),
      name: artist.displayName || artist.username,
      imageUrl: artist.avatarUrl || '/default-artist.png',
      avatarUrl: artist.avatarUrl || '/default-artist.png',
      bio: artist.bio,
      website: artist.website,
      followers: artist._count.followers,
      isVerified: artist.status === 'VERIFIED',
      isFollowing: false, // This would be user-specific
      mediaCount: artist._count.media,
      media: transformedMedia,
      totalPlays: transformedMedia.reduce((sum: number, media: any) => sum + (media.playCount || 0), 0)
    };
  }
}
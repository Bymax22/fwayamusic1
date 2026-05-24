import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentStatus, DeletionReason } from '@prisma/client';

@Injectable()
export class AlbumsService {
  constructor(private prisma: PrismaService) {}

  // Create a new album
  async createAlbum(
    artistId: number,
    data: {
      title: string;
      description?: string;
      tags?: string[];
      releaseDate?: Date;
      recordLabel?: string;
      copyrightYear?: number;
      coverImageUrl?: string;
      cloudinaryId?: string;
    },
  ) {
    const {
      title,
      description,
      tags,
      releaseDate,
      recordLabel,
      coverImageUrl,
      cloudinaryId,
    } = data;

    const album = await this.prisma.album.create({
      data: {
        title,
        description,
        releaseDate,
        recordLabel,
        coverUrl: coverImageUrl,
        cloudinaryPublicId: cloudinaryId,
        userId: artistId,
        contentStatus: ContentStatus.DRAFT,
      },
      include: {
        media: {
          where: { deletedAt: null },
        },
      },
    });

    return album;
  }

  // Get all albums for an artist
  async getArtistAlbums(artistId: number, includeDeleted = false) {
    const where: any = { userId: artistId };
    if (!includeDeleted) {
      // albums table does not track deletedAt; filter media instead when needed
    }

    const albums = await this.prisma.album.findMany({
      where,
      include: {
        media: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        user: {
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

    return albums;
  }

  // Get album by ID
  async getAlbumById(albumId: number) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: {
        media: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            verifiedArtist: true,
          },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    return album;
  }

  // Update album
  async updateAlbum(
    albumId: number,
    userId: number,
    data: any,
  ) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    // Check authorization
    if (album.userId !== userId) {
      throw new ForbiddenException('You can only edit your own albums');
    }

    // Don't allow status changes through normal update
    const {
      contentStatus,
      coverImageUrl,
      cloudinaryId,
      ...rest
    } = data;

    const updateData: any = {
      ...rest,
      ...(coverImageUrl !== undefined ? { coverUrl: coverImageUrl } : {}),
      ...(cloudinaryId !== undefined ? { cloudinaryPublicId: cloudinaryId } : {}),
    };

    const updated = await this.prisma.album.update({
      where: { id: albumId },
      data: updateData,
      include: {
        media: {
          where: { deletedAt: null },
        },
      },
    });

    return updated;
  }

  // Publish album (change status to PUBLISHED)
  async publishAlbum(albumId: number, userId: number) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: {
        media: {
          where: { deletedAt: null },
        },
      },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.userId !== userId) {
      throw new ForbiddenException('You can only publish your own albums');
    }

    if (album.media.length === 0) {
      throw new BadRequestException('Cannot publish album with no tracks');
    }

    const updated = await this.prisma.album.update({
      where: { id: albumId },
      data: {
        contentStatus: ContentStatus.PUBLISHED,
        isPublic: true,
      },
    });

    return updated;
  }

  // Submit album for review
  async submitAlbumForReview(albumId: number, userId: number) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.userId !== userId) {
      throw new ForbiddenException('You can only submit your own albums');
    }

    const updated = await this.prisma.album.update({
      where: { id: albumId },
      data: { contentStatus: ContentStatus.SUBMITTED },
    });

    return updated;
  }

  // Archive album
  async archiveAlbum(albumId: number, userId: number) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.userId !== userId) {
      throw new ForbiddenException('You can only archive your own albums');
    }

    const updated = await this.prisma.album.update({
      where: { id: albumId },
      data: {
        contentStatus: ContentStatus.ARCHIVED,
        isPublic: false,
      },
    });

    return updated;
  }

  // Delete album (soft delete)
  async deleteAlbum(
    albumId: number,
    userId: number,
    reason: DeletionReason = DeletionReason.USER_REQUEST,
  ) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.userId !== userId) {
      throw new ForbiddenException('You can only delete your own albums');
    }

    // Soft delete album and all its tracks
    await this.prisma.album.update({
      where: { id: albumId },
      data: {
        contentStatus: ContentStatus.DELETED,
        isPublic: false,
      },
    });

    // Also soft delete all tracks in the album
    await this.prisma.media.updateMany({
      where: { albumId },
      data: {
        deletedAt: new Date(),
        deletionReason: reason,
        contentStatus: ContentStatus.DELETED,
      },
    });

    return { message: 'Album deleted successfully' };
  }

  // Update album cover image
  async updateAlbumCover(
    albumId: number,
    userId: number,
    coverImageUrl: string,
    cloudinaryId?: string,
  ) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.userId !== userId) {
      throw new ForbiddenException('You can only update your own album cover');
    }

    const updated = await this.prisma.album.update({
      where: { id: albumId },
      data: {
        coverUrl: coverImageUrl,
        cloudinaryPublicId: cloudinaryId,
      },
    });

    return updated;
  }

  // Get album statistics
  async getAlbumStats(albumId: number) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    const tracks = await this.prisma.media.findMany({
      where: {
        albumId,
        deletedAt: null,
      },
    });

    const stats = {
      totalTracks: tracks.length,
      totalPlays: tracks.reduce((sum, t) => sum + (t.playCount || 0), 0),
      totalDownloads: tracks.reduce((sum, t) => sum + (t.downloadCount || 0), 0),
      totalShares: tracks.reduce((sum, t) => sum + (t.shareCount || 0), 0),
      averagePlayCount: tracks.length > 0 
        ? Math.round(tracks.reduce((sum, t) => sum + (t.playCount || 0), 0) / tracks.length)
        : 0,
    };

    return {
      album,
      stats,
    };
  }

  // Add track to album
  async addTrackToAlbum(albumId: number, mediaId: number, userId: number) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.userId !== userId) {
      throw new ForbiddenException('You can only add tracks to your own albums');
    }

    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media || media.userId !== userId) {
      throw new NotFoundException('Track not found or you do not own it');
    }

    const updated = await this.prisma.media.update({
      where: { id: mediaId },
      data: { albumId },
    });

    return updated;
  }

  // Remove track from album
  async removeTrackFromAlbum(albumId: number, mediaId: number, userId: number) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    if (album.userId !== userId) {
      throw new ForbiddenException('You can only modify your own albums');
    }

    const updated = await this.prisma.media.update({
      where: { id: mediaId },
      data: { albumId: null },
    });

    return updated;
  }
}

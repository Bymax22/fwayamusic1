import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { PlaylistType } from '@prisma/client';

@Injectable()
export class PlaylistService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.playlist.findMany({
      include: {
        entries: {
          include: {
            media: true, // Include the actual media items in each entry
          },
        },
      },
    });
  }

  async findByType(type: string) {
    return this.prisma.playlist.findMany({
      where: { type: type as PlaylistType },
      include: {
        entries: {
          include: {
            media: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.playlist.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            media: true,
          },
        },
      },
    });
  }

  async addMediaToPlaylist(playlistId: number, mediaId: number, userId: number) {
    // First check if the playlist exists and belongs to the user
    const playlist = await this.prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId: userId,
      },
    });

    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }

    // Check if media exists
    const media = await this.prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    // Check if media is already in playlist
    const existingEntry = await this.prisma.playlistEntry.findFirst({
      where: {
        playlistId: playlistId,
        mediaId: mediaId,
      },
    });

    if (existingEntry) {
      throw new Error('Media already in playlist');
    }

    // Add media to playlist
    return this.prisma.playlistEntry.create({
      data: {
        playlistId: playlistId,
        mediaId: mediaId,
      },
      include: {
        media: true,
        playlist: true,
      },
    });
  }

  async removeMediaFromPlaylist(playlistId: number, mediaId: number, userId: number) {
    // First check if the playlist exists and belongs to the user
    const playlist = await this.prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId: userId,
      },
    });

    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }

    // Remove media from playlist
    return this.prisma.playlistEntry.deleteMany({
      where: {
        playlistId: playlistId,
        mediaId: mediaId,
      },
    });
  }
}
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { PlaylistType } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class PlaylistService {
  constructor(private prisma: PrismaService, private eventsGateway: EventsGateway) {}

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

  async createPlaylist(userId: number, data: { name: string; description?: string; isPublic?: boolean; coverUrl?: string; type?: string }) {
    return this.prisma.playlist.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        isPublic: data.isPublic ?? false,
        coverUrl: data.coverUrl ?? null,
        type: data.type ? (data.type as PlaylistType) : PlaylistType.USER,
        userId,
      },
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

    // Get the next position (max position + 1)
    const maxPosition = await this.prisma.playlistEntry.aggregate({
      where: { playlistId: playlistId },
      _max: { position: true },
    });
    const nextPosition = (maxPosition._max.position || 0) + 1;

    // Add media to playlist
    const entry = await this.prisma.playlistEntry.create({
      data: {
        playlistId: playlistId,
        mediaId: mediaId,
        position: nextPosition,
      },
      include: {
        media: true,
        playlist: true,
      },
    });

    // Emit realtime update
    try {
      this.eventsGateway.emitPlaylistUpdated({ playlistId, userId, action: 'add', entry });
    } catch (err) {}

    return entry;
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
    const deleted = await this.prisma.playlistEntry.deleteMany({
      where: {
        playlistId: playlistId,
        mediaId: mediaId,
      },
    });

    try {
      this.eventsGateway.emitPlaylistUpdated({ playlistId, userId, action: 'remove', entry: { mediaId } });
    } catch (err) {}

    return deleted;
  }

  async updatePlaylist(playlistId: number, userId: number, data: { name?: string; description?: string; isPublic?: boolean; coverUrl?: string }) {
    // Verify ownership
    const playlist = await this.prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId: userId,
      },
    });

    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }

    const updated = await this.prisma.playlist.update({
      where: { id: playlistId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.coverUrl !== undefined && { coverUrl: data.coverUrl }),
      },
      include: {
        entries: {
          include: {
            media: true,
          },
        },
      },
    });

    try {
      this.eventsGateway.emitPlaylistUpdated({ playlistId, userId, action: 'update', playlist: updated });
    } catch (err) {}

    return updated;
  }

  async deletePlaylist(playlistId: number, userId: number) {
    // Verify ownership
    const playlist = await this.prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId: userId,
      },
    });

    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }

    // Delete all entries first
    await this.prisma.playlistEntry.deleteMany({
      where: { playlistId: playlistId },
    });

    // Delete the playlist
    const deleted = await this.prisma.playlist.delete({
      where: { id: playlistId },
    });

    try {
      this.eventsGateway.emitPlaylistUpdated({ playlistId, userId, action: 'delete' });
    } catch (err) {}

    return deleted;
  }
}
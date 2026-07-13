import { Controller, Get, Post, Body, Param, Query, Delete, Logger } from '@nestjs/common';
import { PlaylistService } from './playlist.service';

@Controller('v1/playlist')
export class PlaylistController {
  private readonly logger = new Logger(PlaylistController.name);

  constructor(private readonly playlistService: PlaylistService) {}

  private sanitizeForJson(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value === 'bigint') {
      try {
        const asNumber = Number(value);
        return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
      } catch {
        return value.toString();
      }
    }
    if (Array.isArray(value)) return value.map((v) => this.sanitizeForJson(v));
    if (typeof value === 'object') {
      const out: any = {};
      for (const k of Object.keys(value)) {
        out[k] = this.sanitizeForJson(value[k]);
      }
      return out;
    }
    return value;
  }

  @Get()
  async getAll(@Query('type') type?: string) {
    try {
      const playlists = type ? await this.playlistService.findByType(type) : await this.playlistService.findAll();
      return this.sanitizeForJson(playlists);
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    try {
      const playlist = await this.playlistService.findOne(Number(id));
      return this.sanitizeForJson(playlist);
    } catch (error) {
      this.logger.error('Failed to fetch playlist', error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Post(':id/media')
  async addMediaToPlaylist(
    @Param('id') playlistId: string,
    @Body() body: { mediaId: number; userId: number }
  ) {
    return this.playlistService.addMediaToPlaylist(Number(playlistId), body.mediaId, body.userId);
  }

  @Delete(':id/media/:mediaId')
  async removeMediaFromPlaylist(
    @Param('id') playlistId: string,
    @Param('mediaId') mediaId: string,
    @Body() body: { userId: number }
  ) {
    return this.playlistService.removeMediaFromPlaylist(Number(playlistId), Number(mediaId), body.userId);
  }
}
import { Controller, Get, Post, Body, Param, Query, Delete } from '@nestjs/common';
import { PlaylistService } from './playlist.service';

@Controller('v1/playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  async getAll(@Query('type') type?: string) {
    if (type) {
      return this.playlistService.findByType(type);
    }
    return this.playlistService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.playlistService.findOne(Number(id));
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
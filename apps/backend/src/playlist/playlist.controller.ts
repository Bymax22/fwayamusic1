import { Controller, Get, Param, Query } from '@nestjs/common';
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
}
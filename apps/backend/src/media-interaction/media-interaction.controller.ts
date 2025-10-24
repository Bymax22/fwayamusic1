import { Controller, Post, Body, Param } from '@nestjs/common';
import { MediaInteractionService } from './media-interaction.service';

@Controller('v1/media/:mediaId/interact')
export class MediaInteractionController {
  constructor(private readonly service: MediaInteractionService) {}

  @Post('like')
  async like(@Param('mediaId') mediaId: number, @Body('userId') userId: number) {
    return this.service.likeMedia(mediaId, userId);
  }

  @Post('heart')
  async heart(@Param('mediaId') mediaId: number, @Body('userId') userId: number) {
    return this.service.heartMedia(mediaId, userId);
  }

  @Post('play')
  async play(@Param('mediaId') mediaId: number, @Body('userId') userId: number) {
    return this.service.playMedia(mediaId, userId);
  }

  @Post('download')
  async download(@Param('mediaId') mediaId: number, @Body('userId') userId: number) {
    return this.service.downloadMedia(mediaId, userId);
  }
}
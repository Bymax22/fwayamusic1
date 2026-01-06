import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MediaInteractionService } from './media-interaction.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';

@Controller('v1/media/:mediaId/interact')
@UseGuards(FirebaseAuthGuard)
export class MediaInteractionController {
  constructor(private readonly service: MediaInteractionService) {}

  @Post('like')
  async like(@Param('mediaId') mediaId: number, @CurrentUser() user: any) {
    return this.service.likeMedia(mediaId, user.id);
  }

  @Post('heart')
  async heart(@Param('mediaId') mediaId: number, @CurrentUser() user: any) {
    return this.service.heartMedia(mediaId, user.id);
  }

  @Post('play')
  async play(@Param('mediaId') mediaId: number, @CurrentUser() user: any) {
    return this.service.playMedia(mediaId, user.id);
  }

  @Post('download')
  async download(@Param('mediaId') mediaId: string, @CurrentUser() user: any, @Body() body: { deviceId?: string }) {
    return this.service.downloadMedia(parseInt(mediaId, 10), user.id, body.deviceId);
  }
}
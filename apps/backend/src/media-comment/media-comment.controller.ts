import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { MediaCommentService } from './media-comment.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';

@Controller('v1/media/:mediaId/comments')
export class MediaCommentController {
  constructor(private readonly commentService: MediaCommentService) {}

  @Get()
  async getComments(@Param('mediaId') mediaId: string) {
    return this.commentService.getCommentsForMedia(parseInt(mediaId, 10));
  }

  @UseGuards(FirebaseAuthGuard)
  @Post()
  async postComment(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: any,
    @Body('content') content: string,
    @Body('parentId') parentId?: number,
  ) {
    return this.commentService.createComment(parseInt(mediaId, 10), user.id, content, parentId);
  }
}

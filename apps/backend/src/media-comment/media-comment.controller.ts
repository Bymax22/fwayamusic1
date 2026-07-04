import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
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

  @UseGuards(FirebaseAuthGuard)
  @Post(':commentId/like')
  async likeComment(
    @Param('mediaId') mediaId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
  ) {
    return this.commentService.likeComment(parseInt(mediaId, 10), parseInt(commentId, 10), user.id);
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':commentId/like')
  async unlikeComment(
    @Param('mediaId') mediaId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
  ) {
    return this.commentService.unlikeComment(parseInt(mediaId, 10), parseInt(commentId, 10), user.id);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('likes')
  async getLikedCommentIds(
    @Param('mediaId') mediaId: string,
    @CurrentUser() user: any,
  ) {
    return this.commentService.getLikedCommentIds(parseInt(mediaId, 10), user.id);
  }
}

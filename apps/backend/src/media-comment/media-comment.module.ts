import { Module } from '@nestjs/common';
import { MediaCommentController } from './media-comment.controller';
import { MediaCommentService } from './media-comment.service';
import { PrismaModule } from '../db/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediaCommentController],
  providers: [MediaCommentService],
})
export class MediaCommentModule {}

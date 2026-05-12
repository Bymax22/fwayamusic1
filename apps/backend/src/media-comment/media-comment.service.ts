import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class MediaCommentService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommentsForMedia(mediaId: number) {
    const comments = await this.prisma.mediaComment.findMany({
      where: { mediaId, parentId: null },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            status: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      userId: comment.userId,
      userName: comment.user.displayName || 'Anonymous',
      userAvatar: comment.user.avatarUrl || '/default-avatar.jpg',
      content: comment.content,
      timestamp: comment.createdAt.toISOString(),
      likes: comment.likes,
      isVerified: comment.user.status === 'VERIFIED',
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        userId: reply.userId,
        userName: reply.user.displayName || 'Anonymous',
        userAvatar: reply.user.avatarUrl || '/default-avatar.jpg',
        content: reply.content,
        timestamp: reply.createdAt.toISOString(),
        likes: reply.likes,
        isVerified: reply.user.status === 'VERIFIED',
      })),
    }));
  }

  async createComment(mediaId: number, userId: number, content: string, parentId?: number) {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new Error('Media not found');
    }

    if (parentId) {
      const parentComment = await this.prisma.mediaComment.findUnique({ where: { id: parentId } });
      if (!parentComment || parentComment.mediaId !== mediaId) {
        throw new Error('Invalid parent comment');
      }
    }

    const comment = await this.prisma.mediaComment.create({
      data: {
        mediaId,
        userId,
        content,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });

    return {
      id: comment.id,
      userId: comment.userId,
      userName: comment.user.displayName || 'Anonymous',
      userAvatar: comment.user.avatarUrl || '/default-avatar.jpg',
      content: comment.content,
      timestamp: comment.createdAt.toISOString(),
      likes: comment.likes,
      isVerified: comment.user.status === 'VERIFIED',
      replies: [],
    };
  }
}

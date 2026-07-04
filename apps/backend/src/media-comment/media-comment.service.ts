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

  async likeComment(mediaId: number, commentId: number, userId: number) {
    const comment = await this.prisma.mediaComment.findFirst({
      where: { id: commentId, mediaId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const existingLike = await this.prisma.mediaCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      return {
        id: comment.id,
        likes: comment.likes,
      };
    }

    const updated = await this.prisma.$transaction(async (prisma) => {
      await prisma.mediaCommentLike.create({
        data: {
          commentId,
          userId,
        },
      });

      return prisma.mediaComment.update({
        where: { id: commentId },
        data: {
          likes: {
            increment: 1,
          },
        },
      });
    });

    return {
      id: updated.id,
      likes: updated.likes,
    };
  }

  async unlikeComment(mediaId: number, commentId: number, userId: number) {
    const comment = await this.prisma.mediaComment.findFirst({
      where: { id: commentId, mediaId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    const existingLike = await this.prisma.mediaCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (!existingLike) {
      return {
        id: comment.id,
        likes: comment.likes,
      };
    }

    const updated = await this.prisma.$transaction(async (prisma) => {
      await prisma.mediaCommentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
      });

      return prisma.mediaComment.update({
        where: { id: commentId },
        data: {
          likes: comment.likes > 0 ? { decrement: 1 } : undefined,
        },
      });
    });

    return {
      id: updated.id,
      likes: updated.likes,
    };
  }

  async getLikedCommentIds(mediaId: number, userId: number) {
    const likes = await this.prisma.mediaCommentLike.findMany({
      where: {
        userId,
        comment: {
          mediaId,
        },
      },
      select: {
        commentId: true,
      },
    });

    return likes.map((like) => like.commentId);
  }
}

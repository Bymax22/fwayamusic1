import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class FollowerService {
  constructor(private prisma: PrismaService) {}

  async followUser(followerId: number, followingId: number) {
    return this.prisma.follower.create({
      data: { followerId, followingId },
    });
  }

  async unfollowUser(followerId: number, followingId: number) {
    return this.prisma.follower.deleteMany({
      where: { followerId, followingId },
    });
  }

  async isFollowing(followerId: number, followingId: number) {
    const count = await this.prisma.follower.count({
      where: { followerId, followingId },
    });
    return count > 0;
  }

  async getFollowers(userId: number) {
    return this.prisma.follower.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });
  }

  async getFollowing(userId: number) {
    return this.prisma.follower.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            status: true,
          },
        },
      },
    });
  }
}
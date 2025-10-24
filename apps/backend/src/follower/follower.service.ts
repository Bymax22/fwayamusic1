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
}
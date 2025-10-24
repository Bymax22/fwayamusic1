import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { PlaylistType } from '@prisma/client';

@Injectable()
export class PlaylistService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.playlist.findMany({
      include: {
        entries: {
          include: {
            media: true, // Include the actual media items in each entry
          },
        },
      },
    });
  }

  async findByType(type: string) {
    return this.prisma.playlist.findMany({
      where: { type: type as PlaylistType },
      include: {
        entries: {
          include: {
            media: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.playlist.findUnique({
      where: { id },
      include: {
        entries: {
          include: {
            media: true,
          },
        },
      },
    });
  }
}
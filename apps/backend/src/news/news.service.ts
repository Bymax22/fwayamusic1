import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async getAllNews() {
    return this.prisma.news.findMany({
      include: {
        comments: {
          include: {
            user: true
          }
        },
        reactions: true,
        author: true
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });
  }

  async getNewsById(id: string) {
    return this.prisma.news.findUnique({
      where: { id: parseInt(id) },
      include: {
        comments: {
          include: {
            user: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        reactions: true,
        author: true
      }
    });
  }
}
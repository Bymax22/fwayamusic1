import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';

@Injectable()
export class BeatsService {
  constructor(private prisma: PrismaService) {}

  async getAllBeats() {
    // Use Media model and filter by type or genre
    return this.prisma.media.findMany({
      where: { type: 'AUDIO', genre: { contains: 'beat' } }
    });
  }
}
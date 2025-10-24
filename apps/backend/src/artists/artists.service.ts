import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ArtistsService {
  constructor(private prisma: PrismaService) {}

  async getAllArtists() {
    // Use User model and filter by role
    return this.prisma.user.findMany({
      where: { role: 'ARTIST' }
    });
  }
}
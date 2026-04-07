import { Injectable } from '@nestjs/common';
import { PrismaService } from './db/prisma.service';

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkDatabaseConnection(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}

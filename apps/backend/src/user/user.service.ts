import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    // 1️⃣ Defensive guard
    if (!id || isNaN(Number(id))) {
      this.logger.error(`findOne called with invalid id: ${id}`);
      throw new BadRequestException('User ID is required and must be a valid number');
    }

    // 2️⃣ Fetch user safely
    const user = await this.prisma.user.findUnique({
      where: { id: Number(id) },
    });

    // 3️⃣ Optional: better error message
    if (!user) {
      this.logger.warn(`User not found for id=${id}`);
      throw new BadRequestException(`User with ID ${id} not found`);
    }

    return user;
  }
}

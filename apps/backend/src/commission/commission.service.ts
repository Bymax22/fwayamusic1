import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommissionService {
  constructor(private readonly prisma: PrismaService) {}

  async createCommission(data: any) {
    return this.prisma.commission.create({ data });
  }

  async getCommissionById(id: number) {
    return this.prisma.commission.findUnique({ where: { id } });
  }

  async listCommissions() {
    return this.prisma.commission.findMany();
  }

  async updateCommission(id: number, data: any) {
    return this.prisma.commission.update({ where: { id }, data });
  }

  async deleteCommission(id: number) {
    return this.prisma.commission.delete({ where: { id } });
  }
}
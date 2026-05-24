import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { CreateKYCDto } from './dto/create-kyc.dto';
import { ReviewKYCDto } from './dto/review-kyc.dto';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  constructor(private prisma: PrismaService) {}

  async submitDocument(userId: number, dto: CreateKYCDto) {
    return this.prisma.kYCDocument.create({
      data: {
        user: { connect: { id: userId } },
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        frontImageUrl: dto.frontImageUrl,
        backImageUrl: dto.backImageUrl,
        selfieImageUrl: dto.selfieImageUrl,
        metadata: dto.metadata || {},
      },
    });
  }

  async getForUser(userId: number) {
    return this.prisma.kYCDocument.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async getPending() {
    return this.prisma.kYCDocument.findMany({ where: { status: 'PENDING_REVIEW' } });
  }

  async reviewDocument(id: number, reviewerId: number, dto: ReviewKYCDto) {
    const data: any = {
      status: dto.status,
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    };
    if (dto.rejectionReason) data.rejectionReason = dto.rejectionReason;

    this.logger.log(`Reviewing KYC document ${id} by ${reviewerId} -> ${dto.status}`);

    return this.prisma.kYCDocument.update({ where: { id }, data });
  }
}

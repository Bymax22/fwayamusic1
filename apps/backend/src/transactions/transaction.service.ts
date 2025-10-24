import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionStatus } from '@prisma/client'; 

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateTransactionDto, userId: number) {
    if (typeof createDto.amount !== 'number' || isNaN(createDto.amount) || createDto.amount <= 0) {
      throw new BadRequestException('amount must be a positive number');
    }

    try {
      const reference = this.generateReference();

      // build metadata safely to avoid spreading non-object types
      const baseMetadata: Record<string, any> =
        (createDto.metadata && typeof createDto.metadata === 'object' && !Array.isArray(createDto.metadata))
          ? ({ ...(createDto.metadata as Record<string, any>) })
          : {};

      baseMetadata.deviceInfo = createDto.deviceInfo ?? null;

      const tx = await this.prisma.transaction.create({
        data: {
          amount: createDto.amount,
          currency: (createDto.currency ?? 'USD') as any,
          userId,
          mediaId: createDto.mediaId ?? null,
          paymentMethod: (createDto.paymentMethod ?? 'OTHER') as any,
          paymentProvider: (createDto.paymentProvider ?? 'OTHER') as any,
          status: TransactionStatus.PENDING, // <-- use enum
          reference,
          metadata: baseMetadata as any,
          resellerLinkId: null,
          isResellerSale: false,
        },
      });

      return tx;
    } catch (err) {
      this.logger.error('create transaction failed', err as any);
      throw new InternalServerErrorException('Failed to create transaction');
    }
  }

  async findAll(skip = 0, take = 50) {
    return this.prisma.transaction.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { media: true, user: true, commissions: true },
    });
  }

  async findOne(id: number) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id },
      include: { media: true, user: true, commissions: true },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async findByReference(reference: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { reference },
      include: { media: true, user: true, commissions: true },
    });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async update(id: number, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Transaction not found');

    try {
      // resolve status safely as Prisma enum
      let statusToSet: TransactionStatus = existing.status;
      if (dto.status) {
        if (!Object.values(TransactionStatus).includes(dto.status as TransactionStatus)) {
          throw new BadRequestException('Invalid transaction status');
        }
        statusToSet = dto.status as TransactionStatus;
      }

      // merge metadata safely (only when objects)
      const existingMeta =
        existing.metadata && typeof existing.metadata === 'object' && !Array.isArray(existing.metadata)
          ? (existing.metadata as Record<string, any>)
          : {};
      const dtoMeta =
        dto.metadata && typeof dto.metadata === 'object' && !Array.isArray(dto.metadata)
          ? (dto.metadata as Record<string, any>)
          : {};
      const mergedMeta = { ...existingMeta, ...dtoMeta };

      const updated = await this.prisma.transaction.update({
        where: { id },
        data: {
          status: statusToSet,
          providerReference: dto.providerReference ?? existing.providerReference,
          metadata: mergedMeta as any,
        },
      });
      return updated;
    } catch (err) {
      this.logger.error('update transaction failed', err as any);
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Failed to update transaction');
    }
  }

  async findByUser(userId: number, skip = 0, take = 50) {
    return this.prisma.transaction.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { media: true, commissions: true },
    });
  }

  private generateReference(): string {
    return `TRX-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
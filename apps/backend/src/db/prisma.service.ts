// apps/backend/src/db/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly maxRetries = 5;
  private readonly retryDelay = 3000; // 3 seconds

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
    this.logger.log('PrismaService instantiated, waiting for module init...');
  }

  async onModuleInit() {
    this.logger.log('PrismaService: onModuleInit called');
    await this.connectWithRetry();
  }

  private async connectWithRetry(attempt: number = 1): Promise<void> {
    try {
      this.logger.log(`Attempting to connect to database (attempt ${attempt}/${this.maxRetries})...`);
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      if (attempt < this.maxRetries) {
        this.logger.warn(
          `Database connection failed, retrying in ${this.retryDelay}ms... Error: ${error instanceof Error ? error.message : String(error)}`
        );
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        await this.connectWithRetry(attempt + 1);
      } else {
        this.logger.error('Failed to connect to database after maximum retries');
        throw new Error(`Unable to connect to database after ${this.maxRetries} attempts`);
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
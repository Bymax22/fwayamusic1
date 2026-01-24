import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../db/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: configService.get<number>('MAX_FILE_SIZE_BYTES'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forFeature(() => ({
      MAX_FILE_SIZE_BYTES: parseInt(process.env.MAX_FILE_SIZE_MB || '25') * 1024 * 1024,
    })),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService], // If the service will be used elsewhere
})
export class MediaModule {}
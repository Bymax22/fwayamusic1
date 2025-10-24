import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../db/prisma.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>('UPLOAD_DIR'),
          filename: (req, file, cb) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
        limits: {
          fileSize: configService.get<number>('MAX_FILE_SIZE_BYTES'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forFeature(() => ({
      UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
      MAX_FILE_SIZE_BYTES: parseInt(process.env.MAX_FILE_SIZE_MB || '100') * 1024 * 1024,
    })),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService], // If the service will be used elsewhere
})
export class MediaModule {}
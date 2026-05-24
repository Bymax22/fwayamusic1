import { Module } from '@nestjs/common';
import { AlbumsService } from './albums.service';
import { AlbumsController } from './albums.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';

@Module({
  controllers: [AlbumsController],
  providers: [AlbumsService, PrismaService, CloudinaryService],
  exports: [AlbumsService],
})
export class AlbumsModule {}

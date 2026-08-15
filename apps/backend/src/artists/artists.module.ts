import { Module } from '@nestjs/common';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';
import { PrismaModule } from '../db/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ArtistsController],
  providers: [ArtistsService],
})
export class ArtistsModule {}
import { Module } from '@nestjs/common';
import { MediaInteractionController } from './media-interaction.controller';
import { MediaInteractionService } from './media-interaction.service';
import { PrismaModule } from '../db/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediaInteractionController],
  providers: [MediaInteractionService],
})
export class MediaInteractionModule {}
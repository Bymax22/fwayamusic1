import { Module } from '@nestjs/common';
import { MediaInteractionController } from './media-interaction.controller';
import { MediaInteractionService } from './media-interaction.service';
import { PrismaModule } from '../db/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [PrismaModule, EventsModule],
  controllers: [MediaInteractionController],
  providers: [MediaInteractionService],
})
export class MediaInteractionModule {}
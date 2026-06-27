import { Module } from '@nestjs/common';
import { BeatPackService } from './beat-pack.service';
import { BeatPackController } from './beat-pack.controller';
import { PrismaModule } from '../db/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BeatPackService],
  controllers: [BeatPackController],
  exports: [BeatPackService]
})
export class BeatPacksModule {}

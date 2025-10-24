import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TrackController } from './track.controller';
import { TrackService } from './track.service';
import { Track } from './track.model';

@Module({
  imports: [SequelizeModule.forFeature([Track])],
  controllers: [TrackController],
  providers: [TrackService],
  exports: [TrackService]
})
export class TrackModule {}
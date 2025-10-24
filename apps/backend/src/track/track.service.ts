import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Track } from './track.model';

@Injectable()
export class TrackService {
  constructor(
    @InjectModel(Track)
    private trackModel: typeof Track
  ) {}

  async getAllTracks() {
    return this.trackModel.findAll();
  }
}
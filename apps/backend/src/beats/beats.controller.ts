import { Controller, Get } from '@nestjs/common';
import { BeatsService } from './beats.service';

@Controller('v1/beats')
export class BeatsController {
  constructor(private readonly beatsService: BeatsService) {}

  @Get()
  async getAllBeats() {
    return this.beatsService.getAllBeats();
  }
}
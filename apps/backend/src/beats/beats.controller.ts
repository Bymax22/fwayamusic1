import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Put,
  Param, 
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Query
} from '@nestjs/common';
import { BeatsService } from './beats.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@Controller('v1/beats')
export class BeatsController {
  constructor(private readonly beatsService: BeatsService) {}

  @Get()
  async getAllBeats(
    @Query('genre') genre?: string,
    @Query('bpm') bpm?: number,
    @Query('accessType') accessType?: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
  ) {
    return this.beatsService.getAllBeats({
      genre,
      bpm: bpm ? Number(bpm) : undefined,
      accessType: accessType as any,
      skip: Number(skip),
      take: Number(take),
    });
  }

  @Get('/search/:query')
  async searchBeats(
    @Param('query') query: string,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
  ) {
    return this.beatsService.searchBeats(query, Number(skip), Number(take));
  }

  @Get(':id')
  async getBeatById(@Param('id') id: number) {
    return this.beatsService.getBeatById(Number(id));
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'coverFile', maxCount: 1 }
  ]))
  async uploadBeat(
    @Request() req: any,
    @UploadedFiles() files: { file?: Express.Multer.File[], coverFile?: Express.Multer.File[] },
    @Body() beatData: any
  ) {
    if (!req.user || req.user.role !== 'PRODUCER') {
      throw new HttpException('Only producers can upload beats', HttpStatus.FORBIDDEN);
    }

    if (!files?.file?.[0]) {
      throw new HttpException('Audio file is required', HttpStatus.BAD_REQUEST);
    }

    return this.beatsService.createBeat(req.user.id, {
      title: beatData.title,
      description: beatData.description || '',
      genre: beatData.genre,
      bpm: beatData.bpm ? Number(beatData.bpm) : null,
      key: beatData.key || null,
      price: beatData.price ? Number(beatData.price) : null,
      accessType: beatData.accessType || 'FREE',
      audioFile: files.file[0],
      coverFile: files.coverFile?.[0],
    });
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'coverFile', maxCount: 1 }]))
  async updateBeat(
    @Request() req: any,
    @Param('id') id: number,
    @Body() updateData: any,
    @UploadedFiles() files?: { coverFile?: Express.Multer.File[] }
  ) {
    if (!req.user || req.user.role !== 'PRODUCER') {
      throw new HttpException('Only producers can update beats', HttpStatus.FORBIDDEN);
    }

    return this.beatsService.updateBeat(req.user.id, Number(id), updateData, files?.coverFile?.[0]);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  async deleteBeat(
    @Request() req: any,
    @Param('id') id: number
  ) {
    if (!req.user || req.user.role !== 'PRODUCER') {
      throw new HttpException('Only producers can delete beats', HttpStatus.FORBIDDEN);
    }

    return this.beatsService.deleteBeat(req.user.id, Number(id));
  }

  @Get(':id/analytics')
  @UseGuards(FirebaseAuthGuard)
  async getBeatAnalytics(
    @Request() req: any,
    @Param('id') id: number
  ) {
    if (!req.user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return this.beatsService.getBeatAnalytics(req.user.id, Number(id));
  }

  @Get(':id/detailed')
  async getBeatDetailed(@Param('id') id: number) {
    return this.beatsService.getBeatDetailed(Number(id));
  }

  @Put(':id/access-type')
  @UseGuards(FirebaseAuthGuard)
  async toggleAccessType(
    @Request() req: any,
    @Param('id') id: number,
    @Body() body: { accessType: 'FREE' | 'PREMIUM' | 'PAY_PER_VIEW' }
  ) {
    if (!req.user || req.user.role !== 'PRODUCER') {
      throw new HttpException('Only producers can update beats', HttpStatus.FORBIDDEN);
    }

    return this.beatsService.toggleAccessType(req.user.id, Number(id), body.accessType);
  }

  // Producer-specific endpoints
  @Get('producer/:producerId/beats')
  async getProducerBeats(
    @Param('producerId') producerId: number,
    @Query('skip') skip: number = 0,
    @Query('take') take: number = 20,
  ) {
    return this.beatsService.getProducerBeats(Number(producerId), Number(skip), Number(take));
  }

  @Get('producer/:producerId/stats')
  async getProducerStats(@Param('producerId') producerId: number) {
    return this.beatsService.getProducerStats(Number(producerId));
  }

  @Get('producer/:producerId/analytics')
  async getProducerAnalytics(
    @Param('producerId') producerId: number,
    @Query('days') days: number = 30
  ) {
    return this.beatsService.getProducerAnalytics(Number(producerId), Number(days));
  }

  @Get('producer/:producerId/top-beats')
  async getTopBeats(
    @Param('producerId') producerId: number,
    @Query('limit') limit: number = 10
  ) {
    return this.beatsService.getTopBeats(Number(producerId), Number(limit));
  }
}
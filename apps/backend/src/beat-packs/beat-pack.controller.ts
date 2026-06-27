import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Req, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BeatPackService } from './beat-pack.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('v1/beat-packs')
export class BeatPackController {
  constructor(private readonly beatPackService: BeatPackService) {}

  @UseGuards(FirebaseAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('cover'))
  async create(@Req() req: any, @Body() body: any, @UploadedFile() cover?: Express.Multer.File) {
    const userId = req.user?.uid || req.user?.id;
    return this.beatPackService.createBeatPack(userId, { ...body, coverFile: cover });
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('producer/me')
  async getProducerPacks(@Req() req: any, @Query('skip') skip = '0', @Query('take') take = '20') {
    const userId = req.user?.uid || req.user?.id;
    return this.beatPackService.getProducerBeatPacks(Number(userId), Number(skip), Number(take));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.beatPackService.getBeatPackAnalytics(null, Number(id));
  }

  @UseGuards(FirebaseAuthGuard)
  @Get(':id/analytics')
  async analytics(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.uid || req.user?.id;
    return this.beatPackService.getBeatPackAnalytics(Number(userId), Number(id));
  }

  @UseGuards(FirebaseAuthGuard)
  @Put(':id')
  @UseInterceptors(FileInterceptor('cover'))
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any, @UploadedFile() cover?: Express.Multer.File) {
    const userId = req.user?.uid || req.user?.id;
    return this.beatPackService.updateBeatPack(Number(userId), Number(id), body, cover);
  }

  @UseGuards(FirebaseAuthGuard)
  @Put(':id/access-type')
  async toggleAccess(@Req() req: any, @Param('id') id: string, @Body('accessType') accessType: 'FREE' | 'PREMIUM') {
    const userId = req.user?.uid || req.user?.id;
    return this.beatPackService.toggleAccessType(Number(userId), Number(id), accessType);
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.uid || req.user?.id;
    return this.beatPackService.deleteBeatPack(Number(userId), Number(id));
  }

  @UseGuards(FirebaseAuthGuard)
  @Post(':id/beats')
  async addBeats(@Req() req: any, @Param('id') id: string, @Body('beatIds') beatIds: number[]) {
    const userId = req.user?.uid || req.user?.id;
    // simple helper: add beats to pack
    return this.beatPackService.addBeatsToPack(Number(userId), Number(id), beatIds);
  }
}

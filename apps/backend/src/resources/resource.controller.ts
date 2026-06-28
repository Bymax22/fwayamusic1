import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Req, UploadedFiles, UseInterceptors, Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ResourceService } from './resource.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('v1/resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @UseGuards(FirebaseAuthGuard)
  @Post()
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnailFile', maxCount: 1 },
  ]))
  async create(@Req() req: any, @Body() body: any, @UploadedFiles() files?: { file?: Express.Multer.File[]; thumbnailFile?: Express.Multer.File[] }) {
    const userId = req.user?.uid || req.user?.id;
    const file = files?.file?.[0];
    const thumbnailFile = files?.thumbnailFile?.[0];
    return this.resourceService.createResource(userId, { ...body, file, thumbnailFile });
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('producer/me')
  async getProducerResources(@Req() req: any, @Query('type') type?: string, @Query('skip') skip = '0', @Query('take') take = '20') {
    const userId = req.user?.uid || req.user?.id;
    return this.resourceService.getProducerResources(Number(userId), Number(skip), Number(take), type);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get(':id/analytics')
  async analytics(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.uid || req.user?.id;
    return this.resourceService.getResourceAnalytics(Number(userId), Number(id));
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.resourceService.getAllResources({ skip: 0, take: 1 });
  }

  @UseGuards(FirebaseAuthGuard)
  @Put(':id')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnailFile', maxCount: 1 },
  ]))
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any, @UploadedFiles() files?: { file?: Express.Multer.File[]; thumbnailFile?: Express.Multer.File[] }) {
    const userId = req.user?.uid || req.user?.id;
    const file = files?.file?.[0];
    const thumbnailFile = files?.thumbnailFile?.[0];
    return this.resourceService.updateResource(Number(userId), Number(id), body, { file, thumbnail: thumbnailFile });
  }

  @UseGuards(FirebaseAuthGuard)
  @Put(':id/access-type')
  async toggleAccess(@Req() req: any, @Param('id') id: string, @Body('accessType') accessType: 'FREE' | 'PREMIUM') {
    const userId = req.user?.uid || req.user?.id;
    return this.resourceService.toggleAccessType(Number(userId), Number(id), accessType);
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.uid || req.user?.id;
    return this.resourceService.deleteResource(Number(userId), Number(id));
  }
}

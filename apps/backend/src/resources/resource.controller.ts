import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Req, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ResourceService } from './resource.service';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';

@Controller('v1/resources')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @UseGuards(FirebaseAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Req() req: any, @Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    const userId = req.user?.uid || req.user?.id;
    return this.resourceService.createResource(userId, { ...body, file });
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
  @UseInterceptors(FileInterceptor('file'))
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    const userId = req.user?.uid || req.user?.id;
    return this.resourceService.updateResource(Number(userId), Number(id), body, { file });
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

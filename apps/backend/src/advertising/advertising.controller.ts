import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdvertisingService } from './advertising.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('v1/advertising')
export class AdvertisingController {
  constructor(private readonly advertisingService: AdvertisingService) {}

  @Get('active')
  getActiveAds(@Query('placement') placement?: string) {
    return this.advertisingService.getActiveAds(placement);
  }

  @Post('events')
  recordEvent(@Body() body: { advertisementId?: number; eventType?: string }, @Req() req: any) {
    return this.advertisingService.recordEvent(Number(body.advertisementId), body.eventType || '', req.user?.id);
  }

  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Get('campaigns')
  listCampaigns() {
    return this.advertisingService.listCampaigns();
  }

  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Get('campaigns/:id/analytics')
  campaignAnalytics(@Param('id') id: string, @Query('days') days?: string) {
    return this.advertisingService.getCampaignAnalytics(Number(id), Math.min(90, Math.max(1, Number(days) || 30)));
  }

  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Post('campaigns')
  createCampaign(@Req() req: any, @Body() body: any) {
    return this.advertisingService.createCampaign(req.user.id, body);
  }

  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() body: any) {
    return this.advertisingService.updateCampaign(Number(id), body);
  }

  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Delete('campaigns/:id')
  deleteCampaign(@Param('id') id: string) {
    return this.advertisingService.deleteCampaign(Number(id));
  }

  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Post('campaigns/:id/ads')
  @UseInterceptors(FileInterceptor('file'))
  addAdvertisement(@Param('id') id: string, @Body() body: any, @UploadedFile() file?: Express.Multer.File) {
    return this.advertisingService.addAdvertisement(Number(id), body, file);
  }

  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Patch('ads/:id')
  updateAdvertisement(@Param('id') id: string, @Body() body: any) {
    return this.advertisingService.updateAdvertisement(Number(id), body);
  }

  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @Delete('ads/:id')
  deleteAdvertisement(@Param('id') id: string) {
    return this.advertisingService.deleteAdvertisement(Number(id));
  }
}

import { Controller, Post, Body, Get, Param, Headers, Res, Query } from '@nestjs/common';
import { DrmService } from './drm.service';
import { GenerateLicenseDto } from '../media/dto/download-media.dto';
import { Response } from 'express';

@Controller('drm')
export class DrmController {
  constructor(private readonly drmService: DrmService) {}

  @Post('license')
  async generateLicense(
    @Body() generateLicenseDto: GenerateLicenseDto,
    @Headers('user-id') userId: string,
  ) {
    return this.drmService.generateDeviceLicense(generateLicenseDto, parseInt(userId));
  }

  @Post('download/:mediaId')
  async createProtectedDownload(
    @Param('mediaId') mediaId: string,
    @Body() deviceInfo: any,
    @Headers('user-id') userId: string,
  ) {
    return this.drmService.createProtectedDownload(parseInt(mediaId), parseInt(userId), deviceInfo);
  }

  @Get('stream/:mediaId')
  async streamProtectedMedia(
    @Param('mediaId') mediaId: string,
    @Headers('user-id') userId: string,
    @Headers('device-id') deviceId: string,
    @Headers('license-key') licenseKey: string,
    @Query('range') range: string,
    @Res() res: Response,
  ) {
    const deviceInfo = { deviceId, licenseKey };
    const streamInfo = await this.drmService.streamProtectedMedia(
      parseInt(mediaId),
      parseInt(userId),
      deviceInfo,
      range,
    );

    res.set(streamInfo.headers);
    streamInfo.stream.pipe(res);
  }

  @Get('validate/:mediaId')
  async validateLicense(
    @Param('mediaId') mediaId: string,
    @Headers('device-id') deviceId: string,
    @Headers('license-key') licenseKey: string,
  ) {
    const isValid = await this.drmService.validateLicense(parseInt(mediaId), deviceId, licenseKey);
    return { valid: isValid };
  }
}
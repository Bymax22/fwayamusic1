import { Body, Controller, Get, Param, Post, Put, Request, UseGuards, ParseIntPipe } from '@nestjs/common';
import { KycService } from './kyc.service';
import { CreateKYCDto } from './dto/create-kyc.dto';
import { ReviewKYCDto } from './dto/review-kyc.dto';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  async submit(@Request() req: any, @Body() body: any) {
    const userId = req.user?.id ?? body.userId;
    return this.kycService.submitDocument(userId, body);
  }

  @Get('me')
  async myDocs(@Request() req: any) {
    const userId = req.user?.id;
    return this.kycService.getForUser(userId);
  }

  @Get('pending')
  async pending() {
    return this.kycService.getPending();
  }

  @Put(':id/review')
  async review(@Param('id', ParseIntPipe) id: number, @Request() req: any, @Body() body: ReviewKYCDto) {
    const reviewerId = req.user?.id ?? null;
    return this.kycService.reviewDocument(id, reviewerId, body);
  }
}

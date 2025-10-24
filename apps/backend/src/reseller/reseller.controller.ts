import { Controller, Post, Body, Get, Param, Headers } from '@nestjs/common';
import { ResellerService } from './reseller.service';
import { CreateResellerLinkDto } from './dto/create-reseller-link.dto';

@Controller('reseller')
export class ResellerController {
  constructor(private readonly resellerService: ResellerService) {}

  @Post('links')
  async createResellerLink(
    @Body() createResellerLinkDto: CreateResellerLinkDto,
    @Headers('user-id') userId: string,
  ) {
    return this.resellerService.createResellerLink(createResellerLinkDto, parseInt(userId));
  }

  @Get('links')
  async getResellerLinks(@Headers('user-id') userId: string) {
    return this.resellerService.getResellerLinks(parseInt(userId));
  }

  @Get('stats')
  async getResellerStats(@Headers('user-id') userId: string) {
    return this.resellerService.getResellerStats(parseInt(userId));
  }

  @Get('commissions')
  async getCommissions(@Headers('user-id') userId: string) {
    return this.resellerService.getResellerCommissions(parseInt(userId));
  }

  @Get('track-click/:code')
  async trackClick(@Param('code') code: string) {
    return this.resellerService.trackLinkClick(code);
  }
}
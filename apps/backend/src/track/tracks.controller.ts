import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TracksService } from './tracks.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MediaAccessType, DeletionReason } from '@prisma/client';

@ApiTags('Tracks')
@Controller('api/v1/tracks')
export class TracksController {
  constructor(private tracksService: TracksService) {}

  @Get('my-tracks')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getMyTracks(@Request() req: any) {
    return this.tracksService.getArtistTracks(req.user.id);
  }

  @Get(':id')
  async getTrack(@Param('id') id: string) {
    return this.tracksService.getTrackById(parseInt(id));
  }

  @Get(':id/stats')
  async getTrackStats(@Param('id') id: string, @Request() req: any) {
    return this.tracksService.getTrackStats(parseInt(id), req.user?.id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateTrack(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateTrackDto: any,
  ) {
    return this.tracksService.updateTrack(parseInt(id), req.user.id, updateTrackDto);
  }

  @Post(':id/rename')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async renameTrack(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { title: string },
  ) {
    return this.tracksService.renameTrack(parseInt(id), req.user.id, body.title);
  }

  @Patch(':id/cover')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateCover(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.tracksService.updateTrackCover(
      parseInt(id),
      req.user.id,
      body.artCoverUrl,
      body.cloudinaryPublicId,
    );
  }

  @Post(':id/make-free')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async makeTrackFree(@Param('id') id: string, @Request() req: any) {
    return this.tracksService.makeTrackFree(parseInt(id), req.user.id);
  }

  @Post(':id/make-premium')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async makeTrackPremium(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { price: number },
  ) {
    return this.tracksService.makeTrackPremium(parseInt(id), req.user.id, body.price);
  }

  @Post(':id/make-pay-per-view')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async makeTrackPayPerView(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { price: number },
  ) {
    return this.tracksService.makeTrackPayPerView(parseInt(id), req.user.id, body.price);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async publishTrack(@Param('id') id: string, @Request() req: any) {
    return this.tracksService.publishTrack(parseInt(id), req.user.id);
  }

  @Post(':id/archive')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async archiveTrack(@Param('id') id: string, @Request() req: any) {
    return this.tracksService.archiveTrack(parseInt(id), req.user.id);
  }

  @Post(':id/submit-review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async submitForReview(@Param('id') id: string, @Request() req: any) {
    return this.tracksService.submitTrackForReview(parseInt(id), req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async deleteTrack(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body?: { reason?: DeletionReason },
  ) {
    return this.tracksService.deleteTrack(
      parseInt(id),
      req.user.id,
      body?.reason || DeletionReason.USER_REQUEST,
    );
  }

  @Post('bulk-update')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async bulkUpdate(
    @Request() req: any,
    @Body() body: { trackIds: number[]; updateData: any },
  ) {
    return this.tracksService.bulkUpdateTracks(req.user.id, body.trackIds, body.updateData);
  }

  @Post(':id/reselling')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async setResellingStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { allowReselling: boolean },
  ) {
    return this.tracksService.setResellingStatus(parseInt(id), req.user.id, body.allowReselling);
  }
}

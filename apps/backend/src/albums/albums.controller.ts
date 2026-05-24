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
import { AlbumsService } from './albums.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Albums')
@Controller('api/v1/albums')
export class AlbumsController {
  constructor(private albumsService: AlbumsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async createAlbum(@Request() req: any, @Body() createAlbumDto: any) {
    return this.albumsService.createAlbum(req.user.id, createAlbumDto);
  }

  @Get('my-albums')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getMyAlbums(@Request() req: any) {
    return this.albumsService.getArtistAlbums(req.user.id);
  }

  @Get('artist/:artistId')
  async getArtistAlbums(@Param('artistId') artistId: string) {
    return this.albumsService.getArtistAlbums(parseInt(artistId));
  }

  @Get(':id')
  async getAlbum(@Param('id') id: string) {
    return this.albumsService.getAlbumById(parseInt(id));
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateAlbum(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateAlbumDto: any,
  ) {
    return this.albumsService.updateAlbum(parseInt(id), req.user.id, updateAlbumDto);
  }

  @Post(':id/publish')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async publishAlbum(@Param('id') id: string, @Request() req: any) {
    return this.albumsService.publishAlbum(parseInt(id), req.user.id);
  }

  @Post(':id/submit-review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async submitForReview(@Param('id') id: string, @Request() req: any) {
    return this.albumsService.submitAlbumForReview(parseInt(id), req.user.id);
  }

  @Post(':id/archive')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async archiveAlbum(@Param('id') id: string, @Request() req: any) {
    return this.albumsService.archiveAlbum(parseInt(id), req.user.id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async deleteAlbum(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body?: any,
  ) {
    return this.albumsService.deleteAlbum(
      parseInt(id),
      req.user.id,
      body?.reason || 'USER_REQUEST',
    );
  }

  @Patch(':id/cover')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async updateCover(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.albumsService.updateAlbumCover(
      parseInt(id),
      req.user.id,
      body.coverImageUrl,
      body.cloudinaryId,
    );
  }

  @Get(':id/stats')
  async getAlbumStats(@Param('id') id: string) {
    return this.albumsService.getAlbumStats(parseInt(id));
  }

  @Post(':id/tracks/:mediaId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async addTrack(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @Request() req: any,
  ) {
    return this.albumsService.addTrackToAlbum(parseInt(id), parseInt(mediaId), req.user.id);
  }

  @Delete(':id/tracks/:mediaId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async removeTrack(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
    @Request() req: any,
  ) {
    return this.albumsService.removeTrackFromAlbum(parseInt(id), parseInt(mediaId), req.user.id);
  }
}

import { Controller, Get, Post, Body, Param, Query, Delete, Patch, Req, UseGuards, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../db/prisma.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { PlaylistService } from './playlist.service';

@Controller('v1/playlist')
export class PlaylistController {
  private readonly logger = new Logger(PlaylistController.name);

  constructor(
    private readonly playlistService: PlaylistService,
    private readonly prisma: PrismaService,
  ) {}

  private async resolveAuthenticatedUserId(req: any): Promise<number | undefined> {
    const authHeader = req?.headers?.authorization;
    if (!authHeader?.startsWith('Bearer ')) return undefined;

    const token = authHeader.split('Bearer ')[1]?.trim();
    if (!token) return undefined;

    try {
      const decoded = await admin.auth().verifyIdToken(token);
      if (!decoded.email) return undefined;
      const user = await this.prisma.user.findUnique({ where: { email: decoded.email } });
      return user?.id;
    } catch (error) {
      this.logger.warn(`Failed to resolve playlist access user from bearer token: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }

  private sanitizeForJson(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value === 'bigint') {
      try {
        const asNumber = Number(value);
        return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
      } catch {
        return value.toString();
      }
    }
    if (Array.isArray(value)) return value.map((v) => this.sanitizeForJson(v));
    if (typeof value === 'object') {
      const out: any = {};
      for (const k of Object.keys(value)) {
        out[k] = this.sanitizeForJson(value[k]);
      }
      return out;
    }
    return value;
  }

  @Get()
  async getAll(@Req() req: any, @Query('type') type?: string) {
    try {
      const userId = await this.resolveAuthenticatedUserId(req);
      const playlists = type ? await this.playlistService.findByType(type, userId) : await this.playlistService.findAll(userId);
      return this.sanitizeForJson(playlists);
    } catch (error) {
      this.logger.error('Failed to fetch playlists', error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @UseGuards(FirebaseAuthGuard)
  @Post()
  async createPlaylist(
    @Req() req: any,
    @Body() body: { name: string; description?: string; isPublic?: boolean; coverUrl?: string; type?: string },
  ) {
    const user = req.user;
    return this.playlistService.createPlaylist(user.id, {
      name: body.name,
      description: body.description,
      isPublic: body.isPublic ?? false,
      coverUrl: body.coverUrl,
      type: body.type,
    });
  }

  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    try {
      const userId = await this.resolveAuthenticatedUserId(req);
      const playlist = await this.playlistService.findOne(Number(id), userId);
      return this.sanitizeForJson(playlist);
    } catch (error) {
      this.logger.error('Failed to fetch playlist', error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
      throw error;
    }
  }

  @Post(':id/media')
  async addMediaToPlaylist(
    @Param('id') playlistId: string,
    @Body() body: { mediaId: number; userId: number }
  ) {
    return this.playlistService.addMediaToPlaylist(Number(playlistId), body.mediaId, body.userId);
  }

  @Delete(':id/media/:mediaId')
  async removeMediaFromPlaylist(
    @Param('id') playlistId: string,
    @Param('mediaId') mediaId: string,
    @Body() body: { userId: number }
  ) {
    return this.playlistService.removeMediaFromPlaylist(Number(playlistId), Number(mediaId), body.userId);
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch(':id')
  async updatePlaylist(
    @Param('id') playlistId: string,
    @Req() req: any,
    @Body() body: { name?: string; description?: string; isPublic?: boolean; coverUrl?: string }
  ) {
    const user = req.user;
    return this.sanitizeForJson(
      await this.playlistService.updatePlaylist(Number(playlistId), user.id, body)
    );
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':id')
  async deletePlaylist(
    @Param('id') playlistId: string,
    @Req() req: any
  ) {
    const user = req.user;
    return this.sanitizeForJson(
      await this.playlistService.deletePlaylist(Number(playlistId), user.id)
    );
  }
}
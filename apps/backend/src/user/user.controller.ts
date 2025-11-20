import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.userService.findOne(Number(id));
  }

  // Authenticated routes for current user
  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const decoded = req.user;
    return this.userService.getProfileByEmail(decoded.email);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me/playlists')
  async myPlaylists(@Req() req: any) {
    const decoded = req.user;
    return this.userService.getPlaylistsForUserByEmail(decoded.email);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me/liked')
  async myLiked(@Req() req: any) {
    const decoded = req.user;
    return this.userService.getLikedMediaByEmail(decoded.email);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me/recent')
  async myRecent(@Req() req: any) {
    const decoded = req.user;
    return this.userService.getRecentPlaysByEmail(decoded.email);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me/downloads')
  async myDownloads(@Req() req: any) {
    const decoded = req.user;
    return this.userService.getDownloadsByEmail(decoded.email);
  }
}
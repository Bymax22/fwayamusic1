import { Controller, Get, Param, Req, UseGuards, Patch, Body, Post, UseInterceptors, UploadedFile, BadRequestException, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { Request } from 'express';

@Controller('v1/users')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for images

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

  // Update user profile
  @UseGuards(FirebaseAuthGuard)
  @Patch('me')
  async updateProfile(
    @Body() updateData: { displayName?: string; bio?: string; location?: string; website?: string; country?: string },
    @Req() req: any
  ) {
    try {
      const decoded = req.user;
      return await this.userService.updateProfileByEmail(decoded.email, updateData);
    } catch (error) {
      this.logger.error('Profile update failed:', error);
      throw error;
    }
  }

  // Upload avatar
  @UseGuards(FirebaseAuthGuard)
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: any
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (file.size > this.MAX_FILE_SIZE) {
        throw new BadRequestException(`File size exceeds limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      const decoded = req.user;
      this.logger.log(`Uploading avatar for user ${decoded.email}`);

      const uploadResult = await this.userService.uploadToCloudinary(file, 'avatar');
      const updated = await this.userService.updateAvatarByEmail(
        decoded.email,
        uploadResult.secure_url,
        uploadResult.public_id
      );

      return updated;
    } catch (error) {
      this.logger.error('Avatar upload failed:', error);
      throw error;
    }
  }

  // Upload cover image
  @UseGuards(FirebaseAuthGuard)
  @Post('me/cover')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCover(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: any
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (file.size > this.MAX_FILE_SIZE) {
        throw new BadRequestException(`File size exceeds limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      const decoded = req.user;
      this.logger.log(`Uploading cover for user ${decoded.email}`);

      const uploadResult = await this.userService.uploadToCloudinary(file, 'cover');
      const updated = await this.userService.updateCoverByEmail(
        decoded.email,
        uploadResult.secure_url,
        uploadResult.public_id
      );

      return updated;
    } catch (error) {
      this.logger.error('Cover upload failed:', error);
      throw error;
    }
  }
}
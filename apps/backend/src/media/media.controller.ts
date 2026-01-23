import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  UseGuards,
  Req,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
// TODO: Implement JwtAuthGuard for authentication
import { CurrentUser } from '../decorators/user.decorator';
import { Request } from 'express';

@Controller('v1/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // @UseGuards(JwtAuthGuard) // Uncomment when JwtAuthGuard is implemented
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 })], // 100MB for audio/video
      })
    ) file: Express.Multer.File,
    @Body() createMediaDto: CreateMediaDto,
    @CurrentUser() user: { sub: string }
  ) {
    const userId = parseInt(user.sub);
    return this.mediaService.createMedia(file, userId, createMediaDto);
  }

  // Public avatar upload for signup
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })], // 2MB for avatars
      })
    ) file: Express.Multer.File
  ) {
    // Upload to Cloudinary as avatar
    const uploadResult = await this.mediaService.uploadToCloudinary(file, 'avatar');
    return {
      avatarUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };
  }

  // NEW: Homepage sections endpoint (must come before generic @Get())
  @Get('homepage-sections')
  async getHomepageSections() {
    return this.mediaService.getHomepageSections();
  }

  @Get()
  async getAllMedia() {
    // Return all public media (for browse page, landing page, etc)
    return this.mediaService.getAllMedia();
  }

  @Get('user/me')
  async getUserOwnMedia(@CurrentUser() user: { sub: string }) {
    // Return only authenticated user's media (for artist dashboard)
    const userId = parseInt(user.sub);
    return this.mediaService.getUserMedia(userId);
  }

  @Get(':id')
  async getMediaById(@Param('id') id: string) {
    return this.mediaService.getMediaById(parseInt(id));
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    const userId = parseInt(user.sub);
    return this.mediaService.deleteMedia(parseInt(id), userId);
  }

  @Patch(':id')
  async updateMedia(
    @Param('id') id: string,
    @Body() updates: Partial<CreateMediaDto>,
    @CurrentUser() user: { sub: string }
  ) {
    const userId = parseInt(user.sub);
    return this.mediaService.updateMedia(parseInt(id), userId, updates);
  }
}
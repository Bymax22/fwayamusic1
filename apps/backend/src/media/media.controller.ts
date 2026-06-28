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
  BadRequestException,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { CurrentUser } from '../decorators/user.decorator';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { Request } from 'express';

@Controller('v1/media')
export class MediaController {
  private readonly logger = new Logger(MediaController.name);
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  constructor(private readonly mediaService: MediaService) {}

  @UseGuards(FirebaseAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body(new ValidationPipe({ transform: true, skipMissingProperties: true })) createMediaDto: CreateMediaDto,
    @CurrentUser() user: any
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (file.size > this.MAX_FILE_SIZE) {
        throw new BadRequestException(`File size exceeds limit of ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      if (!user || !user.id) {
        throw new BadRequestException('User authentication required');
      }

      const userId = user.id;
      this.logger.log(`Starting upload for user ${userId}, file: ${file.originalname}, size: ${file.size}`);
      
      const result = await this.mediaService.createMedia(file, userId, createMediaDto);
      
      this.logger.log(`Upload success for user ${userId}, media ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Upload error: ${error instanceof Error ? error.message : error}`, error);
      throw error;
    }
  }

  // Public avatar upload for signup
  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File | undefined
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    
    // Upload to Cloudinary as avatar
    const uploadResult = await this.mediaService.uploadToCloudinary(file, 'avatar');
    return {
      avatarUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id
    };
  }

  // NEW: Save metadata only (file already uploaded to Cloudinary client-side)
  @UseGuards(FirebaseAuthGuard)
  @Post('save-metadata')
  async saveMediaMetadata(
    @Body() metadata: { title: string; type: string; url: string; cloudinaryPublicId: string; duration: number; format: string; resourceType: string; description?: string; genre?: string; isExplicit?: boolean; isPremium?: boolean; coverUrl?: string; releaseType?: string },
    @CurrentUser() user: any
  ) {
    try {
      if (!metadata.title || !metadata.type || !metadata.url) {
        throw new BadRequestException('Missing required fields: title, type, url');
      }

      if (!user || !user.id) {
        throw new BadRequestException('User authentication required');
      }

      const userId = user.id;
      this.logger.log(`Saving metadata for user ${userId}, title: ${metadata.title}, url: ${metadata.url}, coverUrl: ${metadata.coverUrl || 'none'}`);
      
      const result = await this.mediaService.createMediaFromMetadata(userId, metadata);
      
      this.logger.log(`Metadata saved successfully for user ${userId}, media ID: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Error saving metadata: ${error instanceof Error ? error.message : error}`, error);
      throw error;
    }
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

  @UseGuards(FirebaseAuthGuard)
  @Get('user/me')
  async getUserOwnMedia(@CurrentUser() user: any) {
    // Return only authenticated user's media (for artist dashboard)
    if (!user || !user.id) {
      throw new BadRequestException('User authentication required');
    }
    const userId = user.id;
    return this.mediaService.getUserMedia(userId);
  }

  @Get(':id')
  async getMediaById(@Param('id') id: string) {
    return this.mediaService.getMediaById(parseInt(id));
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':id')
  async deleteMedia(@Param('id') id: string, @CurrentUser() user: any) {
    if (!user || !user.id) {
      throw new BadRequestException('User authentication required');
    }
    const userId = user.id;
    return this.mediaService.deleteMedia(parseInt(id), userId);
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch(':id')
  async updateMedia(
    @Param('id') id: string,
    @Body() updates: Partial<CreateMediaDto>,
    @CurrentUser() user: any
  ) {
    if (!user || !user.id) {
      throw new BadRequestException('User authentication required');
    }
    const userId = user.id;
    return this.mediaService.updateMedia(parseInt(id), userId, updates);
  }
}
import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
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
        validators: [new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 })], // 10MB
      })
    ) file: Express.Multer.File,
    @Body() createMediaDto: CreateMediaDto,
    @CurrentUser() user: { sub: string }
  ) {
    const userId = parseInt(user.sub);
    return this.mediaService.createMedia(file, userId, {
      title: createMediaDto.title,
      description: createMediaDto.description
    });
  }

  @Get()
  async getAllMedia() {
    return this.mediaService.getAllMedia();
  }

  // NEW: Homepage sections endpoint
  @Get('homepage-sections')
  async getHomepageSections() {
    return this.mediaService.getHomepageSections();
  }
}
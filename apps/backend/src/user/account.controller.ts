import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AccountDeletionService } from './account-deletion.service';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Account Settings')
@Controller('api/v1/account')
export class AccountController {
  constructor(
    private accountDeletionService: AccountDeletionService,
    private prisma: PrismaService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getCurrentUser(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        coverImageUrl: true,
        role: true,
        bio: true,
        website: true,
        country: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            media: true,
            albums: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    return user;
  }

  @Post('request-deletion')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async requestDeletion(@Request() req: any, @Body() body?: any) {
    return this.accountDeletionService.requestAccountDeletion(req.user.id, body || {});
  }

  @Post('cancel-deletion')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async cancelDeletion(@Request() req: any) {
    return this.accountDeletionService.cancelAccountDeletion(req.user.id);
  }

  @Get('deletion-status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async getDeletionStatus(@Request() req: any) {
    return this.accountDeletionService.getDeletionStatus(req.user.id);
  }

  @Get('data-export')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async exportData(@Request() req: any) {
    return this.accountDeletionService.exportUserData(req.user.id);
  }
}

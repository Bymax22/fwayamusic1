import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { FollowerService } from './follower.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { CurrentUser } from '../decorators/user.decorator';

@Controller('v1')
@UseGuards(FirebaseAuthGuard)
export class FollowerController {
  constructor(private readonly service: FollowerService) {}

  @Post('follow/:followingId')
  async follow(@Param('followingId') followingId: string, @CurrentUser() user: any) {
    return this.service.followUser(user.id, parseInt(followingId, 10));
  }

  @Delete('follow/:followingId')
  async unfollow(@Param('followingId') followingId: string, @CurrentUser() user: any) {
    return this.service.unfollowUser(user.id, parseInt(followingId, 10));
  }

  @Get('follow/status/:followingId')
  async followStatus(@Param('followingId') followingId: string, @CurrentUser() user: any) {
    return {
      isFollowing: await this.service.isFollowing(user.id, parseInt(followingId, 10)),
    };
  }

  @Get('followers/my-followers')
  async getMyFollowers(@CurrentUser() user: any) {
    return this.service.getFollowers(user.id);
  }

  @Get('followers/my-following')
  async getMyFollowing(@CurrentUser() user: any) {
    return this.service.getFollowing(user.id);
  }
}
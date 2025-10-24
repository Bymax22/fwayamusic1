import { Controller, Post, Body } from '@nestjs/common';
import { FollowerService } from './follower.service';

@Controller('v1/follow')
export class FollowerController {
  constructor(private readonly service: FollowerService) {}

  @Post()
  async follow(@Body('followerId') followerId: number, @Body('followingId') followingId: number) {
    return this.service.followUser(followerId, followingId);
  }
}
import { Controller, Get, Patch, Param, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('v1/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getMyNotifications(@Req() req: any) {
    return this.notificationService.getNotificationsForUser(req.user.id);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me/unread-count')
  async getUnreadCount(@Req() req: any) {
    return { unreadCount: await this.notificationService.getUnreadCount(req.user.id) };
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const notificationId = Number(id);
    if (Number.isNaN(notificationId)) {
      throw new BadRequestException('Notification ID must be a number');
    }
    return this.notificationService.markAsRead(req.user.id, notificationId);
  }
}

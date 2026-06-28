import { Injectable } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async createNotification(userId: number, title: string, message: string, type: NotificationType, metadata?: any) {
    return this.prisma.notification.create({
      data: {
        user: { connect: { id: userId } },
        title,
        message,
        type,
        data: metadata || {},
      },
    });
  }

  async createMany(notifications: Array<{ userId: number; title: string; message: string; type: NotificationType; metadata?: any }>) {
    if (!notifications || notifications.length === 0) {
      return [];
    }

    return this.prisma.notification.createMany({
      data: notifications.map((notification) => ({
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.metadata || {},
      })),
      skipDuplicates: true,
    });
  }

  async getNotificationsForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: number, notificationId: number) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}

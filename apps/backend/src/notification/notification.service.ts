import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../db/prisma.service';
import { NotificationType, UserRole } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);
  private scheduler?: NodeJS.Timeout;

  constructor(private prisma: PrismaService, private eventsGateway: EventsGateway) {}

  onModuleInit() {
    this.scheduler = setInterval(() => void this.processDueBroadcasts(), 30_000);
    void this.processDueBroadcasts();
  }

  async createNotification(userId: number, title: string, message: string, type: NotificationType, metadata?: any) {
    const notification = await this.prisma.notification.create({
      data: {
        user: { connect: { id: userId } },
        title,
        message,
        type,
        data: metadata || {},
      },
    });
    this.eventsGateway.emitUserNotification(userId, notification);
    return notification;
  }

  async createMany(notifications: Array<{ userId: number; title: string; message: string; type: NotificationType; metadata?: any; broadcastId?: number }>) {
    if (!notifications || notifications.length === 0) {
      return [];
    }

    const created = await this.prisma.notification.createManyAndReturn({
      data: notifications.map((notification) => ({
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.metadata || {},
        broadcastId: notification.broadcastId,
        deliveryStatus: 'DELIVERED',
        deliveredAt: new Date(),
      })),
      skipDuplicates: true,
    });
    for (const notification of created) {
      this.eventsGateway.emitUserNotification(notification.userId as number, notification);
    }
    return { count: created.length };
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
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount(userId: number) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async createBroadcast(input: { title: string; message: string; userIds?: number[]; roles?: UserRole[]; countries?: string[]; scheduledAt?: string | null; createdById: number }) {
    const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
    if (scheduledAt && Number.isNaN(scheduledAt.getTime())) throw new Error('Invalid scheduledAt');
    const audience = { userIds: input.userIds || [], roles: input.roles || [], countries: input.countries || [] };
    const broadcast = await this.prisma.notificationBroadcast.create({
      data: {
        title: input.title,
        message: input.message,
        type: NotificationType.SYSTEM,
        audience,
        scheduledAt,
        status: scheduledAt && scheduledAt > new Date() ? 'SCHEDULED' : 'PROCESSING',
        createdById: input.createdById,
      },
    });
    if (!scheduledAt || scheduledAt <= new Date()) await this.deliverBroadcast(broadcast.id);
    return this.prisma.notificationBroadcast.findUnique({ where: { id: broadcast.id }, include: { _count: { select: { notifications: true } } } });
  }

  async listBroadcasts() {
    return this.prisma.notificationBroadcast.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { _count: { select: { notifications: true } } } });
  }

  async processDueBroadcasts() {
    const due = await this.prisma.notificationBroadcast.findMany({ where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } }, select: { id: true }, take: 20 });
    for (const broadcast of due) {
      try { await this.deliverBroadcast(broadcast.id); } catch (error) { this.logger.error(`Broadcast ${broadcast.id} failed`, error instanceof Error ? error.message : String(error)); }
    }
  }

  private async deliverBroadcast(id: number) {
    const broadcast = await this.prisma.notificationBroadcast.findUnique({ where: { id } });
    if (!broadcast || ['SENT', 'PROCESSING'].includes(broadcast.status) && broadcast.sentAt) return;
    await this.prisma.notificationBroadcast.update({ where: { id }, data: { status: 'PROCESSING', retryCount: { increment: 1 } } });
    const audience = (broadcast.audience || {}) as { userIds?: number[]; roles?: UserRole[]; countries?: string[] };
    const where: any = {};
    if (audience.userIds?.length) where.id = { in: audience.userIds };
    if (audience.roles?.length) where.role = { in: audience.roles };
    if (audience.countries?.length) where.country = { in: audience.countries };
    const recipients = await this.prisma.user.findMany({ where, select: { id: true } });
    try {
      const result = await this.createMany(recipients.map(({ id: userId }) => ({ userId, title: broadcast.title, message: broadcast.message, type: broadcast.type, broadcastId: broadcast.id, metadata: { source: 'admin-broadcast', broadcastId: broadcast.id } })));
      const delivered = Array.isArray(result) ? result.length : result.count;
      await this.prisma.notificationBroadcast.update({ where: { id }, data: { status: 'SENT', sentAt: new Date(), totalRecipients: recipients.length, deliveredCount: delivered, failedCount: recipients.length - delivered } });
    } catch (error) {
      await this.prisma.notificationBroadcast.update({ where: { id }, data: { status: 'FAILED', failureReason: error instanceof Error ? error.message : String(error), failedCount: recipients.length } });
      throw error;
    }
    this.eventsGateway.emitAdminDashboardUpdated({ reason: 'notification-sent', resourceId: id });
    this.eventsGateway.emitSupportEvent('admin:notifications-updated', { broadcastId: id });
  }
}

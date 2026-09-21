import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { getAdminStats } from '../db/admin';
import { PrismaService } from '../db/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType, UserRole, UserStatus } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';

@Controller('v1/admin')
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  @Get('dashboard/stats')
  async getDashboardStats() {
    return getAdminStats();
  }

  @Get('analytics')
  async getAnalytics() {
    const activeSince = new Date(Date.now() - 15 * 60 * 1000);
    const daySince = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [activeUsers, activeUsers24h, usersByCountry, pendingApplications, signupsByRole] = await Promise.all([
      this.prisma.user.count({ where: { lastLoginAt: { gte: activeSince } } }),
      this.prisma.user.count({ where: { lastLoginAt: { gte: daySince } } }),
      this.prisma.user.groupBy({
        by: ['country'],
        where: { lastLoginAt: { gte: daySince } },
        _count: { _all: true },
        orderBy: { _count: { country: 'desc' } },
      }),
      this.prisma.user.count({
        where: {
          status: UserStatus.PENDING,
          role: { in: [UserRole.ARTIST, UserRole.PRODUCER, UserRole.RESELLER] },
        },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        where: { createdAt: { gte: daySince } },
        _count: { _all: true },
      }),
    ]);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const [dailySignups, dailyApprovals, engagement] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      this.prisma.auditLog.count({ where: { action: { in: ['APPLICATION_APPROVED', 'APPLICATION_REJECTED'] }, createdAt: { gte: today, lt: tomorrow } } }),
      this.prisma.media.aggregate({ _sum: { playCount: true, downloadCount: true, shareCount: true } }),
    ]);
    await this.prisma.adminAnalyticsSnapshot.upsert({
      where: { day: today },
      create: { day: today, activeUsers, activeUsers24h, pendingApplications, usersByCountry: usersByCountry.map((entry) => ({ country: entry.country || 'Unknown', count: entry._count._all })), usersByRole: signupsByRole.map((entry) => ({ role: entry.role, count: entry._count._all })), signups: dailySignups, approvals: dailyApprovals, plays: engagement._sum.playCount || 0, downloads: engagement._sum.downloadCount || 0, shares: engagement._sum.shareCount || 0 },
      update: { activeUsers, activeUsers24h, pendingApplications, usersByCountry: usersByCountry.map((entry) => ({ country: entry.country || 'Unknown', count: entry._count._all })), usersByRole: signupsByRole.map((entry) => ({ role: entry.role, count: entry._count._all })), signups: dailySignups, approvals: dailyApprovals, plays: engagement._sum.playCount || 0, downloads: engagement._sum.downloadCount || 0, shares: engagement._sum.shareCount || 0 },
    });
    const snapshots = await this.prisma.adminAnalyticsSnapshot.findMany({ where: { day: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, orderBy: { day: 'asc' } });
    return {
      activeUsers,
      activeUsers24h,
      pendingApplications,
      usersByCountry: usersByCountry.map((entry) => ({ country: entry.country || 'Unknown', count: entry._count._all })),
      signupsByRole: signupsByRole.map((entry) => ({ role: entry.role, count: entry._count._all })),
      engagement: { plays: engagement._sum.playCount || 0, downloads: engagement._sum.downloadCount || 0, shares: engagement._sum.shareCount || 0 },
      series: snapshots.map((snapshot) => ({ day: snapshot.day, activeUsers: snapshot.activeUsers, activeUsers24h: snapshot.activeUsers24h, signups: snapshot.signups, approvals: snapshot.approvals, plays: snapshot.plays, downloads: snapshot.downloads, shares: snapshot.shares })),
      generatedAt: new Date().toISOString(),
    };
  }

  @Get('applications')
  async getApplications() {
    return this.prisma.user.findMany({
      where: {
        status: UserStatus.PENDING,
        role: { in: [UserRole.ARTIST, UserRole.PRODUCER, UserRole.RESELLER] },
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        country: true,
        phoneNumber: true,
        artistName: true,
        producerName: true,
        businessName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Patch('applications/:id')
  async reviewApplication(@Param('id') id: string, @Body() body: { approved?: boolean; reason?: string }, @Req() request: any) {
    const userId = Number(id);
    const application = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!application || application.status !== UserStatus.PENDING || !([UserRole.ARTIST, UserRole.PRODUCER, UserRole.RESELLER] as UserRole[]).includes(application.role)) {
      throw new NotFoundException('Pending application not found');
    }

    const approved = body.approved === true;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: approved ? UserStatus.ACTIVE : UserStatus.REJECTED,
        ...(application.role === UserRole.ARTIST ? { isArtist: approved, verifiedArtist: approved } : {}),
        ...(application.role === UserRole.PRODUCER ? { isProducer: approved, verifiedProducer: approved } : {}),
        ...(application.role === UserRole.RESELLER ? { isReseller: approved } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: request.user.id,
        action: approved ? 'APPLICATION_APPROVED' : 'APPLICATION_REJECTED',
        resource: 'UserApplication',
        resourceId: userId,
        newValues: { status: updated.status, reason: body.reason || null },
      },
    });
    await this.notificationService.createNotification(
      userId,
      approved ? 'Application approved' : 'Application update',
      approved ? `Your ${application.role.toLowerCase()} application has been approved.` : `Your application was not approved${body.reason ? `: ${body.reason}` : '.'}`,
      NotificationType.SYSTEM,
      { applicationId: userId, approved },
    );
    this.eventsGateway.emitAdminDashboardUpdated({ reason: approved ? 'application-approved' : 'application-rejected', resourceId: userId });
    return updated;
  }

  @Post('notifications')
  async sendNotification(@Body() body: { title: string; message: string; userIds?: number[]; roles?: UserRole[]; countries?: string[]; scheduledAt?: string | null }, @Req() request: any) {
    return this.notificationService.createBroadcast({ ...body, createdById: request.user.id });
  }

  @Get('notifications')
  async notificationHistory() {
    return this.notificationService.listBroadcasts();
  }
}
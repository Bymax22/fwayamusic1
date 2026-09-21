import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../db/prisma.service';

@WebSocketGateway({ namespace: 'realtime', cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('EventsGateway');
  private readonly onlineAgents = new Map<number, { id: number; name: string; role: string }>();

  constructor(private readonly prisma: PrismaService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as number | undefined;
    if (userId) {
      this.onlineAgents.delete(userId);
      this.emitSupportPresence();
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('identify')
  async identify(client: Socket, @MessageBody() payload: { token?: string }) {
    if (!payload?.token) return { ok: false };
    try {
      const decoded = await admin.auth().verifyIdToken(payload.token);
      if (!decoded.email) return { ok: false };
      const user = await this.prisma.user.findUnique({ where: { email: decoded.email }, select: { id: true, displayName: true, username: true, role: true } });
      if (!user) return { ok: false };
      client.join(`user:${user.id}`);
      client.data.userId = user.id;
      client.data.role = user.role;
      if (['ADMIN', 'MODERATOR', 'CONTENT_MANAGER'].includes(user.role)) {
        client.join('support:agents');
        this.onlineAgents.set(user.id, { id: user.id, name: user.displayName || user.username, role: user.role });
        this.emitSupportPresence();
      }
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  emitUserNotification(userId: number, payload: any) {
    try {
      this.server.to(`user:${userId}`).emit('notification:new', payload);
    } catch (err) {
      this.logger.error('Failed to emit notification:new', err instanceof Error ? err.message : err);
    }
  }

  emitMediaLiked(payload: { mediaId: number; userId?: number; liked?: boolean; likes?: number }) {
    try {
      this.server.emit('media:liked', payload);
    } catch (err) {
      this.logger.error('Failed to emit media:liked', err instanceof Error ? err.message : err);
    }
  }

  emitMediaUploaded(payload: { mediaId: number; userId?: number; type?: string; albumId?: number | null; title?: string }) {
    try {
      this.server.emit('media:uploaded', payload);
    } catch (err) {
      this.logger.error('Failed to emit media:uploaded', err instanceof Error ? err.message : err);
    }
  }

  emitPlaylistUpdated(payload: { playlistId: number; userId?: number; action: 'add' | 'remove' | 'update' | 'delete'; entry?: any; playlist?: any }) {
    try {
      this.server.emit('playlist:updated', payload);
    } catch (err) {
      this.logger.error('Failed to emit playlist:updated', err instanceof Error ? err.message : err);
    }
  }

  emitAdminDashboardUpdated(payload: { reason: string; resourceId?: number }) {
    try {
      this.server.emit('admin:dashboard-updated', payload);
    } catch (err) {
      this.logger.error('Failed to emit admin:dashboard-updated', err instanceof Error ? err.message : err);
    }
  }

  emitSupportEvent(event: string, payload: any) {
    try {
      this.server.to('support:agents').emit(event, payload);
    } catch (err) {
      this.logger.error(`Failed to emit ${event}`, err instanceof Error ? err.message : err);
    }
  }

  emitSupportPresence() {
    this.emitSupportEvent('support:presence', Array.from(this.onlineAgents.values()));
  }
}

import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: 'realtime', cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
}

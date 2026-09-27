import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to notifications WS: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from notifications WS: ${client.id}`);
  }

  @SubscribeMessage('joinRole')
  handleJoinRole(client: Socket, role: string) {
    if (role) {
      const room = `role:${role}`;
      client.join(room);
      this.logger.log(`Client ${client.id} joined notification room: ${room}`);
      return { success: true, room };
    }
  }

  emitNotificationToRole(role: string, notification: any) {
    if (this.server) {
      this.server.to(`role:${role}`).emit('notification', notification);
      this.server.emit('global_event', notification); // Backup broadcast
    }
  }

  emitGlobalEvent(event: any) {
    if (this.server) {
      this.server.emit('global_event', event);
    }
  }
}

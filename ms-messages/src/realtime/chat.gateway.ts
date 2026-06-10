import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtValidationService } from '@/auth/services/jwt-validation.service';
import { ConnectionManagerService } from './services/connection-manager.service';
import { RealtimeEmitterService } from './services/realtime-emitter.service';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtValidationService: JwtValidationService,
    private readonly connectionManager: ConnectionManagerService,
    private readonly realtimeEmitter: RealtimeEmitterService,
  ) {
    this.realtimeEmitter.setGateway(this);
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      const user = await this.jwtValidationService.validateToken(token);
      client.data.userId = user.id;
      await client.join(this.userRoom(user.id));
      this.connectionManager.register(user.id, client);
      this.logger.debug(`User ${user.id} connected via socket ${client.id}`);
    } catch {
      this.logger.warn(`Rejected socket connection ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const userId = client.data.userId;
    if (userId) {
      this.connectionManager.unregister(userId, client.id);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(this.userRoom(userId)).emit(event, payload);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private extractToken(client: AuthenticatedSocket): string {
    const authToken = client.handshake.auth?.token as unknown;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.substring(7);
    }

    throw new Error('Missing token');
  }
}

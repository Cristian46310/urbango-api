import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtValidationService } from '@/auth/services/jwt-validation.service';
import { ConversationsService } from '@/conversations/conversations.service';
import { ConnectionManagerService } from './services/connection-manager.service';
import { RealtimeEmitterService } from './services/realtime-emitter.service';
import { ChatEvent } from './chat-events.enum';

interface AuthenticatedSocket extends Socket {
  data: {
    userId?: string;
  };
}

interface JoinConversationPayload {
  conversationId?: string;
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
    private readonly conversationsService: ConversationsService,
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

      const conversationIds =
        await this.conversationsService.getConversationIdsForUser(user.id);
      await this.joinSocketToConversations(client, conversationIds);

      this.logger.debug(
        `User ${user.id} connected (${conversationIds.length} conversations)`,
      );
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

  @SubscribeMessage(ChatEvent.CONVERSATION_JOIN)
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: JoinConversationPayload,
  ): Promise<{ conversationId: string }> {
    const userId = client.data.userId;
    const conversationId = payload?.conversationId;

    if (!userId) {
      throw new WsException('Unauthorized');
    }

    if (!conversationId) {
      throw new WsException('conversationId is required');
    }

    await this.conversationsService.assertMember(conversationId, userId);
    await client.join(this.conversationRoom(conversationId));

    return { conversationId };
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server.to(this.userRoom(userId)).emit(event, payload);
  }

  emitToConversation(
    conversationId: string,
    event: string,
    payload: unknown,
  ): void {
    this.server
      .to(this.conversationRoom(conversationId))
      .emit(event, payload);
  }

  async joinUserToConversations(
    userId: string,
    conversationIds: string[],
  ): Promise<void> {
    if (conversationIds.length === 0) {
      return;
    }

    const socketIds = this.connectionManager.getSocketIds(userId);
    for (const socketId of socketIds) {
      const socket = this.server.sockets.sockets.get(socketId);
      if (socket) {
        await this.joinSocketToConversations(socket, conversationIds);
      }
    }
  }

  private async joinSocketToConversations(
    socket: Socket,
    conversationIds: string[],
  ): Promise<void> {
    for (const conversationId of conversationIds) {
      await socket.join(this.conversationRoom(conversationId));
    }
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private conversationRoom(conversationId: string): string {
    return `conversation:${conversationId}`;
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

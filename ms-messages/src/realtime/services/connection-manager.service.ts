import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class ConnectionManagerService {
  private readonly userSockets = new Map<string, Set<string>>();

  register(userId: string, socket: Socket): void {
    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    sockets.add(socket.id);
    this.userSockets.set(userId, sockets);
  }

  unregister(userId: string, socketId: string): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) {
      return;
    }

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
    }
  }

  isOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }
}

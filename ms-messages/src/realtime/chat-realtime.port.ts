export interface ChatRealtimePort {
  emitToUser(userId: string, event: string, payload: unknown): void;
}

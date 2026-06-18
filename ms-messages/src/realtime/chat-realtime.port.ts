export interface ChatRealtimePort {
  emitToUser(userId: string, event: string, payload: unknown): void;
  emitToConversation(
    conversationId: string,
    event: string,
    payload: unknown,
  ): void;
  joinUserToConversations(
    userId: string,
    conversationIds: string[],
  ): Promise<void>;
  removeUserFromConversation(
    userId: string,
    conversationId: string,
  ): Promise<void>;
}

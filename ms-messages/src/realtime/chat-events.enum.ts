export enum ChatEvent {
  MESSAGE_NEW = 'message:new',
  MESSAGE_READ = 'message:read',
  GROUP_MEMBER_ADDED = 'group:member_added',
  GROUP_MEMBER_LEFT = 'group:member_left',
  GROUP_MEMBER_REMOVED = 'group:member_removed',
  GROUP_MEMBER_PROMOTED = 'group:member_promoted',
  MESSAGE_DELETED = 'message:deleted',
  ALERT_NEW = 'alert:new',
  ALERT_PUSH = 'alert:push',
  /** Cliente → servidor: unirse a room de una conversación abierta en UI */
  CONVERSATION_JOIN = 'conversation:join',
  /** Servidor → cliente: refetch historial/inbox vía REST tras connect/reconnect */
  SYNC_REQUIRED = 'sync:required',
  /** Servidor → cliente: error (p. ej. auth) antes de disconnect */
  ERROR = 'error',
}

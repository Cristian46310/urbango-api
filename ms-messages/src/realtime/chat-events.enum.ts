export enum ChatEvent {
  MESSAGE_NEW = 'message:new',
  MESSAGE_READ = 'message:read',
  GROUP_MEMBER_ADDED = 'group:member_added',
  GROUP_MEMBER_LEFT = 'group:member_left',
  MESSAGE_DELETED = 'message:deleted',
  ALERT_NEW = 'alert:new',
  ALERT_PUSH = 'alert:push',
  /** Cliente → servidor: unirse a room de una conversación abierta en UI */
  CONVERSATION_JOIN = 'conversation:join',
}

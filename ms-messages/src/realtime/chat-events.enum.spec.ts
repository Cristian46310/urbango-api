import { ChatEvent } from './chat-events.enum';

describe('ChatEvent', () => {
  it('exposes stable websocket event names', () => {
    expect(ChatEvent.MESSAGE_NEW).toBe('message:new');
    expect(ChatEvent.CONVERSATION_JOIN).toBe('conversation:join');
    expect(ChatEvent.SYNC_REQUIRED).toBe('sync:required');
    expect(ChatEvent.ERROR).toBe('error');
    expect(ChatEvent.ALERT_PUSH).toBe('alert:push');
  });
});

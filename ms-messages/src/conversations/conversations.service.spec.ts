import { ConversationsService } from './conversations.service';

describe('ConversationsService.buildDirectPairKey', () => {
  it('orders ids lexicographically', () => {
    expect(ConversationsService.buildDirectPairKey('b', 'a')).toBe('a:b');
    expect(ConversationsService.buildDirectPairKey('a', 'b')).toBe('a:b');
  });

  it('is stable for uuid-like strings', () => {
    const a = '11111111-1111-1111-1111-111111111111';
    const b = '22222222-2222-2222-2222-222222222222';
    expect(ConversationsService.buildDirectPairKey(a, b)).toBe(`${a}:${b}`);
    expect(ConversationsService.buildDirectPairKey(b, a)).toBe(`${a}:${b}`);
  });
});

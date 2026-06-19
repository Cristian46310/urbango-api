import {
  buildBusRoom,
  buildFleetRoom,
  getActiveRooms,
  parseBusRoom,
  parseFleetRoom,
} from './dashboard-realtime-room.util';

describe('dashboard-realtime-room.util', () => {
  it('builds and parses fleet rooms with stopId', () => {
    const room = buildFleetRoom(undefined, 'route-1', 'stop-2');
    expect(room).toBe('fleet:all:route-1:stop-2');
    expect(parseFleetRoom(room)).toEqual({
      enterpriseId: undefined,
      routeId: 'route-1',
      stopId: 'stop-2',
    });
  });

  it('builds and parses bus rooms', () => {
    const room = buildBusRoom('bus-1', 'stop-3');
    expect(parseBusRoom(room)).toEqual({
      busId: 'bus-1',
      stopId: 'stop-3',
    });
  });

  it('returns only active rooms for a prefix', () => {
    const rooms = new Map<string, unknown>([
      ['fleet:all:route-1:all', new Set(['socket-1'])],
      ['bus:bus-1:all', new Set(['socket-2'])],
      ['socket-2', new Set(['socket-2'])],
    ]);

    expect(getActiveRooms(rooms, 'fleet:')).toEqual(['fleet:all:route-1:all']);
    expect(getActiveRooms(rooms, 'bus:')).toEqual(['bus:bus-1:all']);
  });
});

export type FleetSubscribePayload = {
  enterpriseId?: string;
  routeId?: string;
  stopId?: string;
};

export type BusSubscribePayload = {
  busId: string;
  stopId?: string;
};

export function buildFleetRoom(
  enterpriseId?: string,
  routeId?: string,
  stopId?: string,
): string {
  return `fleet:${enterpriseId ?? 'all'}:${routeId ?? 'all'}:${stopId ?? 'all'}`;
}

export function buildBusRoom(busId: string, stopId?: string): string {
  return `bus:${busId}:${stopId ?? 'all'}`;
}

export function buildDashboardRoom(enterpriseId?: string): string {
  return `dashboard:${enterpriseId ?? 'all'}`;
}

export function buildNotificationRoom(email: string): string {
  return `notification:${email.toLowerCase()}`;
}

export function parseFleetRoom(room: string): FleetSubscribePayload {
  const [, enterpriseId, routeId, stopId] = room.split(':');
  return {
    enterpriseId: enterpriseId === 'all' ? undefined : enterpriseId,
    routeId: routeId === 'all' ? undefined : routeId,
    stopId: stopId === 'all' ? undefined : stopId,
  };
}

export function parseBusRoom(room: string): BusSubscribePayload {
  const [, busId, stopId] = room.split(':');
  return {
    busId,
    stopId: stopId === 'all' ? undefined : stopId,
  };
}

export function parseDashboardRoom(room: string): { enterpriseId?: string } {
  const [, enterpriseId] = room.split(':');
  return {
    enterpriseId: enterpriseId === 'all' ? undefined : enterpriseId,
  };
}

export function getActiveRooms(
  rooms: Map<string, unknown>,
  prefix: string,
): string[] {
  return [...rooms.keys()].filter((room) => room.startsWith(prefix));
}

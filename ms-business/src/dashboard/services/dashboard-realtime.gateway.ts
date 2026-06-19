import { Logger, OnModuleDestroy } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DashboardRealtimeService } from './dashboard-realtime.service';
import {
  buildBusRoom,
  buildDashboardRoom,
  buildFleetRoom,
  buildNotificationRoom,
  parseBusRoom,
  parseDashboardRoom,
  parseFleetRoom,
  type BusSubscribePayload,
  type FleetSubscribePayload,
} from './dashboard-realtime-room.util';

@WebSocketGateway({
  namespace: '/dashboard/realtime',
  // Engine path distinto de las rutas REST (/dashboard/realtime/fleet, ...).
  path: '/dashboard/realtime/ws',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class DashboardRealtimeGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  private readonly logger = new Logger(DashboardRealtimeGateway.name);
  private fleetInterval?: NodeJS.Timeout;
  private busInterval?: NodeJS.Timeout;
  private dashboardInterval?: NodeJS.Timeout;
  private notificationInterval?: NodeJS.Timeout;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly dashboardRealtimeService: DashboardRealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.server = server;

    this.fleetInterval = setInterval(() => {
      void this.broadcastFleetSnapshots();
    }, 10_000);

    this.busInterval = setInterval(() => {
      void this.broadcastBusSnapshots();
    }, 10_000);

    this.dashboardInterval = setInterval(() => {
      void this.broadcastDashboardSnapshots();
    }, 30_000);

    this.notificationInterval = setInterval(() => {
      void this.dispatchArrivalNotifications();
    }, 15_000);
  }

  handleConnection(client: Socket): void {
    this.logger.debug(`Client connected: ${client.id}`);
    void this.registerDefaultSubscriptions(client);
  }

  private extractEnterpriseId(client: Socket): string | undefined {
    const raw = client.handshake.query.enterpriseId;
    return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
  }

  private async registerDefaultSubscriptions(client: Socket): Promise<void> {
    const enterpriseId = this.extractEnterpriseId(client);
    const dashboardRoom = this.buildDashboardRoom(enterpriseId);
    const fleetRoom = this.buildFleetRoom(enterpriseId, undefined, undefined);

    await client.join(dashboardRoom);
    await client.join(fleetRoom);

    try {
      await this.emitDashboardSnapshot(dashboardRoom, enterpriseId);
      const fleet =
        await this.dashboardRealtimeService.getRealtimeFleet(enterpriseId);
      client.emit('dashboard:realtime:fleet', fleet);
    } catch (error) {
      this.logger.warn(
        `Failed to push initial realtime snapshot to ${client.id}: ${String(error)}`,
      );
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  onModuleDestroy(): void {
    if (this.fleetInterval) {
      clearInterval(this.fleetInterval);
    }
    if (this.busInterval) {
      clearInterval(this.busInterval);
    }
    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
    }
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
    }
  }

  @SubscribeMessage('dashboard:subscribe-fleet')
  async subscribeFleet(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: FleetSubscribePayload,
  ) {
    const room = this.buildFleetRoom(
      payload.enterpriseId,
      payload.routeId,
      payload.stopId,
    );
    await client.join(room);
    const fleet = await this.dashboardRealtimeService.getRealtimeFleet(
      payload.enterpriseId,
      payload.routeId,
      payload.stopId,
    );
    client.emit('dashboard:realtime:fleet', fleet);
    return { subscribed: true, room };
  }

  @SubscribeMessage('dashboard:subscribe-bus')
  async subscribeBus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: BusSubscribePayload,
  ) {
    const room = this.buildBusRoom(payload.busId, payload.stopId);
    await client.join(room);
    const bus = await this.dashboardRealtimeService.getBusRealtimeStatus(
      payload.busId,
      payload.stopId,
    );
    client.emit('dashboard:realtime:bus', bus);
    return { subscribed: true, room };
  }

  @SubscribeMessage('dashboard:subscribe-dashboard')
  async subscribeDashboard(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { enterpriseId?: string },
  ) {
    const room = this.buildDashboardRoom(payload.enterpriseId);
    await client.join(room);
    await this.emitDashboardSnapshot(room, payload.enterpriseId);
    return { subscribed: true, room };
  }

  @SubscribeMessage('dashboard:subscribe-notifications')
  async subscribeNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { email?: string },
  ) {
    if (!payload?.email) {
      return { subscribed: false, error: 'email is required' };
    }
    const room = this.buildNotificationRoom(payload.email);
    await client.join(room);
    return { subscribed: true, room };
  }

  private buildFleetRoom(
    enterpriseId?: string,
    routeId?: string,
    stopId?: string,
  ): string {
    return buildFleetRoom(enterpriseId, routeId, stopId);
  }

  private buildBusRoom(busId: string, stopId?: string): string {
    return buildBusRoom(busId, stopId);
  }

  private buildDashboardRoom(enterpriseId?: string): string {
    return buildDashboardRoom(enterpriseId);
  }

  private buildNotificationRoom(email: string): string {
    return buildNotificationRoom(email);
  }

  private async getActiveRooms(prefix: string): Promise<string[]> {
    const sockets = await this.server.fetchSockets();
    const rooms = new Set<string>();

    for (const socket of sockets) {
      for (const room of socket.rooms) {
        if (room.startsWith(prefix) && room !== socket.id) {
          rooms.add(room);
        }
      }
    }

    return [...rooms];
  }

  private parseFleetRoom(room: string): FleetSubscribePayload {
    return parseFleetRoom(room);
  }

  private parseBusRoom(room: string): BusSubscribePayload {
    return parseBusRoom(room);
  }

  private parseDashboardRoom(room: string): { enterpriseId?: string } {
    return parseDashboardRoom(room);
  }

  private async broadcastFleetSnapshots(): Promise<void> {
    const rooms = await this.getActiveRooms('fleet:');
    if (!rooms.length) {
      return;
    }

    for (const room of rooms) {
      const filters = this.parseFleetRoom(room);
      const allItems =
        await this.dashboardRealtimeService.getAllRealtimeFleetItems(
          filters.enterpriseId,
          filters.stopId,
        );
      const filtered = this.dashboardRealtimeService.filterFleetItems(
        allItems,
        {
          enterpriseId: filters.enterpriseId,
          routeId: filters.routeId,
        },
      );

      let items = filtered;
      if (filters.stopId) {
        items = await Promise.all(
          filtered.map(async (bus) => {
            const detailed =
              await this.dashboardRealtimeService.getBusRealtimeStatus(
                bus.busId,
                filters.stopId,
              );
            return detailed;
          }),
        );
      }

      this.server.to(room).emit('dashboard:realtime:fleet', { items });
    }
  }

  private async broadcastBusSnapshots(): Promise<void> {
    const rooms = await this.getActiveRooms('bus:');
    for (const room of rooms) {
      const { busId, stopId } = this.parseBusRoom(room);
      if (!busId) {
        continue;
      }
      const bus = await this.dashboardRealtimeService.getBusRealtimeStatus(
        busId,
        stopId,
      );
      this.server.to(room).emit('dashboard:realtime:bus', bus);
    }
  }

  private async broadcastDashboardSnapshots(): Promise<void> {
    const rooms = await this.getActiveRooms('dashboard:');
    for (const room of rooms) {
      const { enterpriseId } = this.parseDashboardRoom(room);
      await this.emitDashboardSnapshot(room, enterpriseId);
    }
  }

  private async emitDashboardSnapshot(
    room: string,
    enterpriseId?: string,
  ): Promise<void> {
    const summary =
      await this.dashboardRealtimeService.getDashboardSummary(enterpriseId);
    this.server.to(room).emit('dashboard:realtime:summary', summary);
  }

  private async dispatchArrivalNotifications(): Promise<void> {
    const dispatches =
      await this.dashboardRealtimeService.processPendingArrivalSubscriptions();

    for (const dispatch of dispatches) {
      if (!dispatch.sent || !dispatch.status) {
        continue;
      }

      this.server
        .to(this.buildNotificationRoom(dispatch.subscription.email))
        .emit('dashboard:realtime:arrival-notification', {
          email: dispatch.subscription.email,
          busId: dispatch.status.busId,
          routeName: dispatch.status.route?.name,
          plate: dispatch.status.plate,
          etaMinutes: dispatch.etaMinutes,
          stopName: dispatch.stopName,
          status: dispatch.status,
          trackingPath: `/dashboard/realtime/bus/${dispatch.status.busId}`,
          paymentActionPath: '/payment-method-citizen',
        });
    }
  }
}

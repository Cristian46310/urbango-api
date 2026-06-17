import { Logger } from '@nestjs/common';
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

@WebSocketGateway({
  namespace: '/dashboard/realtime',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class DashboardRealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DashboardRealtimeGateway.name);
  private fleetInterval?: NodeJS.Timeout;
  private dashboardInterval?: NodeJS.Timeout;
  private notificationInterval?: NodeJS.Timeout;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly dashboardRealtimeService: DashboardRealtimeService,
  ) {}

  afterInit(server: Server): void {
    this.server = server;
    void this.broadcastFleetSnapshots();
    void this.broadcastDashboardSnapshots();
    void this.dispatchArrivalNotifications();

    this.fleetInterval = setInterval(() => {
      void this.broadcastFleetSnapshots();
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
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  onModuleDestroy(): void {
    if (this.fleetInterval) {
      clearInterval(this.fleetInterval);
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
    @MessageBody() payload: { enterpriseId?: string; routeId?: string },
  ) {
    const room = this.buildFleetRoom(payload.enterpriseId, payload.routeId);
    client.join(room);
    const fleet = await this.dashboardRealtimeService.getRealtimeFleet(
      payload.enterpriseId,
      payload.routeId,
    );
    client.emit('dashboard:realtime:fleet', fleet);
    return { subscribed: true, room };
  }

  @SubscribeMessage('dashboard:subscribe-bus')
  async subscribeBus(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { busId: string },
  ) {
    const room = this.buildBusRoom(payload.busId);
    client.join(room);
    const bus = await this.dashboardRealtimeService.getBusRealtimeStatus(
      payload.busId,
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
    client.join(room);
    await this.emitDashboardSnapshot(room, payload.enterpriseId);
    return { subscribed: true, room };
  }

  @SubscribeMessage('dashboard:subscribe-notifications')
  async subscribeNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { email: string },
  ) {
    const room = this.buildNotificationRoom(payload.email);
    client.join(room);
    return { subscribed: true, room };
  }

  private buildFleetRoom(enterpriseId?: string, routeId?: string): string {
    return `fleet:${enterpriseId ?? 'all'}:${routeId ?? 'all'}`;
  }

  private buildBusRoom(busId: string): string {
    return `bus:${busId}`;
  }

  private buildDashboardRoom(enterpriseId?: string): string {
    return `dashboard:${enterpriseId ?? 'all'}`;
  }

  private buildNotificationRoom(email: string): string {
    return `notification:${email.toLowerCase()}`;
  }

  private async broadcastFleetSnapshots(): Promise<void> {
    const fleet = await this.dashboardRealtimeService.getRealtimeFleet();
    this.server.emit('dashboard:realtime:fleet', fleet);
  }

  private async broadcastDashboardSnapshots(): Promise<void> {
    const [fleet, incidents] = await Promise.all([
      this.dashboardRealtimeService.getRealtimeFleet(),
      this.dashboardRealtimeService.getActiveIncidents(),
    ]);

    this.server.emit('dashboard:realtime:summary', {
      fleet,
      incidents,
      updatedAt: new Date(),
    });
  }

  private async emitDashboardSnapshot(
    room: string,
    enterpriseId?: string,
  ): Promise<void> {
    const [fleet, incidents] = await Promise.all([
      this.dashboardRealtimeService.getRealtimeFleet(enterpriseId),
      this.dashboardRealtimeService.getActiveIncidents(enterpriseId),
    ]);

    this.server.to(room).emit('dashboard:realtime:summary', {
      fleet,
      incidents,
      updatedAt: new Date(),
    });
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
          nextStopName: dispatch.nextStopName,
          status: dispatch.status,
        });
    }
  }
}
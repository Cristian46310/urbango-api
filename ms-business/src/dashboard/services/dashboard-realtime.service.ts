import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BusService } from '@/bus/bus.service';
import { TicketService } from '@/ticket/ticket.service';
import { IncidentService } from '@/incident/incident.service';
import { StopService } from '@/stop/stop.service';
import { MsNotificationsClient } from '@/notifications/infrastructure/clients/ms-notifications.client';
import { ResponseRealtimeBusDto } from '../dto/response-realtime-bus.dto';
import { ResponseRealtimeBusListDto } from '../dto/response-realtime-bus-list.dto';
import { ResponseRealtimeSummaryDto } from '../dto/response-realtime-summary.dto';
import { RealtimeStopInfoDto } from '../dto/realtime-stop-info.dto';
import { RealtimeBusRouteDto } from '../dto/realtime-bus-route.dto';
import { CreateArrivalNotificationDto } from '../dto/create-arrival-notification.dto';
import {
  Scheduler,
  SchedulerStatus,
} from '@/scheduler/entities/scheduler.entity';
import { Turn, TurnStatus } from '@/turn/entities/turn.entity';
import { NotificationSubscription } from '../entities/notification-subscription.entity';
import { ResponseIncidentDto } from '@/incident/dto/response-incident.dto';

export type ArrivalNotificationDispatchResult = {
  subscription: NotificationSubscription;
  sent: boolean;
  scheduled: boolean;
  etaMinutes?: number;
  stopName?: string;
  status?: ResponseRealtimeBusDto;
};

export type FleetFilterOptions = {
  enterpriseId?: string;
  routeId?: string;
  stopId?: string;
};

@Injectable()
export class DashboardRealtimeService {
  constructor(
    @InjectRepository(NotificationSubscription)
    private readonly notificationSubscriptionRepository: Repository<NotificationSubscription>,
    private readonly busService: BusService,
    private readonly ticketService: TicketService,
    private readonly incidentService: IncidentService,
    private readonly stopService: StopService,
    private readonly notificationService: MsNotificationsClient,
  ) {}

  async getRealtimeFleet(
    enterpriseId?: string,
    routeId?: string,
    stopId?: string,
  ): Promise<ResponseRealtimeBusListDto> {
    const items = await this.getAllRealtimeFleetItems(enterpriseId, stopId);
    const filtered = this.filterFleetItems(items, { enterpriseId, routeId });

    return plainToInstance(ResponseRealtimeBusListDto, {
      items: filtered,
    });
  }

  async getAllRealtimeFleetItems(
    enterpriseId?: string,
    waitingStopId?: string,
  ): Promise<ResponseRealtimeBusDto[]> {
    const buses =
      await this.busService.findAllWithGpsAndSchedules(enterpriseId);

    const eligible = buses.filter((bus) =>
      this.isEligibleForRealtimeFleet(bus),
    );
    const busIds = eligible.map((bus) => bus.id);
    const [passengerCounts, incidentCounts] = await Promise.all([
      this.ticketService.countActiveTicketsByBusIds(busIds),
      this.incidentService.countActiveIncidentsByBusIds(busIds),
    ]);

    return Promise.all(
      eligible.map(async (bus) =>
        this.buildRealtimeBus(bus, waitingStopId, {
          activePassengers: passengerCounts.get(bus.id) ?? 0,
          activeIncidents: incidentCounts.get(bus.id) ?? 0,
        }),
      ),
    );
  }

  filterFleetItems(
    items: ResponseRealtimeBusDto[],
    filters: FleetFilterOptions,
  ): ResponseRealtimeBusDto[] {
    if (filters.routeId) {
      return items.filter((bus) => bus.route?.id === filters.routeId);
    }
    return items;
  }

  async getBusRealtimeStatus(
    busId: string,
    waitingStopId?: string,
  ): Promise<ResponseRealtimeBusDto> {
    const bus = await this.busService.findOneWithGpsAndSchedules(busId);
    return this.buildRealtimeBus(bus, waitingStopId);
  }

  async getDashboardSummary(
    enterpriseId?: string,
  ): Promise<ResponseRealtimeSummaryDto> {
    const fleet = await this.getRealtimeFleet(enterpriseId);
    const incidents = await this.getActiveIncidents(enterpriseId);
    const items = fleet.items;

    return plainToInstance(ResponseRealtimeSummaryDto, {
      fleet,
      incidents,
      updatedAt: new Date(),
      totalPassengersInTransit: items.reduce(
        (sum, bus) => sum + bus.activePassengers,
        0,
      ),
      fullBusAlerts: items.filter((bus) => bus.isFull),
    });
  }

  async sendArrivalNotification(
    payload: CreateArrivalNotificationDto & { email: string },
  ): Promise<{
    subscribed: boolean;
    sent: boolean;
    scheduled: boolean;
    etaMinutes?: number;
    stopName?: string;
  }> {
    const subscription = await this.createArrivalSubscription(payload);
    const result = await this.dispatchArrivalSubscription(subscription);

    return {
      subscribed: true,
      sent: result.sent,
      scheduled: result.scheduled,
      etaMinutes: result.etaMinutes,
      stopName: result.stopName,
    };
  }

  async createArrivalSubscription(
    payload: CreateArrivalNotificationDto & { email: string },
  ): Promise<NotificationSubscription> {
    const subscription = this.notificationSubscriptionRepository.create({
      email: payload.email,
      routeId: payload.routeId,
      busId: payload.busId,
      stopId: payload.stopId,
      anticipationMinutes: payload.anticipationMinutes ?? 10,
      message: payload.message,
    });

    return this.notificationSubscriptionRepository.save(subscription);
  }

  async getPendingArrivalSubscriptions(): Promise<NotificationSubscription[]> {
    return this.notificationSubscriptionRepository.find({
      where: { notifiedAt: IsNull() },
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  async dispatchArrivalSubscription(
    subscription: NotificationSubscription,
  ): Promise<ArrivalNotificationDispatchResult> {
    const status = await this.findTargetBusStatus({
      routeId: subscription.routeId ?? undefined,
      busId: subscription.busId ?? undefined,
      stopId: subscription.stopId ?? undefined,
      anticipationMinutes: subscription.anticipationMinutes,
      message: subscription.message,
    });

    if (!status) {
      return {
        subscription,
        sent: false,
        scheduled: true,
      };
    }

    const etaMinutes = this.getEtaForStop(
      status,
      subscription.stopId ?? undefined,
    );
    const stopName = this.getStopNameForSubscription(
      status,
      subscription.stopId ?? undefined,
    );
    const shouldSendNow =
      etaMinutes !== undefined &&
      etaMinutes <= subscription.anticipationMinutes;

    if (!shouldSendNow) {
      return {
        subscription,
        sent: false,
        scheduled: true,
        etaMinutes,
        stopName,
        status,
      };
    }

    const sent = await this.sendArrivalEmail(
      status,
      subscription,
      etaMinutes,
      stopName,
    );
    if (sent) {
      await this.markArrivalSubscriptionAsNotified(subscription.id);
    }

    return {
      subscription,
      sent,
      scheduled: !sent,
      etaMinutes,
      stopName,
      status,
    };
  }

  async processPendingArrivalSubscriptions(): Promise<
    ArrivalNotificationDispatchResult[]
  > {
    const subscriptions = await this.getPendingArrivalSubscriptions();
    const results: ArrivalNotificationDispatchResult[] = [];

    for (const subscription of subscriptions) {
      results.push(await this.dispatchArrivalSubscription(subscription));
    }

    return results;
  }

  private async buildRealtimeBus(
    bus: any,
    waitingStopId?: string,
    preloadedCounts?: { activePassengers: number; activeIncidents: number },
  ): Promise<ResponseRealtimeBusDto> {
    const coordinates = this.resolveBusCoordinates(bus);
    if (!coordinates) {
      throw new NotFoundException(`GPS no encontrado para el bus ${bus.id}`);
    }

    const routeScheduler = this.resolveRouteScheduler(
      bus.schedulers ?? [],
      this.hasActiveTurn(bus.turns ?? []),
    );
    const route = routeScheduler?.route;
    const routeStops = route?.nodes ?? [];
    const sortedNodes = routeStops
      .slice()
      .sort((left: any, right: any) => left.order - right.order);
    const routeDto = route
      ? plainToInstance(RealtimeBusRouteDto, {
          id: route.id,
          name: route.name,
          stops: sortedNodes.map((node: any) => this.toStopInfo(node.stop)),
        })
      : undefined;

    const nearestStop =
      this.findNearestStop(
        coordinates.latitude,
        coordinates.longitude,
        routeDto?.stops ?? [],
      ) ??
      (await this.findNearestPublicStop(
        coordinates.latitude,
        coordinates.longitude,
      ));

    const nextStop = nearestStop
      ? this.findNextStop(nearestStop.id, routeDto?.stops ?? [])
      : undefined;

    const estimatedMinutesToNextStop = this.calculateEstimatedMinutes(
      route,
      nearestStop,
      nextStop,
    );

    const estimatedMinutesToWaitingStop = waitingStopId
      ? this.calculateEstimatedMinutesToStop(route, nearestStop, waitingStopId)
      : undefined;

    const activePassengers =
      preloadedCounts?.activePassengers ??
      (await this.ticketService.countActiveTicketsByBus(bus.id));
    const activeIncidents =
      preloadedCounts?.activeIncidents ??
      (await this.incidentService.countActiveIncidentsByBus(bus.id));
    const capacity = (bus.seatedCapacity ?? 0) + (bus.standingCapacity ?? 0);
    const occupancyPercent =
      capacity > 0
        ? Math.min(100, Math.round((activePassengers / capacity) * 100))
        : undefined;
    const isFull = capacity > 0 ? activePassengers >= capacity : false;
    const delayAlert =
      activeIncidents > 0 ||
      (estimatedMinutesToNextStop !== undefined &&
        estimatedMinutesToNextStop > 15);
    const statusColor = activeIncidents > 0 ? 'red' : 'green';

    return plainToInstance(ResponseRealtimeBusDto, {
      busId: bus.id,
      plate: bus.plate,
      status: bus.status,
      lat: coordinates.latitude,
      lng: coordinates.longitude,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      routeId: routeDto?.id,
      routeName: routeDto?.name,
      updatedAt: coordinates.updatedAt,
      route: routeDto,
      nearestStop,
      nextStop,
      estimatedMinutesToNextStop,
      estimatedMinutesToWaitingStop,
      activePassengers,
      activeIncidents,
      occupancyPercent,
      isFull,
      delayAlert,
      statusColor,
    });
  }

  private findCurrentScheduler(schedulers: Scheduler[]): Scheduler | undefined {
    const now = new Date().getTime();
    const today = this.getLocalDateString(new Date());

    const candidates = schedulers.filter(
      (scheduler) =>
        scheduler.status === SchedulerStatus.SCHEDULED &&
        this.normalizeSchedulerDate(scheduler.date) === today,
    );

    const active = candidates.find((scheduler) => {
      const start = new Date(scheduler.startTime).getTime();
      const end = new Date(scheduler.endTime).getTime();
      return start <= now && end >= now;
    });

    if (active) {
      return active;
    }

    return candidates.sort(
      (left, right) =>
        new Date(right.startTime).getTime() -
        new Date(left.startTime).getTime(),
    )[0];
  }

  private resolveRouteScheduler(
    schedulers: Scheduler[],
    includeHistoricalForActiveTurn = false,
  ): Scheduler | undefined {
    const current = this.findCurrentScheduler(schedulers);
    if (current) {
      return current;
    }

    if (!includeHistoricalForActiveTurn) {
      return undefined;
    }

    return schedulers
      .filter((scheduler) => scheduler.status === SchedulerStatus.SCHEDULED)
      .sort(
        (left, right) =>
          new Date(right.startTime).getTime() -
          new Date(left.startTime).getTime(),
      )[0];
  }

  private hasActiveTurn(turns: Turn[]): boolean {
    return turns.some((turn) => turn.status === TurnStatus.IN_PROGRESS);
  }

  private isEligibleForRealtimeFleet(bus: {
    gps?: { latitude?: number | string; longitude?: number | string } | null;
    turns?: Turn[];
    schedulers?: Scheduler[];
  }): boolean {
    if (!this.resolveBusCoordinates(bus)) {
      return false;
    }

    return (
      this.hasActiveTurn(bus.turns ?? []) ||
      this.findCurrentScheduler(bus.schedulers ?? []) !== undefined
    );
  }

  private resolveBusCoordinates(bus: {
    gps?: {
      latitude?: number | string;
      longitude?: number | string;
      updatedAt?: Date;
    } | null;
    turns?: Turn[];
    schedulers?: Scheduler[];
  }): { latitude: number; longitude: number; updatedAt: Date } | undefined {
    if (bus.gps?.latitude !== undefined && bus.gps?.longitude !== undefined) {
      return {
        latitude: Number(bus.gps.latitude),
        longitude: Number(bus.gps.longitude),
        updatedAt: bus.gps.updatedAt ?? new Date(),
      };
    }

    const scheduler =
      this.resolveRouteScheduler(
        bus.schedulers ?? [],
        this.hasActiveTurn(bus.turns ?? []),
      ) ?? this.findCurrentScheduler(bus.schedulers ?? []);
    const firstStop = scheduler?.route?.nodes
      ?.slice()
      .sort((left, right) => left.order - right.order)[0]?.stop;

    if (!firstStop) {
      return undefined;
    }

    return {
      latitude: Number(firstStop.latitude),
      longitude: Number(firstStop.longitude),
      updatedAt: new Date(),
    };
  }

  private normalizeSchedulerDate(value: string | Date): string {
    if (value instanceof Date) {
      return this.getLocalDateString(value);
    }

    return String(value).slice(0, 10);
  }

  private getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toStopInfo(stop: any): RealtimeStopInfoDto {
    return plainToInstance(RealtimeStopInfoDto, {
      id: stop.id,
      name: stop.name,
      latitude: Number(stop.latitude),
      longitude: Number(stop.longitude),
    });
  }

  private findNearestStop(
    latitude: number,
    longitude: number,
    stops: RealtimeStopInfoDto[],
  ): RealtimeStopInfoDto | undefined {
    if (!stops.length) {
      return undefined;
    }
    return stops.reduce(
      (nearest, current) => {
        if (!nearest) return current;
        return this.calculateDistanceMeters(
          latitude,
          longitude,
          current.latitude,
          current.longitude,
        ) <
          this.calculateDistanceMeters(
            latitude,
            longitude,
            nearest.latitude,
            nearest.longitude,
          )
          ? current
          : nearest;
      },
      undefined as RealtimeStopInfoDto | undefined,
    );
  }

  private calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const earthRadius = 6371000;
    const deltaLat = toRad(lat2 - lat1);
    const deltaLon = toRad(lon2 - lon1);
    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  private findNextStop(
    currentStopId: string,
    stops: RealtimeStopInfoDto[],
  ): RealtimeStopInfoDto | undefined {
    const index = stops.findIndex((stop) => stop.id === currentStopId);
    if (index === -1 || index === stops.length - 1) {
      return undefined;
    }
    return stops[index + 1];
  }

  private calculateEstimatedMinutes(
    route: any | undefined,
    nearestStop?: RealtimeStopInfoDto,
    nextStop?: RealtimeStopInfoDto,
  ): number | undefined {
    if (!route || !nearestStop || !nextStop) {
      return undefined;
    }

    const currentNode = route.nodes?.find(
      (node: any) => node.stop?.id === nearestStop.id,
    );
    const nextNode = route.nodes?.find(
      (node: any) => node.stop?.id === nextStop.id,
    );

    if (!currentNode || !nextNode) {
      return undefined;
    }

    return Math.max(
      0,
      Number(nextNode.estimatedTimeMinutes) -
        Number(currentNode.estimatedTimeMinutes),
    );
  }

  private calculateEstimatedMinutesToStop(
    route: any | undefined,
    nearestStop: RealtimeStopInfoDto | undefined,
    targetStopId: string,
  ): number | undefined {
    if (!route || !nearestStop) {
      return undefined;
    }

    const currentNode = route.nodes?.find(
      (node: any) => node.stop?.id === nearestStop.id,
    );
    const targetNode = route.nodes?.find(
      (node: any) => node.stop?.id === targetStopId,
    );

    if (!currentNode || !targetNode) {
      return undefined;
    }

    return Math.max(
      0,
      Number(targetNode.estimatedTimeMinutes) -
        Number(currentNode.estimatedTimeMinutes),
    );
  }

  private async findNearestPublicStop(
    latitude: number,
    longitude: number,
  ): Promise<RealtimeStopInfoDto | undefined> {
    const nearby = await this.stopService.findNearbyStops(
      latitude,
      longitude,
      1,
      2000,
    );
    if (!nearby || !nearby.length) {
      return undefined;
    }
    const stop = nearby[0];
    return plainToInstance(RealtimeStopInfoDto, {
      id: stop.id,
      name: stop.name,
      latitude: Number(stop.latitude),
      longitude: Number(stop.longitude),
    });
  }

  async getActiveIncidents(
    enterpriseId?: string,
  ): Promise<ResponseIncidentDto[]> {
    return this.incidentService.findActiveIncidents(enterpriseId);
  }

  getEtaForStop(
    status: ResponseRealtimeBusDto,
    stopId?: string,
  ): number | undefined {
    if (stopId) {
      return status.estimatedMinutesToWaitingStop;
    }
    return status.estimatedMinutesToNextStop;
  }

  getStopNameForSubscription(
    status: ResponseRealtimeBusDto,
    stopId?: string,
  ): string | undefined {
    if (stopId) {
      const waitingStop = status.route?.stops?.find(
        (stop) => stop.id === stopId,
      );
      return (
        waitingStop?.name ?? status.nextStop?.name ?? status.nearestStop?.name
      );
    }
    return status.nextStop?.name ?? status.nearestStop?.name;
  }

  private async markArrivalSubscriptionAsNotified(
    subscriptionId: string,
  ): Promise<void> {
    await this.notificationSubscriptionRepository.update(subscriptionId, {
      notifiedAt: new Date(),
    });
  }

  private async findTargetBusStatus(
    payload: CreateArrivalNotificationDto,
  ): Promise<ResponseRealtimeBusDto | undefined> {
    if (payload.busId) {
      return this.getBusRealtimeStatus(payload.busId, payload.stopId);
    }
    if (payload.routeId) {
      const fleet = await this.getRealtimeFleet(
        undefined,
        payload.routeId,
        payload.stopId,
      );
      if (!fleet.items.length) {
        return undefined;
      }

      return fleet.items.reduce((best, current) => {
        const currentEta = this.getEtaForStop(current, payload.stopId);
        const bestEta = this.getEtaForStop(best, payload.stopId);
        if (currentEta === undefined) {
          return best;
        }
        if (bestEta === undefined) {
          return current;
        }
        return currentEta < bestEta ? current : best;
      });
    }
    return undefined;
  }

  private async sendArrivalEmail(
    status: ResponseRealtimeBusDto,
    subscription: NotificationSubscription,
    etaMinutes?: number,
    stopName?: string,
  ): Promise<boolean> {
    const subject = `Alerta de llegada: bus ${status.plate}`;
    const bodyLines = [
      `Mensaje: ${subscription.message ?? ''}`,
      `Bus: ${status.plate}`,
      `Ruta: ${status.route?.name ?? 'No disponible'}`,
      `Paradero objetivo: ${stopName ?? 'No disponible'}`,
      `Tiempo estimado de llegada: ${etaMinutes ?? 'Desconocido'} minutos`,
      `Ocupación: ${status.occupancyPercent ?? 'N/A'}%`,
      `URL de seguimiento: /dashboard/realtime/bus/${status.busId}`,
    ];

    return this.notificationService.sendEmail({
      to: subscription.email,
      subject,
      body: bodyLines.join('\n'),
    });
  }
}

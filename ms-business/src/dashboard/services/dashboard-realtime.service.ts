import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { BusService } from '@/bus/bus.service';
import { TicketService } from '@/ticket/ticket.service';
import { IncidentService } from '@/incident/incident.service';
import { StopService } from '@/stop/stop.service';
import { NotificationService } from '@/incident/services/notification.service';
import { ResponseRealtimeBusDto } from '../dto/response-realtime-bus.dto';
import { ResponseRealtimeBusListDto } from '../dto/response-realtime-bus-list.dto';
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
  nextStopName?: string;
  status?: ResponseRealtimeBusDto;
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
    private readonly notificationService: NotificationService,
  ) {}

  async getRealtimeFleet(
    enterpriseId?: string,
    routeId?: string,
  ): Promise<ResponseRealtimeBusListDto> {
    const buses =
      await this.busService.findAllWithGpsAndSchedules(enterpriseId);

    const fleet = await Promise.all(
      buses
        .filter((bus) => bus.gps && this.hasActiveTurn(bus.turns ?? []))
        .map(async (bus) => this.buildRealtimeBus(bus)),
    );

    const filteredFleet = routeId
      ? fleet.filter((bus) => bus.route?.id === routeId)
      : fleet;

    return plainToInstance(ResponseRealtimeBusListDto, {
      items: filteredFleet,
    });
  }

  async getBusRealtimeStatus(busId: string): Promise<ResponseRealtimeBusDto> {
    const bus = await this.busService.findOneWithGpsAndSchedules(busId);
    return this.buildRealtimeBus(bus);
  }

  async sendArrivalNotification(
    payload: CreateArrivalNotificationDto,
  ): Promise<{
    subscribed: boolean;
    sent: boolean;
    scheduled: boolean;
    etaMinutes?: number;
    nextStopName?: string;
  }> {
    const subscription = await this.createArrivalSubscription(payload);
    const result = await this.dispatchArrivalSubscription(subscription);

    return {
      subscribed: true,
      sent: result.sent,
      scheduled: result.scheduled,
      etaMinutes: result.etaMinutes,
      nextStopName: result.nextStopName,
    };
  }

  async createArrivalSubscription(
    payload: CreateArrivalNotificationDto,
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
    });
  }

  async dispatchArrivalSubscription(
    subscription: NotificationSubscription,
  ): Promise<ArrivalNotificationDispatchResult> {
    const status = await this.findTargetBusStatus({
      email: subscription.email,
      routeId: subscription.routeId,
      busId: subscription.busId,
      stopId: subscription.stopId,
      anticipationMinutes: subscription.anticipationMinutes,
      message: subscription.message ?? '',
    });

    if (!status) {
      return {
        subscription,
        sent: false,
        scheduled: true,
      };
    }

    const shouldSendNow =
      status.estimatedMinutesToNextStop !== undefined &&
      status.estimatedMinutesToNextStop <= subscription.anticipationMinutes;

    if (!shouldSendNow) {
      return {
        subscription,
        sent: false,
        scheduled: true,
        etaMinutes: status.estimatedMinutesToNextStop,
        nextStopName: status.nextStop?.name,
        status,
      };
    }

    const sent = await this.sendArrivalEmail(status, subscription);
    if (sent) {
      await this.markArrivalSubscriptionAsNotified(subscription.id);
    }

    return {
      subscription,
      sent,
      scheduled: !sent,
      etaMinutes: status.estimatedMinutesToNextStop,
      nextStopName: status.nextStop?.name,
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

  private async buildRealtimeBus(bus: any): Promise<ResponseRealtimeBusDto> {
    if (!bus.gps) {
      throw new NotFoundException(`GPS no encontrado para el bus ${bus.id}`);
    }

    const activeScheduler = this.findCurrentScheduler(bus.schedulers ?? []);
    const route = activeScheduler?.route;
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
        bus.gps.latitude,
        bus.gps.longitude,
        routeDto?.stops ?? [],
      ) ??
      (await this.findNearestPublicStop(bus.gps.latitude, bus.gps.longitude));

    const nextStop = nearestStop
      ? this.findNextStop(nearestStop.id, routeDto?.stops ?? [])
      : undefined;

    const estimatedMinutesToNextStop = this.calculateEstimatedMinutes(
      route,
      nearestStop,
      nextStop,
    );

    const activePassengers = await this.ticketService.countActiveTicketsByBus(
      bus.id,
    );
    const activeIncidents =
      await this.incidentService.countActiveIncidentsByBus(bus.id);
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
      latitude: Number(bus.gps.latitude),
      longitude: Number(bus.gps.longitude),
      updatedAt: bus.gps.updatedAt,
      route: routeDto,
      nearestStop,
      nextStop,
      estimatedMinutesToNextStop,
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
        scheduler.date === today,
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

  private hasActiveTurn(turns: Turn[]): boolean {
    return turns.some((turn) => turn.status === TurnStatus.IN_PROGRESS);
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
      // Se agregó validación en caso de que vengan como strings de la BD
      Number(nextNode.estimatedTimeMinutes) -
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
      return this.getBusRealtimeStatus(payload.busId);
    }
    if (payload.routeId) {
      const fleet = await this.getRealtimeFleet(undefined, payload.routeId);
      const candidates = fleet.items.filter((bus) =>
        payload.stopId ? bus.nextStop?.id === payload.stopId : true,
      );
      if (!candidates.length) {
        return fleet.items[0];
      }
      return candidates.reduce((best, current) => {
        if (!best) return current;
        if (
          current.estimatedMinutesToNextStop === undefined ||
          (best.estimatedMinutesToNextStop !== undefined &&
            current.estimatedMinutesToNextStop <
              best.estimatedMinutesToNextStop)
        ) {
          return current;
        }
        return best;
      }, candidates[0]);
    }
    return undefined;
  }

  private async sendArrivalEmail(
    status: ResponseRealtimeBusDto,
    subscription: NotificationSubscription,
  ): Promise<boolean> {
    const subject = `Alerta de llegada: bus ${status.plate}`;
    const bodyLines = [
      `Mensaje: ${subscription.message ?? ''}`,
      `Bus: ${status.plate}`,
      `Ruta: ${status.route?.name ?? 'No disponible'}`,
      `Paradero objetivo: ${status.nextStop?.name ?? status.nearestStop?.name ?? 'No disponible'}`,
      `Tiempo estimado de llegada: ${status.estimatedMinutesToNextStop ?? 'Desconocido'} minutos`,
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

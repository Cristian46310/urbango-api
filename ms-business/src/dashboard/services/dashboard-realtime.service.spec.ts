import { DashboardRealtimeService } from './dashboard-realtime.service';
import { SchedulerStatus } from '@/scheduler/entities/scheduler.entity';
import { TurnStatus } from '@/turn/entities/turn.entity';

describe('DashboardRealtimeService', () => {
  const today = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const route = {
    id: 'route-1',
    name: 'Circular Centro',
    nodes: [
      {
        order: 1,
        estimatedTimeMinutes: 0,
        stop: {
          id: 'stop-1',
          name: 'Paradero A',
          latitude: 5.0703,
          longitude: -75.5138,
        },
      },
      {
        order: 2,
        estimatedTimeMinutes: 8,
        stop: {
          id: 'stop-2',
          name: 'Paradero B',
          latitude: 5.071,
          longitude: -75.514,
        },
      },
      {
        order: 3,
        estimatedTimeMinutes: 15,
        stop: {
          id: 'stop-3',
          name: 'Paradero C',
          latitude: 5.072,
          longitude: -75.515,
        },
      },
    ],
  };

  const scheduler = {
    status: SchedulerStatus.SCHEDULED,
    date: today(),
    startTime: new Date(Date.now() - 60_000),
    endTime: new Date(Date.now() + 60_000),
    route,
  };

  const buildService = (
    buses: any[],
    overrides: Record<string, unknown> = {},
  ) => {
    const busService = {
      findAllWithGpsAndSchedules: jest.fn().mockResolvedValue(buses),
      findOneWithGpsAndSchedules: jest.fn(),
      ...((overrides.busService as object) ?? {}),
    };
    const ticketService = {
      countActiveTicketsByBus: jest.fn().mockResolvedValue(0),
      ...((overrides.ticketService as object) ?? {}),
    };
    const incidentService = {
      countActiveIncidentsByBus: jest.fn().mockResolvedValue(0),
      findActiveIncidents: jest.fn().mockResolvedValue([]),
      ...((overrides.incidentService as object) ?? {}),
    };
    const stopService = {
      findNearbyStops: jest.fn().mockResolvedValue([]),
      ...((overrides.stopService as object) ?? {}),
    };
    const notificationService = {
      sendEmail: jest.fn().mockResolvedValue(true),
      ...((overrides.notificationService as object) ?? {}),
    };
    const notificationSubscriptionRepository = {
      create: jest.fn((payload: object) => payload),
      save: jest.fn((payload: object) =>
        Promise.resolve({ id: 'sub-1', ...payload }),
      ),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      ...((overrides.notificationSubscriptionRepository as object) ?? {}),
    };

    const service = new DashboardRealtimeService(
      notificationSubscriptionRepository as never,
      busService as never,
      ticketService as never,
      incidentService as never,
      stopService as never,
      notificationService as never,
    );

    return {
      service,
      busService,
      notificationService,
      notificationSubscriptionRepository,
    };
  };

  const activeBus = (overrides: Record<string, unknown> = {}) => ({
    id: 'bus-1',
    plate: 'ABC-123',
    status: 'operativo',
    seatedCapacity: 20,
    standingCapacity: 10,
    gps: {
      latitude: 5.07031,
      longitude: -75.51381,
      updatedAt: new Date(),
    },
    turns: [{ status: TurnStatus.IN_PROGRESS }],
    schedulers: [scheduler],
    ...overrides,
  });

  it('includes buses with an active scheduler even without in-progress turn', async () => {
    const scheduledOnlyBus = {
      ...activeBus(),
      id: 'bus-scheduled',
      plate: 'SCH-001',
      turns: [{ status: TurnStatus.SCHEDULED }],
    };

    const { service } = buildService([scheduledOnlyBus]);

    const result = await service.getRealtimeFleet(undefined, 'route-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].plate).toBe('SCH-001');
  });

  it('keeps route metadata for in-progress buses when today has no scheduler', async () => {
    const historicalScheduler = {
      ...scheduler,
      date: '2026-01-01',
      startTime: new Date('2026-01-01T08:00:00'),
      endTime: new Date('2026-01-01T09:00:00'),
    };
    const bus = activeBus({
      schedulers: [historicalScheduler],
    });

    const { service } = buildService([bus]);

    const result = await service.getRealtimeFleet(undefined, 'route-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].route?.id).toBe('route-1');
  });

  it('returns only buses with GPS and an in-progress turn', async () => {
    const inactiveBus = {
      ...activeBus(),
      id: 'bus-2',
      plate: 'DEF-456',
      turns: [{ status: TurnStatus.SCHEDULED }],
      schedulers: [],
      gps: undefined,
    };

    const { service } = buildService([activeBus(), inactiveBus]);

    const result = await service.getRealtimeFleet(undefined, 'route-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      busId: 'bus-1',
      plate: 'ABC-123',
      lat: 5.07031,
      lng: -75.51381,
      routeId: 'route-1',
      routeName: 'Circular Centro',
      route: { id: 'route-1', name: 'Circular Centro' },
      statusColor: 'green',
    });
  });

  it('calculates ETA to the citizen waiting stop', async () => {
    const { service } = buildService([activeBus()]);

    const result = await service.getRealtimeFleet(
      undefined,
      'route-1',
      'stop-3',
    );

    expect(result.items[0].estimatedMinutesToWaitingStop).toBe(15);
    expect(result.items[0].estimatedMinutesToNextStop).toBe(8);
  });

  it('selects the bus with the lowest ETA to the waiting stop on a route', async () => {
    const nearerBus = activeBus({
      id: 'bus-near',
      plate: 'NEAR-1',
      gps: {
        latitude: 5.07095,
        longitude: -75.51395,
        updatedAt: new Date(),
      },
    });
    const fartherBus = activeBus({
      id: 'bus-far',
      plate: 'FAR-1',
      gps: {
        latitude: 5.07031,
        longitude: -75.51381,
        updatedAt: new Date(),
      },
    });

    const { service } = buildService([nearerBus, fartherBus]);

    const status = await service['findTargetBusStatus']({
      routeId: 'route-1',
      stopId: 'stop-3',
      email: 'user@example.com',
    });

    expect(status?.busId).toBe('bus-near');
    expect(status?.estimatedMinutesToWaitingStop).toBeLessThan(
      fartherBus.gps.latitude === 5.07031 ? 15 : 999,
    );
  });

  it('dispatches arrival notification when ETA is within anticipation window', async () => {
    const { service, notificationService, notificationSubscriptionRepository } =
      buildService([activeBus()]);

    notificationSubscriptionRepository.find.mockResolvedValue([
      {
        id: 'sub-1',
        email: 'user@example.com',
        routeId: 'route-1',
        stopId: 'stop-2',
        anticipationMinutes: 10,
        message: 'Alerta',
      },
    ]);

    const results = await service.processPendingArrivalSubscriptions();

    expect(results[0].sent).toBe(true);
    expect(results[0].etaMinutes).toBe(8);
    expect(notificationService.sendEmail).toHaveBeenCalled();
  });

  it('builds dashboard summary with total passengers and full bus alerts', async () => {
    const fullBus = activeBus({
      id: 'bus-full',
      seatedCapacity: 2,
      standingCapacity: 0,
    });
    const { service } = buildService([fullBus], {
      ticketService: {
        countActiveTicketsByBus: jest.fn().mockResolvedValue(2),
      },
    });

    const summary = await service.getDashboardSummary();

    expect(summary.totalPassengersInTransit).toBe(2);
    expect(summary.fullBusAlerts).toHaveLength(1);
    expect(summary.fullBusAlerts[0].isFull).toBe(true);
  });
});

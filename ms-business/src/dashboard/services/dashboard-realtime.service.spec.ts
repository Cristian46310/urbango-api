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

  const buildService = (buses: any[]) => {
    const busService = {
      findAllWithGpsAndSchedules: jest.fn().mockResolvedValue(buses),
      findOneWithGpsAndSchedules: jest.fn(),
    };
    const ticketService = {
      countActiveTicketsByBus: jest.fn().mockResolvedValue(0),
    };
    const incidentService = {
      countActiveIncidentsByBus: jest.fn().mockResolvedValue(0),
      findActiveIncidents: jest.fn().mockResolvedValue([]),
    };
    const stopService = {
      findNearbyStops: jest.fn().mockResolvedValue([]),
    };
    const notificationService = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };
    const notificationSubscriptionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };

    const service = new DashboardRealtimeService(
      notificationSubscriptionRepository as never,
      busService as never,
      ticketService as never,
      incidentService as never,
      stopService as never,
      notificationService as never,
    );

    return { service, busService };
  };

  it('returns only buses with GPS and an in-progress turn', async () => {
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
      ],
    };
    const scheduler = {
      status: SchedulerStatus.SCHEDULED,
      date: today(),
      startTime: new Date(Date.now() - 60_000),
      endTime: new Date(Date.now() + 60_000),
      route,
    };
    const activeBus = {
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
    };
    const scheduledOnlyBus = {
      ...activeBus,
      id: 'bus-2',
      plate: 'DEF-456',
      turns: [{ status: TurnStatus.SCHEDULED }],
    };

    const { service } = buildService([activeBus, scheduledOnlyBus]);

    const result = await service.getRealtimeFleet(undefined, 'route-1');

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      busId: 'bus-1',
      plate: 'ABC-123',
      route: { id: 'route-1', name: 'Circular Centro' },
      statusColor: 'green',
    });
  });
});

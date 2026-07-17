import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import {
  RecurrenceType,
  Scheduler,
  SchedulerStatus,
} from './entities/scheduler.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Route } from '@/route/entities/route.entity';
import { Turn, TurnStatus } from '@/turn/entities/turn.entity';
import { BusService } from '@/bus/bus.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let schedulerRepository: {
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  };
  let busRepository: { findOne: jest.Mock };
  let routeRepository: { findOne: jest.Mock };
  let turnRepository: { findOne: jest.Mock };
  let busService: { assertBusAvailableForScheduling: jest.Mock };
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock;
  };

  const routeWithNodes = {
    id: 'route-1',
    nodes: [{ estimatedTimeMinutes: 30 }, { estimatedTimeMinutes: 45 }],
  };

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    schedulerRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(async (scheduler) => {
        if (Array.isArray(scheduler)) {
          return scheduler.map((item, index) => ({
            id: `scheduler-${index + 1}`,
            createdAt: new Date(),
            ...item,
          }));
        }
        return {
          id: 'scheduler-1',
          createdAt: new Date(),
          ...scheduler,
        };
      }),
      createQueryBuilder: jest.fn(() => queryBuilder),
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      softDelete: jest.fn(),
    };
    busRepository = {
      findOne: jest.fn(),
    };
    routeRepository = {
      findOne: jest.fn(),
    };
    turnRepository = {
      findOne: jest.fn(),
    };
    busService = {
      assertBusAvailableForScheduling: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        {
          provide: getRepositoryToken(Scheduler),
          useValue: schedulerRepository,
        },
        {
          provide: getRepositoryToken(Bus),
          useValue: busRepository,
        },
        {
          provide: getRepositoryToken(Route),
          useValue: routeRepository,
        },
        {
          provide: getRepositoryToken(Turn),
          useValue: turnRepository,
        },
        {
          provide: BusService,
          useValue: busService,
        },
      ],
    }).compile();

    service = module.get(SchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a scheduler when bus is free and has assigned driver', async () => {
    busRepository.findOne.mockResolvedValue({
      id: 'bus-1',
      status: 'operativo',
    });
    routeRepository.findOne.mockResolvedValue(routeWithNodes);
    queryBuilder.getOne.mockResolvedValue(null);
    turnRepository.findOne.mockResolvedValue({
      id: 'turn-1',
      status: TurnStatus.SCHEDULED,
      driver: { id: 'driver-1' },
    });

    const result = await service.create({
      busId: 'bus-1',
      routeId: 'route-1',
      date: '2026-05-20',
      departureTime: '08:00:00',
      toleranceMinutes: 5,
      recurrenceType: RecurrenceType.WEEKDAYS,
    });

    expect(schedulerRepository.create).toHaveBeenCalled();
    expect(schedulerRepository.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          date: '2026-05-20',
          status: SchedulerStatus.SCHEDULED,
          toleranceMinutes: 5,
          recurrenceType: RecurrenceType.WEEKDAYS,
        }),
      ]),
    );
    // 2026-05-20 is Wednesday → weekdays in a 28-day window ≈ 20 occurrences
    const savedArg = schedulerRepository.save.mock.calls[0][0] as unknown[];
    expect(savedArg.length).toBeGreaterThan(1);
    expect(result.id).toBe('scheduler-1');
    expect(result.departureTime).toBeDefined();
    expect(result.endTime).toBeDefined();
  });

  it('rejects overlapping active scheduler for same bus and date', async () => {
    busRepository.findOne.mockResolvedValue({
      id: 'bus-1',
      status: 'operativo',
    });
    routeRepository.findOne.mockResolvedValue(routeWithNodes);
    queryBuilder.getOne.mockResolvedValue({ id: 'scheduler-existing' });

    await expect(
      service.create({
        busId: 'bus-1',
        routeId: 'route-1',
        date: '2026-05-20',
        departureTime: '08:00:00',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects scheduler when bus has no driver turn for the departure window', async () => {
    busRepository.findOne.mockResolvedValue({
      id: 'bus-1',
      status: 'operativo',
    });
    routeRepository.findOne.mockResolvedValue(routeWithNodes);
    queryBuilder.getOne.mockResolvedValue(null);
    turnRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        busId: 'bus-1',
        routeId: 'route-1',
        date: '2026-05-20',
        departureTime: '08:00:00',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('computes endTime from route node durations', async () => {
    busRepository.findOne.mockResolvedValue({
      id: 'bus-1',
      status: 'operativo',
    });
    routeRepository.findOne.mockResolvedValue(routeWithNodes);
    queryBuilder.getOne.mockResolvedValue(null);
    turnRepository.findOne.mockResolvedValue({
      id: 'turn-1',
      driver: { id: 'driver-1' },
    });

    await service.create({
      busId: 'bus-1',
      routeId: 'route-1',
      date: '2026-05-20',
      departureTime: '08:00:00',
    });

    const created = schedulerRepository.create.mock.calls[0][0];
    const departureMs = created.startTime.getTime();
    const endMs = created.endTime.getTime();
    expect(endMs - departureMs).toBe(75 * 60 * 1000);
  });
});

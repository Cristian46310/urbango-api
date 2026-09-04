import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TurnService } from './turn.service';
import { Turn, TurnStatus } from './entities/turn.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { GpsService } from '@/gps/gps.service';
import {
  TURN_ASSIGNED_EVENT,
  TurnAssignedEvent,
} from './events/turn-assigned.event';

describe('TurnService', () => {
  let service: TurnService;
  let turnRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let eventEmitter: { emit: jest.Mock };
  let queryBuilder: {
    leftJoin: jest.Mock;
    where: jest.Mock;
    andWhere: jest.Mock;
    update: jest.Mock;
    set: jest.Mock;
    getOne: jest.Mock;
    execute: jest.Mock;
  };

  const bus = {
    id: 'bus-1',
    plate: 'ABC-123',
    model: '2023',
  } as Bus;

  const scheduledTurn = {
    id: 'turn-1',
    status: TurnStatus.SCHEDULED,
    actualStartTime: null,
    bus,
  } as Turn;

  beforeEach(async () => {
    queryBuilder = {
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(null),
      execute: jest.fn().mockResolvedValue({ affected: 0 }),
    };
    turnRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((data: Partial<Turn>) => data as Turn),
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnService,
        {
          provide: getRepositoryToken(Turn),
          useValue: turnRepository,
        },
        {
          provide: getRepositoryToken(Bus),
          useValue: { findOne: jest.fn().mockResolvedValue(bus) },
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: {
            findOne: jest.fn().mockResolvedValue({ id: 'driver-1' }),
          },
        },
        {
          provide: GpsService,
          useValue: { upsertBusPosition: jest.fn() },
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
      ],
    }).compile();

    service = module.get(TurnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('emits turn.assigned with turnId after create', async () => {
    turnRepository.save.mockResolvedValue({ id: 'turn-new' });

    await service.create({
      startTime: '2026-07-26T12:00:00.000Z',
      endTime: '2026-07-26T20:00:00.000Z',
      busId: 'bus-1',
      driverId: 'driver-1',
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      TURN_ASSIGNED_EVENT,
      expect.any(TurnAssignedEvent),
    );
    const firstCall = eventEmitter.emit.mock.calls[0] as
      | [string, TurnAssignedEvent]
      | undefined;
    expect(firstCall?.[1].turnId).toBe('turn-new');
  });

  it('emits turn.assigned even without driver', async () => {
    turnRepository.save.mockResolvedValue({ id: 'turn-no-driver' });

    await service.create({
      startTime: '2026-07-26T12:00:00.000Z',
      endTime: '2026-07-26T20:00:00.000Z',
      busId: 'bus-1',
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      TURN_ASSIGNED_EVENT,
      expect.objectContaining({ turnId: 'turn-no-driver' }),
    );
  });

  it('starts the current scheduled turn', async () => {
    turnRepository.findOne.mockResolvedValue({ ...scheduledTurn });
    turnRepository.save.mockImplementation((turn: Turn) =>
      Promise.resolve(turn),
    );

    const result = await service.startTurn('driver-1', {
      busStatus: 'operativo',
      observations: 'Llantas un poco desgastadas',
    });

    expect(turnRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        busStatus: 'operativo',
        busObservations: 'Llantas un poco desgastadas',
        status: TurnStatus.IN_PROGRESS,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        turnId: 'turn-1',
        status: TurnStatus.IN_PROGRESS,
        bus: {
          id: 'bus-1',
          placa: 'ABC-123',
          modelo: '2023',
        },
      }),
    );
    expect(result.startTime).toBeInstanceOf(Date);
  });

  it('throws 404 when there is no current turn', async () => {
    turnRepository.findOne.mockResolvedValue(null);

    await expect(
      service.startTurn('driver-1', { busStatus: 'operativo' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws 409 when the current turn is not scheduled', async () => {
    turnRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...scheduledTurn,
      status: TurnStatus.IN_PROGRESS,
    });

    await expect(
      service.startTurn('driver-1', { busStatus: 'operativo' }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates GPS for the active in-progress turn', async () => {
    const gpsService = {
      upsertBusPosition: jest.fn().mockResolvedValue({ busId: 'bus-1' }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnService,
        {
          provide: getRepositoryToken(Turn),
          useValue: turnRepository,
        },
        {
          provide: getRepositoryToken(Bus),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: {},
        },
        {
          provide: GpsService,
          useValue: gpsService,
        },
        {
          provide: EventEmitter2,
          useValue: eventEmitter,
        },
      ],
    }).compile();

    const turnService = module.get(TurnService);
    turnRepository.findOne.mockResolvedValue({
      ...scheduledTurn,
      status: TurnStatus.IN_PROGRESS,
    });

    const result = await turnService.updateGpsPosition(
      'driver-1',
      5.07,
      -75.51,
    );

    expect(gpsService.upsertBusPosition).toHaveBeenCalledWith(
      'bus-1',
      5.07,
      -75.51,
    );
    expect(result).toEqual({ busId: 'bus-1' });
  });

  it('ends the active in-progress turn', async () => {
    const endTime = new Date('2026-07-26T20:00:00.000Z');
    turnRepository.findOne.mockResolvedValue({
      ...scheduledTurn,
      status: TurnStatus.IN_PROGRESS,
      endTime,
    });
    turnRepository.save.mockImplementation((turn: Turn) =>
      Promise.resolve(turn),
    );

    const result = await service.endTurn('driver-1');

    expect(turnRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'turn-1',
        status: TurnStatus.COMPLETED,
      }),
    );
    expect(result).toEqual({
      turnId: 'turn-1',
      status: TurnStatus.COMPLETED,
      endTime,
    });
  });

  it('throws 404 when ending without an in-progress turn', async () => {
    turnRepository.findOne.mockResolvedValue(null);

    await expect(service.endTurn('driver-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('closes expired in_progress as completed and scheduled as cancelled', async () => {
    queryBuilder.execute
      .mockResolvedValueOnce({ affected: 2 })
      .mockResolvedValueOnce({ affected: 1 });

    const result = await service.closeExpiredTurns(
      new Date('2026-07-26T21:00:00.000Z'),
    );

    expect(queryBuilder.update).toHaveBeenCalledWith(Turn);
    expect(queryBuilder.set).toHaveBeenCalledWith({
      status: TurnStatus.COMPLETED,
    });
    expect(queryBuilder.set).toHaveBeenCalledWith({
      status: TurnStatus.CANCELLED,
    });
    expect(result).toEqual({ completed: 2, cancelled: 1 });
  });

  it('returns active current turn when in_progress exists', async () => {
    const startTime = new Date('2026-07-26T12:00:00.000Z');
    const actualStartTime = new Date('2026-07-26T12:05:00.000Z');
    const endTime = new Date('2026-07-26T20:00:00.000Z');
    turnRepository.findOne.mockResolvedValue({
      ...scheduledTurn,
      status: TurnStatus.IN_PROGRESS,
      startTime,
      actualStartTime,
      endTime,
    });

    const result = await service.getCurrentTurn('driver-1');

    expect(result).toEqual({
      active: true,
      turnId: 'turn-1',
      bus: {
        id: 'bus-1',
        placa: 'ABC-123',
        modelo: '2023',
      },
      startTime: actualStartTime,
      scheduledStartTime: startTime,
      endTime,
      status: TurnStatus.IN_PROGRESS,
    });
  });

  it('returns active false when there is no in_progress turn', async () => {
    turnRepository.findOne.mockResolvedValue(null);

    await expect(service.getCurrentTurn('driver-1')).resolves.toEqual({
      active: false,
    });
  });
});

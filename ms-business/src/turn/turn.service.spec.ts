import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TurnService } from './turn.service';
import { Turn, TurnStatus } from './entities/turn.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { GpsService } from '@/gps/gps.service';

describe('TurnService', () => {
  let service: TurnService;
  let turnRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
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
    turnRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
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
          useValue: { upsertBusPosition: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(TurnService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('starts the current scheduled turn', async () => {
    turnRepository.findOne.mockResolvedValue({ ...scheduledTurn });
    turnRepository.save.mockImplementation((turn: Turn) => Promise.resolve(turn));

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
});

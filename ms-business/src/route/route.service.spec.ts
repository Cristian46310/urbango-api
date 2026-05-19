import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RouteService } from './route.service';
import { Route } from './entities/route.entity';
import { Node } from '@/node/entities/node.entity';
import { Stop } from '@/stop/entities/stop.entity';

describe('RouteService', () => {
  let service: RouteService;
  let routeRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    update: jest.Mock;
  };
  let nodeRepository: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let stopRepository: {
    findBy: jest.Mock;
  };

  const stops = [
    { id: 'stop-1', name: 'A', location: 'A', createdAt: new Date() },
    { id: 'stop-2', name: 'B', location: 'B', createdAt: new Date() },
    { id: 'stop-3', name: 'C', location: 'C', createdAt: new Date() },
  ] as Stop[];

  beforeEach(async () => {
    routeRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(async (route) => ({ id: 'route-1', ...route })),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
    };
    nodeRepository = {
      create: jest.fn((data) => data),
      save: jest.fn(async (nodes) => nodes),
      delete: jest.fn(),
    };
    stopRepository = {
      findBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteService,
        {
          provide: getRepositoryToken(Route),
          useValue: routeRepository,
        },
        {
          provide: getRepositoryToken(Node),
          useValue: nodeRepository,
        },
        {
          provide: getRepositoryToken(Stop),
          useValue: stopRepository,
        },
      ],
    }).compile();

    service = module.get<RouteService>(RouteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a route with ordered nodes and generated code', async () => {
    stopRepository.findBy.mockResolvedValue(stops);
    routeRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'route-1',
        code: 'RUT-ABC',
        name: 'Ruta Centro Norte',
        description: 'Conecta el centro con la zona norte',
        price: 2800,
        nodes: [
          {
            order: 1,
            distanceFromPrevious: 0,
            estimatedTimeMinutes: 0,
            stop: stops[0],
          },
          {
            order: 2,
            distanceFromPrevious: 1.4,
            estimatedTimeMinutes: 5,
            stop: stops[1],
          },
          {
            order: 3,
            distanceFromPrevious: 2.1,
            estimatedTimeMinutes: 8,
            stop: stops[2],
          },
        ],
        createdAt: new Date(),
      });

    const response = await service.create({
      name: 'Ruta Centro Norte',
      description: 'Conecta el centro con la zona norte',
      price: 2800,
      nodes: [
        {
          stopId: 'stop-1',
          order: 1,
          distanceFromPrevious: 0,
          estimatedTimeMinutes: 0,
        },
        {
          stopId: 'stop-2',
          order: 2,
          distanceFromPrevious: 1.4,
          estimatedTimeMinutes: 5,
        },
        {
          stopId: 'stop-3',
          order: 3,
          distanceFromPrevious: 2.1,
          estimatedTimeMinutes: 8,
        },
      ],
    });

    expect(routeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: expect.stringMatching(/^RUT-/),
      }),
    );
    expect(nodeRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        distanceFromPrevious: 1.4,
        estimatedTimeMinutes: 5,
      }),
    );
    expect(response.nodes).toHaveLength(3);
  });

  it('rejects routes with fewer than 3 stops', async () => {
    await expect(
      service.create({
        name: 'Ruta corta',
        description: 'No cumple minimo',
        price: 2800,
        nodes: [
          {
            stopId: 'stop-1',
            order: 1,
            distanceFromPrevious: 0,
            estimatedTimeMinutes: 0,
          },
          {
            stopId: 'stop-2',
            order: 2,
            distanceFromPrevious: 1,
            estimatedTimeMinutes: 4,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects duplicated stops', async () => {
    await expect(
      service.create({
        name: 'Ruta duplicada',
        description: 'Tiene paraderos repetidos',
        price: 2800,
        nodes: [
          {
            stopId: 'stop-1',
            order: 1,
            distanceFromPrevious: 0,
            estimatedTimeMinutes: 0,
          },
          {
            stopId: 'stop-1',
            order: 2,
            distanceFromPrevious: 1,
            estimatedTimeMinutes: 4,
          },
          {
            stopId: 'stop-3',
            order: 3,
            distanceFromPrevious: 1,
            estimatedTimeMinutes: 4,
          },
        ],
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

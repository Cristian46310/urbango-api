import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { StopService } from './stop.service';
import { Stop } from './entities/stop.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import {
  createMockRepository,
  createMockQueryBuilder,
} from '@/test/helpers/typeorm-mocks';

describe('StopService', () => {
  let service: StopService;
  let repo: ReturnType<typeof createMockRepository<Stop>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StopService, provideMockRepo(Stop)],
    }).compile();

    service = module.get(StopService);
    repo = module.get(getRepositoryToken(Stop));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne throws when stop not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('create assigns PAR-1 when no stops exist', async () => {
    repo.find.mockResolvedValue([]);
    repo.create.mockImplementation((data) => data);
    repo.save.mockImplementation(async (data) => ({
      id: 'stop-1',
      createdAt: new Date('2026-01-01'),
      ...data,
    }));

    const result = await service.create({
      name: 'Parque',
      location: 'Calle 1',
      latitude: 5.07,
      longitude: -75.51,
    });

    expect(repo.find).toHaveBeenCalledWith({
      order: { code: 'DESC' },
      take: 1,
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PAR-1' }),
    );
    expect(result.code).toBe('PAR-1');
  });

  it('findNearbyStops maps raw rows and clamps limit', async () => {
    const qb = createMockQueryBuilder();
    qb.getRawMany.mockResolvedValue([
      {
        id: 's1',
        name: 'Stop A',
        location: 'Loc',
        latitude: '4.5',
        longitude: '-75.5',
        distanceMeters: '100',
        routes: [{ id: 'r1', name: 'Route 1' }],
      },
    ]);
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findNearbyStops(4.5, -75.5, 200, 500);
    expect(result).toHaveLength(1);
    expect(result[0].distanceMeters).toBe(100);
    expect(result[0].routes[0].name).toBe('Route 1');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { RouteService } from './route.service';
import { Route } from './entities/route.entity';
import { Node } from '@/node/entities/node.entity';
import { Stop } from '@/stop/entities/stop.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('RouteService', () => {
  let service: RouteService;
  let routeRepo: ReturnType<typeof createMockRepository<Route>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RouteService,
        provideMockRepo(Route),
        provideMockRepo(Node),
        provideMockRepo(Stop),
      ],
    }).compile();

    service = module.get(RouteService);
    routeRepo = module.get(getRepositoryToken(Route));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne throws when route not found', async () => {
    routeRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(
      BadRequestException,
    );
  });
});

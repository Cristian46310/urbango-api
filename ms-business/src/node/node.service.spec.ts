import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { NodeService } from './node.service';
import { Node } from './entities/node.entity';
import { Route } from '@/route/entities/route.entity';
import { Stop } from '@/stop/entities/stop.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('NodeService', () => {
  let service: NodeService;
  let routeRepo: ReturnType<typeof createMockRepository<Route>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodeService,
        provideMockRepo(Node),
        provideMockRepo(Route),
        provideMockRepo(Stop),
      ],
    }).compile();

    service = module.get(NodeService);
    routeRepo = module.get(getRepositoryToken(Route));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws when route not found', async () => {
    routeRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create('route-id', 'stop-id', { order: 1 }),
    ).rejects.toThrow(NotFoundException);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { Scheduler } from './entities/scheduler.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Route } from '@/route/entities/route.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let busRepo: ReturnType<typeof createMockRepository<Bus>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulerService,
        provideMockRepo(Scheduler),
        provideMockRepo(Bus),
        provideMockRepo(Route),
      ],
    }).compile();

    service = module.get(SchedulerService);
    busRepo = module.get(getRepositoryToken(Bus));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws when bus not found', async () => {
    busRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create({
        busId: 'missing',
        routeId: 'r1',
        departureTime: '08:00',
        arrivalTime: '09:00',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

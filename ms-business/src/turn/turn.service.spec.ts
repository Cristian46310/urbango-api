import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { TurnService } from './turn.service';
import { Turn } from './entities/turn.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('TurnService', () => {
  let service: TurnService;
  let busRepo: ReturnType<typeof createMockRepository<Bus>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurnService,
        provideMockRepo(Turn),
        provideMockRepo(Bus),
        provideMockRepo(Driver),
      ],
    }).compile();

    service = module.get(TurnService);
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
        startTime: new Date().toISOString(),
        status: 'active',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { BusService } from './bus.service';
import { Bus } from './entities/bus.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('BusService', () => {
  let service: BusService;
  let enterpriseRepo: ReturnType<typeof createMockRepository<Enterprise>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusService,
        provideMockRepo(Bus),
        provideMockRepo(Enterprise),
      ],
    }).compile();

    service = module.get(BusService);
    enterpriseRepo = module.get(getRepositoryToken(Enterprise));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws when enterprise not found', async () => {
    enterpriseRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create({
        plate: 'ABC123',
        enterpriseId: 'missing',
        capacity: 40,
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

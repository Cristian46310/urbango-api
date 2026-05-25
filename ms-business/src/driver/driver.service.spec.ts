import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { DriverService } from './driver.service';
import { Driver } from './entities/driver.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('DriverService', () => {
  let service: DriverService;
  let repo: ReturnType<typeof createMockRepository<Driver>>;
  let enterpriseRepo: ReturnType<typeof createMockRepository<Enterprise>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
        provideMockRepo(Driver),
        provideMockRepo(Enterprise),
      ],
    }).compile();

    service = module.get(DriverService);
    repo = module.get(getRepositoryToken(Driver));
    enterpriseRepo = module.get(getRepositoryToken(Enterprise));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create rejects duplicate userId', async () => {
    enterpriseRepo.findOne.mockResolvedValue({ id: 'ent-1' } as Enterprise);
    repo.findOne.mockResolvedValue({ id: 'd1', userId: 'u1' } as Driver);
    await expect(
      service.create({
        userId: 'u1',
        name: 'Driver',
        document: '123',
        phone: '300',
        email: 'd@test.com',
        enterpriseId: 'ent-1',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

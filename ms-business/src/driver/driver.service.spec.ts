import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { DriverService } from './driver.service';
import { Driver } from './entities/driver.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('DriverService', () => {
  let service: DriverService;
  let repo: ReturnType<typeof createMockRepository<Driver>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DriverService, provideMockRepo(Driver)],
    }).compile();

    service = module.get(DriverService);
    repo = module.get(getRepositoryToken(Driver));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create rejects duplicate userId', async () => {
    repo.findOne.mockResolvedValue({ id: 'd1', userId: 'u1' } as Driver);
    await expect(
      service.create({
        userId: 'u1',
        name: 'Driver',
        documentType: 'CC',
        documentNumber: '123',
        phone: '300',
        email: 'd@test.com',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

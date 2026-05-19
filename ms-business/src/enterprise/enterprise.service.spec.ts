import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EnterpriseService } from './enterprise.service';
import { Enterprise } from './entities/enterprise.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('EnterpriseService', () => {
  let service: EnterpriseService;
  let repo: ReturnType<typeof createMockRepository<Enterprise>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnterpriseService, provideMockRepo(Enterprise)],
    }).compile();

    service = module.get(EnterpriseService);
    repo = module.get(getRepositoryToken(Enterprise));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create rejects duplicate NIT', async () => {
    repo.findOne.mockResolvedValue({ id: 'e1', nit: '900' } as Enterprise);
    await expect(
      service.create({ nit: '900', name: 'Test', email: 'a@b.com' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('findOne throws when enterprise not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});

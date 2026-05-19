import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AddressService } from './address.service';
import { Address } from './entities/address.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('AddressService', () => {
  let service: AddressService;
  let repo: ReturnType<typeof createMockRepository<Address>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddressService, provideMockRepo(Address)],
    }).compile();

    service = module.get(AddressService);
    repo = module.get(getRepositoryToken(Address));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne throws NotFoundException when address does not exist', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('findAll returns paginated items', async () => {
    repo.findAndCount.mockResolvedValue([[{ id: 'a1' }], 1]);
    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.meta.totalItems).toBe(1);
  });
});

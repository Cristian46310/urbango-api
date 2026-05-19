import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PaymentMethodService } from './payment-method.service';
import { PaymentMethod } from './entities/payment-method.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('PaymentMethodService', () => {
  let service: PaymentMethodService;
  let repo: ReturnType<typeof createMockRepository<PaymentMethod>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentMethodService, provideMockRepo(PaymentMethod)],
    }).compile();

    service = module.get(PaymentMethodService);
    repo = module.get(getRepositoryToken(PaymentMethod));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findOne throws when payment method not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });
});

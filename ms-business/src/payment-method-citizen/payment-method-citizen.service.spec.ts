import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { PaymentMethodCitizenService } from './payment-method-citizen.service';
import { PaymentMethodCitizen } from './entities/payment-method-citizen.entity';
import { Citizen } from '@/citizen/entities/citizen.entity';
import { PaymentMethod } from '@/payment-method/entities/payment-method.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('PaymentMethodCitizenService', () => {
  let service: PaymentMethodCitizenService;
  let citizenRepo: ReturnType<typeof createMockRepository<Citizen>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodCitizenService,
        provideMockRepo(PaymentMethodCitizen),
        provideMockRepo(Citizen),
        provideMockRepo(PaymentMethod),
      ],
    }).compile();

    service = module.get(PaymentMethodCitizenService);
    citizenRepo = module.get(getRepositoryToken(Citizen));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws when citizen not found', async () => {
    citizenRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create({ citizenId: 'c1', paymentMethodId: 'pm1' }),
    ).rejects.toThrow(BadRequestException);
  });
});

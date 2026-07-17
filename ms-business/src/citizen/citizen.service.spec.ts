import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CitizenService } from './citizen.service';
import { Citizen } from './entities/citizen.entity';
import { Address } from '@/address/entities/address.entity';
import { ProfileRoleOutboxService } from '@/auth/services/profile-role-outbox.service';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('CitizenService', () => {
  let service: CitizenService;
  let citizenRepo: ReturnType<typeof createMockRepository<Citizen>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitizenService,
        provideMockRepo(Citizen),
        provideMockRepo(Address),
        {
          provide: ProfileRoleOutboxService,
          useValue: {
            enqueue: jest.fn(),
            tryProcessSoon: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CitizenService);
    citizenRepo = module.get(getRepositoryToken(Citizen));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create rejects duplicate userId', async () => {
    citizenRepo.findOne.mockResolvedValue({
      id: 'c1',
      userId: 'u1',
    } as Citizen);
    await expect(
      service.create({
        userId: 'u1',
        name: 'Citizen',
        document: '1',
        phone: '300',
        email: 'c@test.com',
      }),
    ).rejects.toThrow(ConflictException);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DriverService } from './driver.service';
import { Driver } from './entities/driver.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { ProfileRoleOutboxService } from '@/auth/services/profile-role-outbox.service';
import {
  SecurityProfileRole,
  SecurityRoleClientService,
} from '@/auth/services/security-role-client.service';
import { UserPhotoStorageService } from '@/user-photo/user-photo-storage.service';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('DriverService', () => {
  let service: DriverService;
  let repo: ReturnType<typeof createMockRepository<Driver>>;
  let enterpriseRepo: ReturnType<typeof createMockRepository<Enterprise>>;
  const profileRoleOutbox = {
    enqueue: jest.fn(),
    tryProcessSoon: jest.fn(),
  };
  const securityRoleClient = {
    assertUserExists: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
        provideMockRepo(Driver),
        provideMockRepo(Enterprise),
        {
          provide: SecurityRoleClientService,
          useValue: securityRoleClient,
        },
        {
          provide: ProfileRoleOutboxService,
          useValue: profileRoleOutbox,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: UserPhotoStorageService,
          useValue: {
            upload: jest.fn(),
            delete: jest.fn(),
            pathFromPublicUrl: jest.fn(),
          },
        },
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

  it('createByAdmin creates the profile and enqueues DRIVER role assignment', async () => {
    const savedDriver = {
      id: 'driver-1',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Driver',
      document: '123',
      email: 'driver@test.com',
      phone: '300',
      enterprise: { id: '550e8400-e29b-41d4-a716-446655440001' },
    } as Driver;
    const transactionalRepo = {
      save: jest.fn().mockResolvedValue(savedDriver),
    };
    const manager = {
      getRepository: jest.fn().mockReturnValue(transactionalRepo),
    };

    enterpriseRepo.findOne.mockResolvedValue(savedDriver.enterprise);
    repo.findOne.mockResolvedValue(null);
    profileRoleOutbox.enqueue.mockResolvedValue({ id: 'outbox-1' });
    dataSource.transaction.mockImplementation(
      async (callback: (entityManager: typeof manager) => Promise<unknown>) =>
        callback(manager),
    );

    await service.createByAdmin({
      userId: savedDriver.userId,
      name: savedDriver.name,
      document: savedDriver.document,
      phone: savedDriver.phone,
      email: savedDriver.email,
      enterpriseId: savedDriver.enterprise.id,
    });

    expect(profileRoleOutbox.enqueue).toHaveBeenCalledWith(manager, {
      userId: savedDriver.userId,
      profileId: savedDriver.id,
      profileType: 'driver',
      role: SecurityProfileRole.DRIVER,
    });
    expect(securityRoleClient.assertUserExists).toHaveBeenCalledWith(
      savedDriver.userId,
    );
    expect(profileRoleOutbox.tryProcessSoon).toHaveBeenCalledWith('outbox-1');
  });

  it('createByAdmin does not create a profile for an unknown security user', async () => {
    securityRoleClient.assertUserExists.mockRejectedValue(
      new Error('User not found'),
    );

    await expect(
      service.createByAdmin({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Driver',
        document: '123',
        phone: '300',
        email: 'driver@test.com',
        enterpriseId: '550e8400-e29b-41d4-a716-446655440001',
      }),
    ).rejects.toThrow('User not found');

    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(profileRoleOutbox.enqueue).not.toHaveBeenCalled();
  });
});

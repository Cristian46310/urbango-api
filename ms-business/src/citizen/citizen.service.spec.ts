import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CitizenService } from './citizen.service';
import { Citizen } from './entities/citizen.entity';
import { Address } from '@/address/entities/address.entity';
import { ProfileRoleOutboxService } from '@/auth/services/profile-role-outbox.service';
import { UserPhotoStorageService } from '@/user-photo/user-photo-storage.service';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('CitizenService', () => {
  let service: CitizenService;
  let citizenRepo: ReturnType<typeof createMockRepository<Citizen>>;
  let transactionalCitizenRepo: ReturnType<
    typeof createMockRepository<Citizen>
  >;
  let transactionalAddressRepo: ReturnType<
    typeof createMockRepository<Address>
  >;
  const profileRoleOutbox = {
    enqueue: jest.fn(),
    tryProcessSoon: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    transactionalCitizenRepo = createMockRepository<Citizen>();
    transactionalAddressRepo = createMockRepository<Address>();
    const manager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Citizen
          ? transactionalCitizenRepo
          : transactionalAddressRepo,
      ),
    };
    dataSource.transaction.mockImplementation(
      (callback: (transactionManager: typeof manager) => unknown) =>
        Promise.resolve(callback(manager)),
    );
    profileRoleOutbox.enqueue.mockResolvedValue({ id: 'outbox-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitizenService,
        provideMockRepo(Citizen),
        provideMockRepo(Address),
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

  it('creates nested address, citizen and outbox in one transaction', async () => {
    const address = {
      id: 'address-1',
      address: 'Calle 10 #20-30',
      city: 'Manizales',
      createdAt: new Date(),
    };
    const citizen = {
      id: 'citizen-1',
      userId: 'user-1',
      name: 'Citizen',
      document: '1',
      email: 'c@test.com',
      phone: '300',
      address,
      createdAt: new Date(),
    } as Citizen;

    transactionalAddressRepo.save.mockResolvedValue(address);
    transactionalCitizenRepo.save.mockResolvedValue(citizen);

    const result = await service.create({
      userId: citizen.userId,
      name: citizen.name,
      document: citizen.document,
      phone: citizen.phone,
      email: citizen.email,
      address: {
        address: address.address,
        city: address.city,
      },
    });

    expect(transactionalAddressRepo.create.mock.calls[0]?.[0]).toEqual({
      address: address.address,
      city: address.city,
    });
    expect(profileRoleOutbox.enqueue).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        userId: citizen.userId,
        profileId: citizen.id,
        profileType: 'citizen',
      }),
    );
    expect(profileRoleOutbox.tryProcessSoon).toHaveBeenCalledWith('outbox-1');
    expect(result.addressId).toBe(address.id);
    expect(result.address?.city).toBe(address.city);
  });

  it('keeps legacy addressId creation compatible', async () => {
    const address = {
      id: 'address-1',
      address: 'Carrera 1',
      city: 'Manizales',
    } as Address;
    const citizen = {
      id: 'citizen-1',
      userId: 'user-1',
      name: 'Citizen',
      document: '1',
      address,
    } as Citizen;
    transactionalAddressRepo.findOne.mockResolvedValue(address);
    transactionalCitizenRepo.save.mockResolvedValue(citizen);

    const result = await service.create({
      userId: citizen.userId,
      name: citizen.name,
      document: citizen.document,
      addressId: address.id,
    });

    expect(transactionalAddressRepo.findOne.mock.calls[0]?.[0]).toEqual({
      where: { id: address.id },
    });
    expect(transactionalAddressRepo.save.mock.calls).toHaveLength(0);
    expect(result.addressId).toBe(address.id);
  });

  it('rejects address and addressId together before starting a transaction', async () => {
    await expect(
      service.create({
        userId: 'user-1',
        name: 'Citizen',
        document: '1',
        addressId: 'address-1',
        address: { address: 'Calle 1', city: 'Manizales' },
      }),
    ).rejects.toThrow(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('does not process the outbox when the transactional enqueue fails', async () => {
    transactionalAddressRepo.save.mockResolvedValue({
      id: 'address-1',
      address: 'Calle 1',
      city: 'Manizales',
    } as Address);
    transactionalCitizenRepo.save.mockResolvedValue({
      id: 'citizen-1',
    } as Citizen);
    profileRoleOutbox.enqueue.mockRejectedValue(new Error('outbox failed'));

    await expect(
      service.create({
        userId: 'user-1',
        name: 'Citizen',
        document: '1',
        address: { address: 'Calle 1', city: 'Manizales' },
      }),
    ).rejects.toThrow('outbox failed');

    expect(profileRoleOutbox.tryProcessSoon).not.toHaveBeenCalled();
  });

  it('uses copy-on-write when updating a shared legacy address', async () => {
    const currentAddress = {
      id: 'shared-address',
      address: 'Calle vieja',
      city: 'Manizales',
    } as Address;
    const copiedAddress = {
      id: 'new-address',
      address: 'Calle nueva',
      city: 'Pereira',
    } as Address;
    const citizen = {
      id: 'citizen-1',
      address: currentAddress,
    } as Citizen;
    transactionalCitizenRepo.findOne.mockResolvedValue(citizen);
    transactionalCitizenRepo.count.mockResolvedValue(2);
    transactionalAddressRepo.save.mockResolvedValue(copiedAddress);
    transactionalCitizenRepo.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );

    const result = await service.update(citizen.id, {
      address: {
        address: copiedAddress.address,
        city: copiedAddress.city,
      },
    });

    expect(transactionalAddressRepo.create.mock.calls[0]?.[0]).toEqual({
      address: copiedAddress.address,
      city: copiedAddress.city,
    });
    expect(citizen.address).toBe(copiedAddress);
    expect(result.addressId).toBe(copiedAddress.id);
  });

  it('preserves the current address when update omits address fields', async () => {
    const address = {
      id: 'address-1',
      address: 'Calle 1',
      city: 'Manizales',
    } as Address;
    const citizen = {
      id: 'citizen-1',
      name: 'Old name',
      address,
    } as Citizen;
    transactionalCitizenRepo.findOne.mockResolvedValue(citizen);
    transactionalCitizenRepo.save.mockImplementation((entity) =>
      Promise.resolve(entity),
    );

    const result = await service.update(citizen.id, { name: 'New name' });

    expect(citizen.address).toBe(address);
    expect(result.addressId).toBe(address.id);
    expect(result.name).toBe('New name');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IncidentService } from './incident.service';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { IncidentPhoto } from './entities/incident-photo.entity';
import { IncidentComment } from './entities/incident-comment.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { IncidentStorageService } from './incident-storage.service';
import { IncidentNotificationService } from './incident-notification.service';
import { IncidentStatus } from './enums/incident.enum';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('IncidentService', () => {
  let service: IncidentService;
  let incidentRepo: ReturnType<typeof createMockRepository<Incident>>;
  let driverRepo: ReturnType<typeof createMockRepository<Driver>>;

  const mockStorage = { uploadMany: jest.fn() };
  const mockNotification = { notifySupervisorIfNeeded: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentService,
        provideMockRepo(Incident),
        provideMockRepo(IncidentBus),
        provideMockRepo(IncidentPhoto),
        provideMockRepo(IncidentComment),
        provideMockRepo(Bus),
        provideMockRepo(Turn),
        provideMockRepo(Driver),
        provideMockRepo(Enterprise),
        { provide: IncidentStorageService, useValue: mockStorage },
        { provide: IncidentNotificationService, useValue: mockNotification },
      ],
    }).compile();

    service = module.get(IncidentService);
    incidentRepo = module.get(getRepositoryToken(Incident));
    driverRepo = module.get(getRepositoryToken(Driver));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('updateStatus rejects invalid transition', async () => {
    incidentRepo.findOne.mockResolvedValue({
      id: 'i1',
      status: IncidentStatus.CLOSED,
      driver: { id: 'd1', name: 'Driver' },
      incidentBuses: [],
    } as Incident);

    await expect(
      service.updateStatus('i1', { status: IncidentStatus.REPORTED }),
    ).rejects.toThrow(BadRequestException);
  });

  it('createByDriver throws when driver profile missing', async () => {
    driverRepo.findOne.mockResolvedValue(null);
    await expect(
      service.createByDriver(
        {
          id: 'u1',
          name: 'U',
          email: 'u@test.com',
          roles: ['DRIVER'],
          createdAt: 1,
        },
        { type: 'mechanical', severity: 'low', description: 'x' } as never,
        [],
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('createByDriver rejects more than 5 photos', async () => {
    driverRepo.findOne.mockResolvedValue({ id: 'd1' } as Driver);
    const photos = Array.from({ length: 6 }, (_, i) => ({
      buffer: Buffer.from(''),
      originalname: `p${i}.jpg`,
      mimetype: 'image/jpeg',
      size: 1,
    }));
    await expect(
      service.createByDriver(
        {
          id: 'u1',
          name: 'U',
          email: 'u@test.com',
          roles: ['DRIVER'],
          createdAt: 1,
        },
        { type: 'mechanical', severity: 'low', description: 'x' } as never,
        photos,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

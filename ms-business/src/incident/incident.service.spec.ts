import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IncidentService } from './incident.service';
import { Incident } from './entities/incident.entity';
import { IncidentBus } from './entities/incident-bus.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { Turn } from '@/turn/entities/turn.entity';
import { Driver } from '@/driver/entities/driver.entity';
import { IncidentNotificationService } from './incident-notification.service';
import { IncidentPhotoService } from '@/incident-photo/incident-photo.service';
import { IncidentStatus } from './enums/incident.enum';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('IncidentService', () => {
  let service: IncidentService;
  let incidentRepo: ReturnType<typeof createMockRepository<Incident>>;
  let driverRepo: ReturnType<typeof createMockRepository<Driver>>;

  const mockPhotoService = { attachPhotos: jest.fn() };
  const mockNotification = { notifySupervisorIfNeeded: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentService,
        provideMockRepo(Incident),
        provideMockRepo(IncidentBus),
        provideMockRepo(Bus),
        provideMockRepo(Turn),
        provideMockRepo(Driver),
        { provide: IncidentPhotoService, useValue: mockPhotoService },
        { provide: IncidentNotificationService, useValue: mockNotification },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
            query: jest.fn().mockResolvedValue([]),
          },
        },
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
});

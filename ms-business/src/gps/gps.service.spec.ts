import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GpsService } from './gps.service';
import { Gps } from './entities/gps.entity';
import { Bus } from '@/bus/entities/bus.entity';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockRepository } from '@/test/helpers/typeorm-mocks';

describe('GpsService', () => {
  let service: GpsService;
  let gpsRepo: ReturnType<typeof createMockRepository<Gps>>;
  let busRepo: ReturnType<typeof createMockRepository<Bus>> & {
    update: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GpsService, provideMockRepo(Gps), provideMockRepo(Bus)],
    }).compile();

    service = module.get(GpsService);
    gpsRepo = module.get(getRepositoryToken(Gps));
    busRepo = module.get(getRepositoryToken(Bus));
    busRepo.update = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create throws when bus not found', async () => {
    busRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create('bus-1', { latitude: 1, longitude: 1 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('create throws when bus already has GPS', async () => {
    busRepo.findOne.mockResolvedValue({ id: 'bus-1' } as Bus);
    gpsRepo.findOne.mockResolvedValue({ id: 'gps-1' } as Gps);
    await expect(
      service.create('bus-1', { latitude: 1, longitude: 1 }),
    ).rejects.toThrow(ConflictException);
  });

  it('upsertBusPosition updates existing GPS without writing Bus.gps', async () => {
    const bus = { id: 'bus-1' } as Bus;
    const existing = {
      id: 'gps-1',
      latitude: 1,
      longitude: 1,
      bus,
      updatedAt: new Date(),
    } as Gps;

    busRepo.findOne.mockResolvedValue(bus);
    gpsRepo.findOne.mockResolvedValue(existing);
    gpsRepo.save.mockImplementation((entity: Gps) => Promise.resolve(entity));

    const result = await service.upsertBusPosition('bus-1', 5.07, -75.51);

    expect(gpsRepo.save.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        latitude: 5.07,
        longitude: -75.51,
      }),
    );
    expect(busRepo.update.mock.calls).toHaveLength(0);
    expect(result).toEqual(
      expect.objectContaining({
        id: 'gps-1',
        busId: 'bus-1',
        latitude: 5.07,
        longitude: -75.51,
      }),
    );
  });

  it('create saves GPS linked by busId without writing Bus.gps', async () => {
    const bus = { id: 'bus-1' } as Bus;
    busRepo.findOne.mockResolvedValue(bus);
    gpsRepo.findOne.mockResolvedValue(null);
    gpsRepo.create.mockImplementation((data: Partial<Gps>) => data as Gps);
    gpsRepo.save.mockImplementation((entity: Gps) =>
      Promise.resolve({
        ...entity,
        id: 'gps-new',
        bus,
      }),
    );

    const result = await service.create('bus-1', {
      latitude: 5.1,
      longitude: -75.5,
    });

    expect(gpsRepo.save.mock.calls).toHaveLength(1);
    expect(busRepo.update.mock.calls).toHaveLength(0);
    expect(result).toEqual(
      expect.objectContaining({
        id: 'gps-new',
        busId: 'bus-1',
        latitude: 5.1,
        longitude: -75.5,
      }),
    );
  });
});

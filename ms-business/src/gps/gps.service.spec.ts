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
  let busRepo: ReturnType<typeof createMockRepository<Bus>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GpsService, provideMockRepo(Gps), provideMockRepo(Bus)],
    }).compile();

    service = module.get(GpsService);
    gpsRepo = module.get(getRepositoryToken(Gps));
    busRepo = module.get(getRepositoryToken(Bus));
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
});

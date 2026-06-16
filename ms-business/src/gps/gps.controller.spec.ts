import { Test, TestingModule } from '@nestjs/testing';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';

describe('GpsController', () => {
  let controller: GpsController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByBusId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GpsController],
      providers: [{ provide: GpsService, useValue: mockService }],
    }).compile();

    controller = module.get(GpsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates create to GpsService with busId', async () => {
    mockService.create.mockResolvedValue({ id: 'gps-1' });
    await controller.create('bus-1', { latitude: 1, longitude: 2 });
    expect(mockService.create).toHaveBeenCalledWith('bus-1', {
      latitude: 1,
      longitude: 2,
    });
  });
});

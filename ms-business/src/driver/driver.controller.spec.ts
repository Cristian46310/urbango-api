import { Test, TestingModule } from '@nestjs/testing';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';

describe('DriverController', () => {
  let controller: DriverController;
  const mockService = {
    create: jest.fn(),
    createByAdmin: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverController],
      providers: [{ provide: DriverService, useValue: mockService }],
    }).compile();

    controller = module.get<DriverController>(DriverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a driver for the user selected by an admin', () => {
    const dto = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      enterpriseId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Driver',
      document: '123',
      email: 'driver@test.com',
      phone: '300',
    };

    void controller.createByAdmin(dto);

    expect(mockService.createByAdmin).toHaveBeenCalledWith(dto);
  });
});

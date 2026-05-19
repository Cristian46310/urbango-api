import { Test, TestingModule } from '@nestjs/testing';
import { EnterpriseController } from './enterprise.controller';
import { EnterpriseService } from './enterprise.service';

describe('EnterpriseController', () => {
  let controller: EnterpriseController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnterpriseController],
      providers: [{ provide: EnterpriseService, useValue: mockService }],
    }).compile();

    controller = module.get<EnterpriseController>(EnterpriseController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates findOne to EnterpriseService', async () => {
    mockService.findOne.mockResolvedValue({ id: 'e1' });
    await controller.findOne('e1');
    expect(mockService.findOne).toHaveBeenCalledWith('e1');
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';

describe('IncidentController', () => {
  let controller: IncidentController;
  const mockService = {
    listByBus: jest.fn(),
    getStatistics: jest.fn(),
    createByDriver: jest.fn(),
    listComments: jest.fn(),
    addComment: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentController],
      providers: [{ provide: IncidentService, useValue: mockService }],
    }).compile();

    controller = module.get<IncidentController>(IncidentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates updateStatus to IncidentService', async () => {
    mockService.updateStatus.mockResolvedValue({ id: 'i1' });
    await controller.updateStatus('i1', { status: 'in_review' });
    expect(mockService.updateStatus).toHaveBeenCalledWith('i1', {
      status: 'in_review',
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TurnController } from './turn.controller';
import { TurnService } from './turn.service';
import { ProfileContextService } from '@/auth/services/profile-context.service';

describe('TurnController', () => {
  let controller: TurnController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurnController],
      providers: [
        {
          provide: TurnService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            startTurn: jest.fn(),
            endTurn: jest.fn(),
            getCurrentTurn: jest.fn(),
            updateGpsPosition: jest.fn(),
          },
        },
        {
          provide: ProfileContextService,
          useValue: { requireDriverId: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<TurnController>(TurnController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

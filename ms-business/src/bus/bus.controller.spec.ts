import { Test, TestingModule } from '@nestjs/testing';
import { BusController } from './bus.controller';
import { BusService } from './bus.service';
import { BusPhotoService } from '@/bus-photo/bus-photo.service';

describe('BusController', () => {
  let controller: BusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusController],
      providers: [
        {
          provide: BusService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            resolveEnterpriseIdForUser: jest.fn(),
            assertBusBelongsToEnterprise: jest.fn(),
          },
        },
        {
          provide: BusPhotoService,
          useValue: {
            upsertForBus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BusController>(BusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

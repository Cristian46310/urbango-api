import { Test, TestingModule } from '@nestjs/testing';
import { CitizenController } from './citizen.controller';
import { CitizenService } from './citizen.service';

describe('CitizenController', () => {
  let controller: CitizenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CitizenController],
      providers: [
        {
          provide: CitizenService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CitizenController>(CitizenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

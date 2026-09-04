import { Test, TestingModule } from '@nestjs/testing';
import { CitizenController } from './citizen.controller';
import { CitizenService } from './citizen.service';

describe('CitizenController', () => {
  let controller: CitizenController;
  const citizenService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CitizenController],
      providers: [
        {
          provide: CitizenService,
          useValue: citizenService,
        },
      ],
    }).compile();

    controller = module.get<CitizenController>(CitizenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates nested address creation with the authenticated user id', () => {
    const dto = {
      name: 'Citizen',
      document: '1',
      address: {
        address: 'Calle 10 #20-30',
        city: 'Manizales',
      },
    };

    void controller.create(dto, {
      id: 'user-1',
      name: 'Citizen',
      email: 'citizen@test.com',
      roles: ['CITIZEN'],
      createdAt: Date.now(),
    });

    expect(citizenService.create).toHaveBeenCalledWith({
      ...dto,
      userId: 'user-1',
    });
  });
});

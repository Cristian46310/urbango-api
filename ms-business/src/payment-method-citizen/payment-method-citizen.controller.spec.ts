import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodCitizenController } from './payment-method-citizen.controller';
import { PaymentMethodCitizenService } from './payment-method-citizen.service';

describe('PaymentMethodCitizenController', () => {
  let controller: PaymentMethodCitizenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentMethodCitizenController],
      providers: [
        {
          provide: PaymentMethodCitizenService,
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

    controller = module.get(PaymentMethodCitizenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

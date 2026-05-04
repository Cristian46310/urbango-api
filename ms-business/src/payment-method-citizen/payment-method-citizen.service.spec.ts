import { Test, TestingModule } from '@nestjs/testing';
import { PaymentMethodCitizenService } from './payment-method-citizen.service';

describe('PaymentMethodCitizenService', () => {
  let service: PaymentMethodCitizenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentMethodCitizenService],
    }).compile();

    service = module.get<PaymentMethodCitizenService>(
      PaymentMethodCitizenService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

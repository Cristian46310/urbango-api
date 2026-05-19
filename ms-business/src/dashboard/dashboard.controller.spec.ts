import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { IncidentTrendByTypeService } from './services/incident-trend-by-type.service';
import { PaymentMethodIncomeService } from './services/payment-method-income.service';

describe('DashboardController', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: IncidentTrendByTypeService,
          useValue: { getIncidentTrendByType: jest.fn() },
        },
        {
          provide: PaymentMethodIncomeService,
          useValue: { getPaymentMethodIncome: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

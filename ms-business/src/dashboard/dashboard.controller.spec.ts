import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { IncidentTrendByTypeService } from './services/incident-trend-by-type.service';
import { PaymentMethodIncomeService } from './services/payment-method-income.service';
import { PassengerAgeDistributionService } from './services/passenger-age-distribution.service';
import { DashboardRealtimeService } from './services/dashboard-realtime.service';

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
        {
          provide: PassengerAgeDistributionService,
          useValue: { getAgeDistribution: jest.fn() },
        },
        {
          provide: DashboardRealtimeService,
          useValue: {
            getDashboardSummary: jest.fn(),
            getRealtimeFleet: jest.fn(),
            getActiveIncidents: jest.fn(),
            getBusRealtimeStatus: jest.fn(),
            sendArrivalNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates realtime summary to DashboardRealtimeService', async () => {
    const summary = { totalPassengersInTransit: 5 };
    const service = controller['dashboardRealtimeService'] as {
      getDashboardSummary: jest.Mock;
    };
    service.getDashboardSummary.mockResolvedValue(summary);

    await expect(controller.getRealtimeSummary('ent-1')).resolves.toBe(summary);
    expect(service.getDashboardSummary).toHaveBeenCalledWith('ent-1');
  });
});

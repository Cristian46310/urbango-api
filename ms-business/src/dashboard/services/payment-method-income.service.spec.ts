import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentMethodIncomeService } from './payment-method-income.service';
import { Ticket } from '@/ticket/entities/ticket.entity';
import { DashboardPeriodService } from './dashboard-period.service';
import { DashboardExportService } from './dashboard-export.service';
import { Repository } from 'typeorm';
import { provideMockRepo } from '@/test/helpers/repository-provider';
import { createMockQueryBuilder } from '@/test/helpers/typeorm-mocks';

describe('PaymentMethodIncomeService', () => {
  let service: PaymentMethodIncomeService;
  let ticketRepo: jest.Mocked<Repository<Ticket>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentMethodIncomeService,
        provideMockRepo(Ticket),
        DashboardPeriodService,
        DashboardExportService,
      ],
    }).compile();

    service = module.get(PaymentMethodIncomeService);
    ticketRepo = module.get(getRepositoryToken(Ticket));
    const qb = createMockQueryBuilder();
    qb.getRawMany.mockResolvedValue([]);
    ticketRepo.createQueryBuilder.mockReturnValue(qb);
  });

  it('returns empty datasets when no ticket rows', async () => {
    const result = await service.getPaymentMethodIncome();
    expect(result.labels.length).toBeGreaterThan(0);
    expect(result.datasets).toEqual([]);
  });
});

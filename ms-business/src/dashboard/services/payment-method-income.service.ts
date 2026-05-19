import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Ticket, TicketStatus } from '@/ticket/entities/ticket.entity';
import { DashboardPeriodMonths } from '../enums/dashboard-period-months.enum';
import { DashboardPeriodService } from './dashboard-period.service';
import { DashboardExportService } from './dashboard-export.service';
import { ResponsePaymentMethodIncomeDto } from '../dto/response-payment-method-income.dto';
import { PaymentMethodIncomeDatasetDto } from '../dto/payment-method-income-dataset.dto';

type IncomeAggregateRow = {
  month: string;
  paymentMethodId: string;
  paymentMethodName: string;
  income: string;
};

@Injectable()
export class PaymentMethodIncomeService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly periodService: DashboardPeriodService,
    private readonly exportService: DashboardExportService,
  ) {}

  async getPaymentMethodIncome(
    months: DashboardPeriodMonths = DashboardPeriodMonths.SIX,
  ): Promise<ResponsePaymentMethodIncomeDto> {
    const range = this.periodService.resolveRange(months);
    const labels = this.periodService.buildMonthLabels(range.from, range.to);

    const rows = await this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.paymentMethodCitizen', 'pmc')
      .innerJoin('pmc.paymentMethod', 'pm')
      .where('ticket.status = :status', { status: TicketStatus.COMPLETED })
      .andWhere('ticket.completedAt >= :from', { from: range.from })
      .andWhere('ticket.completedAt < :to', { to: range.to })
      .andWhere('ticket.amount > 0')
      .select(
        "TO_CHAR(DATE_TRUNC('month', ticket.completedAt), 'YYYY-MM')",
        'month',
      )
      .addSelect('pm.id', 'paymentMethodId')
      .addSelect('pm.name', 'paymentMethodName')
      .addSelect('SUM(ticket.amount)', 'income')
      .groupBy("DATE_TRUNC('month', ticket.completedAt)")
      .addGroupBy('pm.id')
      .addGroupBy('pm.name')
      .getRawMany<IncomeAggregateRow>();

    const excludedTicketsCount = await this.countExcludedTickets(
      range.from,
      range.to,
    );

    const methodMap = new Map<
      string,
      { id: string; name: string; byMonth: Map<string, number> }
    >();

    for (const row of rows) {
      const income = Number(row.income);
      let method = methodMap.get(row.paymentMethodId);
      if (!method) {
        method = {
          id: row.paymentMethodId,
          name: row.paymentMethodName,
          byMonth: new Map(),
        };
        methodMap.set(row.paymentMethodId, method);
      }
      method.byMonth.set(row.month, income);
    }

    const datasets: PaymentMethodIncomeDatasetDto[] = [];
    let grandTotal = 0;

    for (const method of methodMap.values()) {
      const data = labels.map((label) => method.byMonth.get(label) ?? 0);
      const totalIncome = data.reduce((sum, value) => sum + value, 0);
      grandTotal += totalIncome;
      datasets.push(
        plainToInstance(
          PaymentMethodIncomeDatasetDto,
          {
            paymentMethodId: method.id,
            paymentMethodName: method.name,
            data,
            totalIncome,
          },
          { excludeExtraneousValues: true },
        ),
      );
    }

    datasets.sort((a, b) =>
      a.paymentMethodName.localeCompare(b.paymentMethodName),
    );

    return plainToInstance(
      ResponsePaymentMethodIncomeDto,
      {
        period: {
          months: range.months,
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        },
        labels,
        datasets,
        grandTotal,
        excludedTicketsCount,
      },
      { excludeExtraneousValues: true },
    );
  }

  async exportPaymentMethodIncomeCsv(
    months: DashboardPeriodMonths = DashboardPeriodMonths.SIX,
  ): Promise<string> {
    const report = await this.getPaymentMethodIncome(months);
    const headers = [
      'month',
      'payment_method_name',
      'payment_method_id',
      'income',
    ];
    const rows: string[][] = [];

    for (let i = 0; i < report.labels.length; i++) {
      const month = report.labels[i];
      for (const dataset of report.datasets) {
        rows.push([
          month,
          dataset.paymentMethodName,
          dataset.paymentMethodId,
          String(dataset.data[i]),
        ]);
      }
    }

    return this.exportService.toCsv(headers, rows);
  }

  private async countExcludedTickets(from: Date, to: Date): Promise<number> {
    return this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoin('ticket.paymentMethodCitizen', 'pmc')
      .where('ticket.status = :status', { status: TicketStatus.COMPLETED })
      .andWhere('ticket.completedAt >= :from', { from })
      .andWhere('ticket.completedAt < :to', { to })
      .andWhere('(pmc.id IS NULL OR ticket.amount <= 0)')
      .getCount();
  }
}

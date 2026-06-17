             import { Injectable } from '@nestjs/common';
import { DashboardPeriodMonths } from '../enums/dashboard-period-months.enum';

export type DashboardDateRange = {
  months: DashboardPeriodMonths;
  from: Date;
  to: Date;
};

@Injectable()
export class DashboardPeriodService {
  /**
   * Rango [from, to) en UTC: últimos N meses calendario incluyendo el mes actual.
   */
  resolveRange(months: DashboardPeriodMonths): DashboardDateRange {
    const now = new Date();
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1),
    );
    return { months, from, to };
  }

  buildMonthLabels(from: Date, to: Date): string[] {
    const labels: string[] = [];
    const cursor = new Date(from.getTime());
    while (cursor < to) {
      const year = cursor.getUTCFullYear();
      const month = String(cursor.getUTCMonth() + 1).padStart(2, '0');
      labels.push(`${year}-${month}`);
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return labels;
  }
}

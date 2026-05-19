import { DashboardPeriodService } from './dashboard-period.service';
import { DashboardPeriodMonths } from '../enums/dashboard-period-months.enum';

describe('DashboardPeriodService', () => {
  let service: DashboardPeriodService;

  beforeEach(() => {
    service = new DashboardPeriodService();
  });

  it('resolveRange returns UTC month boundaries', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-15T12:00:00Z'));

    const range = service.resolveRange(DashboardPeriodMonths.THREE);
    expect(range.months).toBe(DashboardPeriodMonths.THREE);
    expect(range.from.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    expect(range.to.toISOString()).toBe('2026-06-01T00:00:00.000Z');

    jest.useRealTimers();
  });

  it('buildMonthLabels lists months in range', () => {
    const from = new Date(Date.UTC(2026, 0, 1));
    const to = new Date(Date.UTC(2026, 3, 1));
    expect(service.buildMonthLabels(from, to)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
    ]);
  });
});

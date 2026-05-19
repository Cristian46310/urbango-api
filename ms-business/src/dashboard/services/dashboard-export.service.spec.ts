import { DashboardExportService } from './dashboard-export.service';

describe('DashboardExportService', () => {
  let service: DashboardExportService;

  beforeEach(() => {
    service = new DashboardExportService();
  });

  it('escapes CSV values with commas and quotes', () => {
    const csv = service.toCsv(['name', 'note'], [['Bus "A"', 'line, two']]);
    expect(csv).toContain('"Bus ""A"""');
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });
});

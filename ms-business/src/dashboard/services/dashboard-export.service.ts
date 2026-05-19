import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardExportService {
  toCsv(headers: string[], rows: string[][]): string {
    const escape = (value: string) => {
      if (/[",\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const lines = [
      headers.map(escape).join(','),
      ...rows.map((row) => row.map(escape).join(',')),
    ];
    return `\uFEFF${lines.join('\n')}`;
  }
}

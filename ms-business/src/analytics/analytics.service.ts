import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '@/ticket/entities/ticket.entity';
import { AgeDistributionQueryDto } from './dto/age-distribution-query.dto';
import {
  AgeDistributionResponseDto,
  AgeSegmentDto,
} from './dto/age-distribution-response.dto';

type AgeBucketKey =
  | 'minors'
  | 'young'
  | 'youngAdults'
  | 'adults'
  | 'olderAdults'
  | 'unknown';

type DateRange = {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
};

type AgeBucketDefinition = {
  key: AgeBucketKey;
  name: string;
  color: string;
};

const AGE_BUCKETS: AgeBucketDefinition[] = [
  { key: 'minors', name: 'Menores (0-17)', color: '#FF6384' },
  { key: 'young', name: 'Jovenes (18-25)', color: '#36A2EB' },
  { key: 'youngAdults', name: 'Adultos jovenes (26-40)', color: '#FFCE56' },
  { key: 'adults', name: 'Adultos (41-60)', color: '#4BC0C0' },
  { key: 'olderAdults', name: 'Adultos mayores (60+)', color: '#9966FF' },
  { key: 'unknown', name: 'Sin informacion', color: '#C9CBCF' },
];

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async getAgeDistribution(
    query: AgeDistributionQueryDto,
  ): Promise<AgeDistributionResponseDto> {
    const currentRange = this.resolveDateRange(query);
    const previousRange = this.getPreviousMonthRange(currentRange);

    const [currentCounts, previousCounts] = await Promise.all([
      this.getCountsByRange(currentRange, query.routeId),
      this.getCountsByRange(previousRange, query.routeId),
    ]);

    const totalPassengers = this.sumCounts(currentCounts);
    const segments = AGE_BUCKETS.map((bucket) =>
      this.buildSegment(bucket, currentCounts, previousCounts, totalPassengers),
    );

    return {
      segments,
      predominantSegment: this.getPredominantSegment(segments),
      totalPassengers,
      filterApplied: {
        routeId: query.routeId,
        startDate: currentRange.startDate,
        endDate: currentRange.endDate,
      },
    };
  }

  async exportAgeDistributionAsExcel(query: AgeDistributionQueryDto) {
    const distribution = await this.getAgeDistribution(query);
    const rows = [
      ['Rango etario', 'Cantidad de pasajeros', 'Porcentaje', 'Variacion vs mes anterior'],
      ...distribution.segments.map((segment) => [
        segment.name,
        segment.count.toString(),
        segment.percentage.toString(),
        segment.variationVsPreviousMonth === null
          ? ''
          : segment.variationVsPreviousMonth.toString(),
      ]),
    ];

    const worksheet = this.buildExcelCompatibleXml('Distribucion etaria', rows);
    const buffer = Buffer.from(worksheet, 'utf8');

    return {
      buffer,
      filename: `age-distribution-${distribution.filterApplied.startDate}-${distribution.filterApplied.endDate}.xls`,
    };
  }

  private async getCountsByRange(
    range: DateRange,
    routeId?: string,
  ): Promise<Record<AgeBucketKey, number>> {
    const counts = this.emptyCounts();
    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.citizen', 'citizen')
      .leftJoin('ticket.scheduler', 'scheduler')
      .leftJoin('scheduler.route', 'route')
      .where('ticket.boardedAt BETWEEN :startDate AND :endDate', {
        startDate: range.start,
        endDate: range.end,
      });

    if (routeId) {
      queryBuilder.andWhere('route.id = :routeId', { routeId });
    }

    const tickets = await queryBuilder.getMany();

    for (const ticket of tickets) {
      const bucketKey = this.getBucketKey(ticket.citizen?.birthDate, ticket.boardedAt);
      counts[bucketKey] += 1;
    }

    return counts;
  }

  private getBucketKey(birthDate?: Date, travelDate?: Date): AgeBucketKey {
    if (!birthDate || !travelDate) return 'unknown';

    const age = this.calculateAge(new Date(birthDate), new Date(travelDate));

    if (age < 18) return 'minors';
    if (age <= 25) return 'young';
    if (age <= 40) return 'youngAdults';
    if (age <= 60) return 'adults';
    return 'olderAdults';
  }

  private calculateAge(birthDate: Date, referenceDate: Date): number {
    let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
    const monthDifference = referenceDate.getUTCMonth() - birthDate.getUTCMonth();
    const dayDifference = referenceDate.getUTCDate() - birthDate.getUTCDate();

    if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
      age -= 1;
    }

    return Math.max(age, 0);
  }

  private buildSegment(
    bucket: AgeBucketDefinition,
    currentCounts: Record<AgeBucketKey, number>,
    previousCounts: Record<AgeBucketKey, number>,
    totalPassengers: number,
  ): AgeSegmentDto {
    const count = currentCounts[bucket.key];
    const previousCount = previousCounts[bucket.key];
    const percentage =
      totalPassengers === 0 ? 0 : this.round((count / totalPassengers) * 100, 1);

    return {
      name: bucket.name,
      count,
      percentage,
      variationVsPreviousMonth:
        previousCount === 0
          ? null
          : this.round(((count - previousCount) / previousCount) * 100, 1),
      color: bucket.color,
    };
  }

  private getPredominantSegment(segments: AgeSegmentDto[]): string {
    return segments.reduce((predominant, current) =>
      current.count > predominant.count ? current : predominant,
    ).name;
  }

  private resolveDateRange(query: AgeDistributionQueryDto): DateRange {
    if ((query.startDate && !query.endDate) || (!query.startDate && query.endDate)) {
      throw new BadRequestException('startDate and endDate must be provided together');
    }

    if (query.startDate && query.endDate) {
      const start = this.parseStartOfDay(query.startDate);
      const end = this.parseEndOfDay(query.endDate);

      if (start > end) {
        throw new BadRequestException('startDate must be before or equal to endDate');
      }

      return {
        start,
        end,
        startDate: query.startDate,
        endDate: query.endDate,
      };
    }

    const now = new Date();
    const firstDayCurrentMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const firstDayPreviousMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const lastDayPreviousMonth = new Date(firstDayCurrentMonth.getTime() - 1);

    return {
      start: firstDayPreviousMonth,
      end: lastDayPreviousMonth,
      startDate: this.formatDate(firstDayPreviousMonth),
      endDate: this.formatDate(lastDayPreviousMonth),
    };
  }

  private getPreviousMonthRange(range: DateRange): DateRange {
    const start = this.shiftMonth(range.start, -1);
    const end = this.shiftMonth(range.end, -1);

    return {
      start,
      end,
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
    };
  }

  private shiftMonth(date: Date, months: number): Date {
    const shifted = new Date(date.getTime());
    shifted.setUTCMonth(shifted.getUTCMonth() + months);
    return shifted;
  }

  private parseStartOfDay(date: string): Date {
    return new Date(`${date}T00:00:00.000Z`);
  }

  private parseEndOfDay(date: string): Date {
    return new Date(`${date}T23:59:59.999Z`);
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private emptyCounts(): Record<AgeBucketKey, number> {
    return {
      minors: 0,
      young: 0,
      youngAdults: 0,
      adults: 0,
      olderAdults: 0,
      unknown: 0,
    };
  }

  private sumCounts(counts: Record<AgeBucketKey, number>): number {
    return Object.values(counts).reduce((total, count) => total + count, 0);
  }

  private round(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  private buildExcelCompatibleXml(title: string, rows: string[][]): string {
    const body = rows
      .map(
        (row) =>
          `<Row>${row
            .map(
              (cell) =>
                `<Cell><Data ss:Type="String">${this.escapeXml(cell)}</Data></Cell>`,
            )
            .join('')}</Row>`,
      )
      .join('');

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="${this.escapeXml(title)}">
  <Table>${body}</Table>
 </Worksheet>
</Workbook>`;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

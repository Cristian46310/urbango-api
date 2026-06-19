import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Incident } from '@/incident/entities/incident.entity';
import { IncidentType } from '@/incident/enums/incident.enum';
import { Enterprise } from '@/enterprise/entities/enterprise.entity';
import { DashboardPeriodMonths } from '../enums/dashboard-period-months.enum';
import { DashboardPeriodService } from './dashboard-period.service';
import { DashboardExportService } from './dashboard-export.service';
import { ResponseIncidentTrendByTypeDto } from '../dto/response-incident-trend-by-type.dto';
import { IncidentTrendDatasetDto } from '../dto/incident-trend-dataset.dto';
import {
  INCIDENT_TYPE_LABELS,
  INCIDENT_TYPE_ORDER,
} from '../constants/incident-type-labels';

type TrendAggregateRow = {
  month: string;
  type: IncidentType;
  count: string;
};

@Injectable()
export class IncidentTrendByTypeService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
    @InjectRepository(Enterprise)
    private readonly enterpriseRepository: Repository<Enterprise>,
    private readonly periodService: DashboardPeriodService,
    private readonly exportService: DashboardExportService,
  ) {}

  async getIncidentTrendByType(
    months: DashboardPeriodMonths = DashboardPeriodMonths.TWELVE,
    enterpriseId?: string,
  ): Promise<ResponseIncidentTrendByTypeDto> {
    const enterprise = await this.resolveEnterpriseScope(enterpriseId);
    const range = this.periodService.resolveRange(months);
    const labels = this.periodService.buildMonthLabels(range.from, range.to);

    const qb = this.incidentRepository
      .createQueryBuilder('incident')
      .where('incident.createdAt >= :from', { from: range.from })
      .andWhere('incident.createdAt < :to', { to: range.to });

    if (enterpriseId) {
      qb.innerJoin('incident.incidentBuses', 'ib')
        .innerJoin('ib.bus', 'bus')
        .andWhere('bus.enterprise_id = :enterpriseId', { enterpriseId });
    }

    const rows = await qb
      .select(
        "TO_CHAR(DATE_TRUNC('month', incident.createdAt), 'YYYY-MM')",
        'month',
      )
      .addSelect('incident.type', 'type')
      .addSelect('COUNT(incident.id)', 'count')
      .groupBy("DATE_TRUNC('month', incident.createdAt)")
      .addGroupBy('incident.type')
      .getRawMany<TrendAggregateRow>();

    const byType = new Map<IncidentType, Map<string, number>>();
    for (const type of INCIDENT_TYPE_ORDER) {
      byType.set(type, new Map());
    }

    for (const row of rows) {
      const typeMap = byType.get(row.type);
      if (typeMap) {
        typeMap.set(row.month, Number(row.count));
      }
    }

    const datasets: IncidentTrendDatasetDto[] = [];
    let grandTotal = 0;

    for (const type of INCIDENT_TYPE_ORDER) {
      const typeMap = byType.get(type)!;
      const data = labels.map((label) => typeMap.get(label) ?? 0);
      const total = data.reduce((sum, value) => sum + value, 0);
      grandTotal += total;
      datasets.push(
        plainToInstance(
          IncidentTrendDatasetDto,
          {
            type,
            typeLabel: INCIDENT_TYPE_LABELS[type],
            label: INCIDENT_TYPE_LABELS[type],
            data,
            total,
          },
          { excludeExtraneousValues: true },
        ),
      );
    }

    return plainToInstance(
      ResponseIncidentTrendByTypeDto,
      {
        period: {
          months: range.months,
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        },
        scope: {
          enterpriseId: enterprise?.id ?? null,
          enterpriseName: enterprise?.name ?? null,
        },
        labels,
        datasets,
        grandTotal,
      },
      { excludeExtraneousValues: true },
    );
  }

  async exportIncidentTrendByTypeCsv(
    months: DashboardPeriodMonths = DashboardPeriodMonths.TWELVE,
    enterpriseId?: string,
  ): Promise<string> {
    const report = await this.getIncidentTrendByType(months, enterpriseId);
    const headers = ['month', 'type', 'type_label', 'count', 'enterprise_id'];
    const rows: string[][] = [];
    const scopeEnterpriseId = report.scope.enterpriseId ?? '';

    for (let i = 0; i < report.labels.length; i++) {
      const month = report.labels[i];
      for (const dataset of report.datasets) {
        rows.push([
          month,
          dataset.type,
          dataset.typeLabel,
          String(dataset.data[i]),
          scopeEnterpriseId,
        ]);
      }
    }

    return this.exportService.toCsv(headers, rows);
  }

  private async resolveEnterpriseScope(
    enterpriseId?: string,
  ): Promise<Enterprise | null> {
    if (!enterpriseId) {
      return null;
    }

    const enterprise = await this.enterpriseRepository.findOne({
      where: { id: enterpriseId },
    });

    if (!enterprise) {
      throw new NotFoundException(
        `Enterprise with id ${enterpriseId} not found`,
      );
    }

    return enterprise;
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ResponseDashboardPeriodDto } from './response-dashboard-period.dto';
import { DashboardScopeDto } from './dashboard-scope.dto';
import { IncidentTrendDatasetDto } from './incident-trend-dataset.dto';

export class ResponseIncidentTrendByTypeDto {
  @ApiProperty({ type: ResponseDashboardPeriodDto })
  @Expose()
  @Type(() => ResponseDashboardPeriodDto)
  period!: ResponseDashboardPeriodDto;

  @ApiProperty({ type: DashboardScopeDto })
  @Expose()
  @Type(() => DashboardScopeDto)
  scope!: DashboardScopeDto;

  @ApiProperty({ example: ['2025-06', '2025-07', '2025-08'] })
  @Expose()
  labels!: string[];

  @ApiProperty({ type: [IncidentTrendDatasetDto] })
  @Expose()
  @Type(() => IncidentTrendDatasetDto)
  datasets!: IncidentTrendDatasetDto[];

  @ApiProperty({ example: 42 })
  @Expose()
  grandTotal!: number;
}

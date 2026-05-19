import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { DashboardPeriodMonths } from '../enums/dashboard-period-months.enum';

export class DashboardIncidentTrendQueryDto {
  @ApiPropertyOptional({
    enum: DashboardPeriodMonths,
    default: DashboardPeriodMonths.TWELVE,
    description: 'Cantidad de meses calendario a analizar (3, 6 o 12)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(DashboardPeriodMonths)
  months?: DashboardPeriodMonths = DashboardPeriodMonths.TWELVE;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Filtrar por empresa; omitir para consolidado de todas las empresas',
  })
  @IsOptional()
  @IsUUID()
  enterpriseId?: string;
}

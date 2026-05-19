import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { DashboardPeriodMonths } from '../enums/dashboard-period-months.enum';

export class DashboardPeriodQueryDto {
  @ApiPropertyOptional({
    enum: DashboardPeriodMonths,
    default: DashboardPeriodMonths.SIX,
    description: 'Cantidad de meses calendario a analizar (3, 6 o 12)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(DashboardPeriodMonths)
  months?: DashboardPeriodMonths = DashboardPeriodMonths.SIX;
}

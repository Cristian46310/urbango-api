import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { SchedulerStatus } from '../entities/scheduler.entity';

export class SchedulerQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '2026-05-20' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  busId?: string;

  @ApiPropertyOptional({
    enum: SchedulerStatus,
    default: SchedulerStatus.SCHEDULED,
    description:
      'Por defecto solo programaciones visibles en consulta de horarios',
  })
  @IsOptional()
  @IsEnum(SchedulerStatus)
  status?: SchedulerStatus;
}

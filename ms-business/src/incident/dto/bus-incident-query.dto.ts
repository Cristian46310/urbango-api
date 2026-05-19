import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { IncidentType, IncidentStatus } from '../enums/incident.enum';

export class BusIncidentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: IncidentType })
  @IsEnum(IncidentType)
  @IsOptional()
  type?: IncidentType;

  @ApiPropertyOptional({ enum: IncidentStatus })
  @IsEnum(IncidentStatus)
  @IsOptional()
  status?: IncidentStatus;
}

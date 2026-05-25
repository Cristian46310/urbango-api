import { PartialType } from '@nestjs/swagger';
import { CreateSchedulerDto } from './create-scheduler.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SchedulerStatus } from '../entities/scheduler.entity';

export class UpdateSchedulerDto extends PartialType(CreateSchedulerDto) {
  @ApiPropertyOptional({ enum: SchedulerStatus })
  @IsOptional()
  @IsEnum(SchedulerStatus)
  status?: SchedulerStatus;
}

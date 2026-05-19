import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecurrenceType, SchedulerStatus } from '../entities/scheduler.entity';

export class CreateSchedulerDto {
  @ApiProperty({
    example: 'a3f5c1d2-1234-4a5b-9cde-111111111111',
    description: 'Bus id',
  })
  @IsUUID()
  @IsNotEmpty()
  busId: string;

  @ApiProperty({
    example: 'b4f6c2d3-2222-4a5b-9cde-222222222222',
    description: 'Route id',
  })
  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @ApiProperty({ example: '2026-05-18', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    example: '08:00:00',
    description: 'Start time ISO string or HH:mm:ss',
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    example: '10:00:00',
    description: 'End time ISO string or HH:mm:ss',
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ enum: SchedulerStatus, required: false })
  @IsOptional()
  @IsEnum(SchedulerStatus)
  status?: SchedulerStatus;

  @ApiProperty({ example: 5, required: false, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  toleranceMinutes?: number;

  @ApiProperty({ enum: RecurrenceType, required: false })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;
}

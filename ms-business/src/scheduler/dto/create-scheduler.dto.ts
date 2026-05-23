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
import { RecurrenceType } from '../entities/scheduler.entity';

export class CreateSchedulerDto {
  @ApiProperty({
    example: 'a3f5c1d2-1234-4a5b-9cde-111111111111',
    description: 'Identificador del bus',
  })
  @IsUUID()
  @IsNotEmpty()
  busId: string;

  @ApiProperty({
    example: 'b4f6c2d3-2222-4a5b-9cde-222222222222',
    description: 'Identificador de la ruta',
  })
  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @ApiProperty({ example: '2026-05-18', description: 'Fecha del servicio' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: '08:00:00',
    description: 'Hora de salida (ISO 8601 o HH:mm:ss)',
  })
  @IsString()
  @IsNotEmpty()
  departureTime: string;

  @ApiProperty({
    example: 5,
    required: false,
    minimum: 0,
    description: 'Margen de tolerancia de salida en minutos (ej. ±5)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  toleranceMinutes?: number;

  @ApiProperty({
    enum: RecurrenceType,
    required: false,
    description: 'Recurrencia: weekdays (lun–vie), weekends, daily',
  })
  @IsOptional()
  @IsEnum(RecurrenceType)
  recurrenceType?: RecurrenceType;
}

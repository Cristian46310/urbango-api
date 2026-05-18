import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IncidentType, IncidentSeverity } from '../enums/incident.enum';

export class CreateIncidentDriverDto {
  @ApiProperty({
    enum: IncidentType,
    example: IncidentType.MECHANICAL,
    description: 'Tipo de incidente reportado',
  })
  @IsEnum(IncidentType)
  @IsNotEmpty()
  type!: IncidentType;

  @ApiProperty({
    enum: IncidentSeverity,
    example: IncidentSeverity.HIGH,
    description: 'Nivel de severidad del incidente',
  })
  @IsEnum(IncidentSeverity)
  @IsNotEmpty()
  severity!: IncidentSeverity;

  @ApiProperty({
    example: 'El bus presenta una falla en el motor',
    description: 'Descripción detallada del incidente',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    type: 'number',
    example: 4.8156,
    description: 'Latitud GPS actual del incidente',
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsNotEmpty()
  latitude!: number;

  @ApiProperty({
    type: 'number',
    example: -75.5149,
    description: 'Longitud GPS actual del incidente',
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsNotEmpty()
  longitude!: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2026-05-17T23:10:00.000Z',
    description: 'Timestamp del evento (opcional)',
    required: false,
  })
  @IsOptional()
  timestamp?: Date;
}

import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum IncidentType {
  MECHANICAL = 'mechanical',
  ACCIDENT = 'accident',
  DELAY = 'delay',
  OTHER = 'other',
}

export enum IncidentSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class CreateIncidentDriverDto {
  @IsEnum(IncidentType)
  @IsNotEmpty()
  type!: IncidentType;

  @IsEnum(IncidentSeverity)
  @IsNotEmpty()
  severity!: IncidentSeverity;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @IsNotEmpty()
  latitude!: number;

  @IsNumber()
  @IsNotEmpty()
  longitude!: number;

  @IsOptional()
  timestamp?: Date;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';
import { BusStatus } from '../enums/bus-status.enum';

export class BaseBusDto {
  @ApiProperty({ description: 'Placa del bus (única)', example: 'ABC-123' })
  @IsString()
  @IsNotEmpty()
  plate!: string;

  @ApiPropertyOptional({ description: 'Modelo del bus', example: 'Mercedes' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiPropertyOptional({
    description: 'Color del bus (si se omite en creación, se guarda "Sin especificar")',
    example: 'Blanco',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Año del bus', example: 2023 })
  @IsInt()
  @IsOptional()
  @Min(1900)
  year?: number;

  @ApiPropertyOptional({
    description: 'Capacidad de pasajeros sentados',
    example: 35,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  seatedCapacity?: number;

  @ApiPropertyOptional({
    description: 'Capacidad de pasajeros parados',
    example: 5,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  standingCapacity?: number;

  @ApiPropertyOptional({
    description: 'Estado del bus',
    enum: BusStatus,
    default: BusStatus.OPERATIVO,
  })
  @IsEnum(BusStatus)
  @IsOptional()
  status?: BusStatus;

  @ApiPropertyOptional({
    description: 'Enterprise id (solo uso interno)',
    example: '550e84...',
  })
  @IsString()
  @IsOptional()
  enterpriseId?: string;
}

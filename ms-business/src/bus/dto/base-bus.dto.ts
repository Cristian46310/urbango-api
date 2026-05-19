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

  @ApiPropertyOptional({ description: 'Color del bus', example: 'Blanco' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ description: 'Capacidad total', example: 40 })
  @IsInt()
  @IsOptional()
  @Min(1)
  capacity?: number;

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
    description: 'URL de la foto del bus',
    example: 'https://supabase.com/...',
  })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'Código QR del bus (generado automáticamente)',
    example: 'data:image/png;base64,...',
  })
  @IsString()
  @IsOptional()
  qrCode?: string;

  @ApiPropertyOptional({
    description: 'Enterprise id (solo uso interno)',
    example: '550e84...',
  })
  @IsString()
  @IsOptional()
  enterpriseId?: string;
}

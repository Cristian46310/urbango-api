import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class BaseBusDto {
  @ApiProperty({ description: 'Placa del bus', example: 'ABC-123' })
  @IsString()
  @IsNotEmpty()
  plate!: string;

  @ApiProperty({ description: 'Modelo del bus', example: 'Mercedes' })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ description: 'Color del bus', example: 'Blanco' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ description: 'Capacidad', example: 40 })
  @IsInt()
  @IsOptional()
  capacity?: number;

  @ApiProperty({ description: 'Enterprise id', example: '550e84...' })
  @IsString()
  @IsOptional()
  enterpriseId?: string;
}

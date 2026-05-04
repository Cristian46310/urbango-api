import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class BaseTurnDto {
  @ApiProperty({
    description: 'Inicio del turno (ISO)',
    example: '2026-01-01T08:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({
    description: 'Fin del turno (ISO)',
    example: '2026-01-01T12:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'Estado', example: 'active' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ description: 'Bus id', example: 'uuid' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiProperty({ description: 'Driver id', example: 'uuid' })
  @IsString()
  @IsOptional()
  driverId?: string;
}

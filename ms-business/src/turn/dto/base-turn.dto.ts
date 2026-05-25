import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { TurnStatus } from '../entities/turn.entity';

export class BaseTurnDto {
  @ApiProperty({
    description: 'Inicio del turno (ISO)',
    example: '2026-01-01T08:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime!: string;

  @ApiProperty({
    description:
      'Fin del turno (ISO). Si no se envía o es anterior al inicio, el backend usa inicio + 8 horas.',
    example: '2026-01-01T16:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'Estado', enum: TurnStatus, required: false })
  @IsEnum(TurnStatus)
  @IsOptional()
  status?: TurnStatus;

  @ApiProperty({ description: 'Bus id', example: 'uuid' })
  @IsString()
  @IsOptional()
  busId?: string;

  @ApiProperty({ description: 'Driver id', example: 'uuid' })
  @IsString()
  @IsOptional()
  driverId?: string;
}

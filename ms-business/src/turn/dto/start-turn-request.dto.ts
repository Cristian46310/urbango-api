import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class StartTurnRequestDto {
  @ApiProperty({ example: 'operativo' })
  @IsString()
  @IsNotEmpty()
  busStatus: string;

  @ApiPropertyOptional({
    example: 'Llantas un poco desgastadas',
  })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiPropertyOptional({
    example: 5.069,
    description: 'Latitud GPS inicial del bus (activa tracking si se envía)',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({
    example: -75.517,
    description: 'Longitud GPS inicial del bus',
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;
}

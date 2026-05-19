import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class NearbyStopQueryDto {
  // Latitud del punto desde donde se quieren buscar paraderos cercanos.
  @ApiProperty({ example: 12.3456, description: 'Latitud de la ubicación' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  // Longitud del punto desde donde se quieren buscar paraderos cercanos.
  @ApiProperty({ example: 78.9012, description: 'Longitud de la ubicación' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lon!: number;

  // Cantidad máxima de paraderos que se devolverán en la respuesta.
  @ApiPropertyOptional({
    example: 5,
    description: 'Límite de resultados',
    minimum: 1,
    maximum: 100,
    default: 5,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 5;

  // Radio de búsqueda alrededor de la ubicación, expresado en metros.
  @ApiPropertyOptional({
    example: 1000,
    description: 'Radio en metros',
    minimum: 1,
    default: 1000,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  radiusMeters?: number = 1000;
}

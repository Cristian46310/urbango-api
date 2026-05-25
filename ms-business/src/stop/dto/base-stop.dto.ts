import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { StopType } from '../entities/stop.entity';

export class BaseStopDto {
  @ApiProperty({
    description: 'Nombre de la parada',
    example: 'Parque Principal',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Ubicacion o referencia de la parada',
    example: 'Calle 10 # 15-20',
  })
  @IsString()
  @IsNotEmpty()
  location!: string;

  @ApiProperty({
    description: 'Latitud del paradero para visualizacion en mapa',
    example: 5.070275,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    description: 'Longitud del paradero para visualizacion en mapa',
    example: -75.513817,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    description: 'Tipo de paradero',
    enum: StopType,
    default: StopType.REGULAR,
    required: false,
  })
  @IsEnum(StopType)
  @IsOptional()
  type?: StopType;
}

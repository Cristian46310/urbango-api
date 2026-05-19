import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { BaseStopDto } from './base-stop.dto';

export class CreateStopDto extends BaseStopDto {
  @ApiProperty({
    description: 'Latitud de la parada',
    type: Number,
    example: -12.3456,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  declare latitude: number;

  @ApiProperty({
    description: 'Longitud de la parada',
    type: Number,
    example: 78.9012,
  })
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  declare longitude: number;
}

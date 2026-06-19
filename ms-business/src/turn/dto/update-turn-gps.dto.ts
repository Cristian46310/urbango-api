import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateTurnGpsDto {
  @ApiProperty({ example: 5.069 })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ example: -75.517 })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;
}

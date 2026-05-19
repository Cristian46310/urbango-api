import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateNodeDto {
  @ApiProperty({
    description: 'Orden del nodo dentro de la ruta',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty({ example: 1.4, minimum: 0 })
  @IsNumber()
  @Min(0)
  distanceFromPrevious!: number;

  @ApiProperty({ example: 5, minimum: 0 })
  @IsInt()
  @Min(0)
  estimatedTimeMinutes!: number;
}

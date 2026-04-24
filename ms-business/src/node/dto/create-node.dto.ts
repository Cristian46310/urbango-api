import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateNodeDto {
  @ApiProperty({
    description: 'Orden del nodo dentro de la ruta',
    example: 1,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  order!: number;
}

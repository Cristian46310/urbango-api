import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class BaseRouteDto {
  @ApiProperty({
    description: 'Nombre de la ruta',
    example: 'Ruta Norte',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Descripcion de la ruta',
    example: 'Recorrido desde el terminal hasta el centro',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    description: 'Precio del pasaje para la ruta',
    example: 2500,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  price!: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
}

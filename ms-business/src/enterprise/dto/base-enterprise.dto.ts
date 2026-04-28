import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class BaseEnterpriseDto {
  @ApiProperty({ description: 'Nombre de la empresa', example: 'TransU' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'NIT de la empresa', example: '900123456-7' })
  @IsString()
  @IsNotEmpty()
  nit!: string;
}

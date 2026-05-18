import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class BaseEnterpriseDto {
  @ApiProperty({ description: 'Nombre de la empresa', example: 'TransU' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ description: 'NIT de la empresa', example: '900123456-7' })
  @IsString()
  @IsNotEmpty()
  nit!: string;

  @ApiProperty({
    description: 'Correo del supervisor para notificaciones de incidentes',
    example: 'supervisor@transu.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  supervisorEmail?: string;
}

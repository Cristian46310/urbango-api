import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class BasePersonDto {
  @ApiProperty({ example: 'María Gómez' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: '12345678', description: 'Documento único' })
  @IsNotEmpty()
  @IsString()
  document!: string;

  @ApiProperty({ example: 'maria@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+573001234567', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

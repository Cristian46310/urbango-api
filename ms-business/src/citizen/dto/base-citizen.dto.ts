import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class BaseCitizenDto {
  @ApiProperty({ example: 'María Gómez' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Información adicional' })
  @IsOptional()
  @IsString()
  extraInfo?: string;

  @ApiProperty({ example: 'address-uuid' })
  @IsOptional()
  @IsString()
  addressId?: string;

  @ApiProperty({ example: '1998-05-20', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

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
}

import { BasePersonDto } from '@/shared/dto/base-person.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BaseCitizenDto extends BasePersonDto {
  @ApiProperty({ example: 'Información adicional', required: false })
  @IsOptional()
  @IsString()
  extraInfo?: string;

  @ApiProperty({ example: 'uuid-de-la-direccion', required: false })
  @IsOptional()
  @IsString()
  addressId?: string;
}


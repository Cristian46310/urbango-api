import { BasePersonDto } from '@/shared/dto/base-person.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class BaseCitizenDto extends BasePersonDto {
  @ApiProperty({ example: 'uuid-de-la-direccion', required: false })
  @IsOptional()
  @IsString()
  addressId?: string;

  @ApiProperty({ example: '1998-05-20', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

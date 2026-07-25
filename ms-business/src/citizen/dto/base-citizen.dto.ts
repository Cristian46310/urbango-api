import { BasePersonDto } from '@/shared/dto/base-person.dto';
import { CreateAddressDto } from '@/address/dto/create-address.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BaseCitizenDto extends BasePersonDto {
  @ApiProperty({ example: 'uuid-de-la-direccion', required: false })
  @IsOptional()
  @IsString()
  addressId?: string;

  @ApiPropertyOptional({
    type: () => CreateAddressDto,
    description:
      'Domicilio del ciudadano. No enviar junto con addressId; el backend lo crea de forma transaccional.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  @ApiProperty({ example: '1998-05-20', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

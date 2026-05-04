import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Calle 123 #45-67', description: 'Full street address' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  address: string;

  @ApiProperty({ example: 'Manizales', description: 'City name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  city: string;
}

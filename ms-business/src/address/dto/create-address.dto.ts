import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  city: string;
}

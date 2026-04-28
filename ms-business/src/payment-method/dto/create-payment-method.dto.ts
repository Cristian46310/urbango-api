import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;
}

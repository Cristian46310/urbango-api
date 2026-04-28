import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'Cash', description: 'Display name of the payment method' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;
}

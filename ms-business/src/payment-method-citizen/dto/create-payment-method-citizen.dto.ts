import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreatePaymentMethodCitizenDto {
  @ApiProperty({ example: 'citizen-uuid' })
  @IsUUID()
  @IsNotEmpty()
  citizenId: string;

  @ApiProperty({ example: 'payment-method-uuid' })
  @IsUUID()
  @IsNotEmpty()
  paymentMethodId: string;
}

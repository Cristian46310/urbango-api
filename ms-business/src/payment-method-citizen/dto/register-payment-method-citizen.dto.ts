import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

/** Vincula un método de pago al ciudadano del token (sin enviar citizenId). */
export class RegisterPaymentMethodCitizenDto {
  @ApiProperty({ example: 'payment-method-uuid' })
  @IsUUID()
  @IsNotEmpty()
  paymentMethodId!: string;
}

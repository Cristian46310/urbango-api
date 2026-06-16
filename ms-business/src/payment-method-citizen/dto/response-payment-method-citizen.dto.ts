import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResponsePaymentMethodDto } from '@/payment-method/dto/response-payment-method.dto';
import { ResponseCitizenDto } from '@/citizen/dto/response-citizen.dto';

export class ResponsePaymentMethodCitizenDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: () => ResponseCitizenDto })
  citizen!: ResponseCitizenDto;

  @ApiProperty({ type: () => ResponsePaymentMethodDto })
  paymentMethod!: ResponsePaymentMethodDto;

  @ApiProperty({
    example: 0,
    description: 'Saldo en COP (tarjetas recargables)',
  })
  balance!: number;

  @ApiPropertyOptional({ example: 'TC1A2B3C4D5' })
  cardNumber?: string;

  @ApiProperty()
  createdAt!: Date;
}

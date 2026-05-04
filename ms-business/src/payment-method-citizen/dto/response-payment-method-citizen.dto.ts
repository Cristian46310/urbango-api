import { ApiProperty } from '@nestjs/swagger';
import { ResponsePaymentMethodDto } from '@/payment-method/dto/response-payment-method.dto';
import { ResponseCitizenDto } from '@/citizen/dto/response-citizen.dto';

export class ResponsePaymentMethodCitizenDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: () => ResponseCitizenDto })
  citizen: ResponseCitizenDto;

  @ApiProperty({ type: () => ResponsePaymentMethodDto })
  paymentMethod: ResponsePaymentMethodDto;

  @ApiProperty()
  createdAt: Date;
}

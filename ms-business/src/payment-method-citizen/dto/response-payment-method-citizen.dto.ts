import { ApiProperty } from '@nestjs/swagger';
import { ResponsePaymentMethodDto } from '@/payment-method/dto/response-payment-method.dto';
import { ResponseCitizenDto } from '@/citizen/dto/response-citizen.dto';
import {
  PaymentMethodStatus,
  PaymentMethodType,
} from '../entities/payment-method-citizen.entity';

export class ResponsePaymentMethodCitizenDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: () => ResponseCitizenDto })
  citizen: ResponseCitizenDto;

  @ApiProperty({ type: () => ResponsePaymentMethodDto })
  paymentMethod: ResponsePaymentMethodDto;

  @ApiProperty()
  balance: number;

  @ApiProperty({ enum: PaymentMethodType })
  type: PaymentMethodType;

  @ApiProperty({ enum: PaymentMethodStatus })
  status: PaymentMethodStatus;

  @ApiProperty()
  createdAt: Date;
}

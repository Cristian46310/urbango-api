import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import {
  PaymentMethodStatus,
  PaymentMethodType,
} from '../entities/payment-method-citizen.entity';

export class CreatePaymentMethodCitizenDto {
  @ApiProperty({ example: 'citizen-uuid' })
  @IsUUID()
  @IsNotEmpty()
  citizenId: string;

  @ApiProperty({ example: 'payment-method-uuid' })
  @IsUUID()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiProperty({ example: 15000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;

  @ApiProperty({ enum: PaymentMethodType, required: false })
  @IsOptional()
  @IsEnum(PaymentMethodType)
  type?: PaymentMethodType;

  @ApiProperty({ enum: PaymentMethodStatus, required: false })
  @IsOptional()
  @IsEnum(PaymentMethodStatus)
  status?: PaymentMethodStatus;
}

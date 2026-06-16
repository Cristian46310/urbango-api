import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePaymentMethodCitizenDto {
  @ApiProperty({ example: 'citizen-uuid' })
  @IsUUID()
  @IsNotEmpty()
  citizenId!: string;

  @ApiProperty({ example: 'payment-method-uuid' })
  @IsUUID()
  @IsNotEmpty()
  paymentMethodId!: string;

  @ApiProperty({ example: 15000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}

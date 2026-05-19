import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min, IsOptional } from 'class-validator';

export class PreviewCardRechargeDto {
  @ApiProperty({ description: 'ID de la tarjeta (payment_method_citizen)' })
  @IsUUID()
  paymentMethodCitizenId!: string;

  @ApiProperty({
    example: 20000,
    description: 'Monto a recargar en COP (entre 5.000 y 500.000)',
  })
  @IsInt()
  @Min(5000)
  @Max(500000)
  amount!: number;
}

export class CardRechargeCheckoutDto extends PreviewCardRechargeDto {
  @ApiPropertyOptional({
    description: 'URL de retorno del frontend tras el pago (response ePayco)',
  })
  @IsOptional()
  responseUrl?: string;
}

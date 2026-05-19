import { ApiProperty } from '@nestjs/swagger';

export class ResponseCardRechargeConfigDto {
  @ApiProperty({ example: [10000, 20000, 50000, 100000] })
  predefinedAmounts!: number[];

  @ApiProperty({ example: 5000 })
  minAmount!: number;

  @ApiProperty({ example: 500000 })
  maxAmount!: number;

  @ApiProperty({
    example: 2.99,
    description: 'Porcentaje de comisión ePayco aplicado al total a pagar',
  })
  epaycoFeePercent!: number;

  @ApiProperty({
    example: 'https://checkout.epayco.co/checkout-v2.js',
    description: 'Script del Smart Checkout para el frontend',
  })
  checkoutScriptUrl!: string;
}

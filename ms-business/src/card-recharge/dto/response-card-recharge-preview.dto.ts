import { ApiProperty } from '@nestjs/swagger';

export class ResponseCardRechargePreviewDto {
  @ApiProperty({ example: '12345' })
  cardDisplay!: string;

  @ApiProperty({ example: 45000, description: 'Saldo actual ($X)' })
  currentBalance!: number;

  @ApiProperty({
    example: 20000,
    description: 'Monto seleccionado para recargar',
  })
  rechargeAmount!: number;

  @ApiProperty({ example: 598, description: 'Comisión ePayco estimada' })
  feeAmount!: number;

  @ApiProperty({ example: 20598, description: 'Total a pagar en la pasarela' })
  totalToPay!: number;

  @ApiProperty({ example: 65000, description: 'Saldo después de recarga ($Y)' })
  balanceAfterRecharge!: number;

  @ApiProperty({ example: 2.99 })
  epaycoFeePercent!: number;

  @ApiProperty({
    example: 'Se aplicará una comisión del 2.99% por transacción (ePayco).',
  })
  feeMessage!: string;
}

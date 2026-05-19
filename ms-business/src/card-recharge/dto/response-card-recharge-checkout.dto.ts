import { ApiProperty } from '@nestjs/swagger';
import { ResponseCardRechargePreviewDto } from './response-card-recharge-preview.dto';

export class ResponseCardRechargeCheckoutDto {
  @ApiProperty({ example: 'RC-20260518-a1b2c3d4' })
  reference!: string;

  @ApiProperty({ description: 'ID de sesión ePayco Smart Checkout' })
  sessionId!: string;

  @ApiProperty({
    example: 'https://checkout.epayco.co/?sessionId=68eefce71d65f1d39c0f6dad',
    description: 'URL para redirigir o abrir el checkout',
  })
  checkoutUrl!: string;

  @ApiProperty()
  preview!: ResponseCardRechargePreviewDto;

  @ApiProperty({ example: true })
  testMode!: boolean;

  @ApiProperty({
    example: '/card-recharge/transactions/RC-20260519-abc/status',
    description:
      'El front debe consultar esta ruta tras el pago (en sandbox confirma y actualiza saldo)',
  })
  statusPollUrl!: string;
}

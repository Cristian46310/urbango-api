import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponsePaymentMethodDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({
    example: 'CASH',
    description: 'Código estable: CASH | SYSTEM_CARD | EXTERNAL_CARD',
  })
  code?: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'Indica si admite saldo/recarga en el sistema (SYSTEM_CARD)',
  })
  isRechargeable: boolean;

  @ApiProperty()
  createdAt: Date;
}

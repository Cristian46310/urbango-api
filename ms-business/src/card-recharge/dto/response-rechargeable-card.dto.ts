import { ApiProperty } from '@nestjs/swagger';

export class ResponseRechargeableCardDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({
    example: '12345',
    description: 'Últimos dígitos visibles (#12345)',
  })
  cardDisplay!: string;

  @ApiProperty({ example: 45000, description: 'Saldo actual en COP' })
  currentBalance!: number;

  @ApiProperty()
  paymentMethodName!: string;

  @ApiProperty()
  createdAt!: Date;
}

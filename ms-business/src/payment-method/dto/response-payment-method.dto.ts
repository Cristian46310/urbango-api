import { ApiProperty } from '@nestjs/swagger';

export class ResponsePaymentMethodDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Indica si admite recarga vía ePayco' })
  isRechargeable: boolean;

  @ApiProperty()
  createdAt: Date;
}

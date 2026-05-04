import { ApiProperty } from '@nestjs/swagger';

export class ResponsePaymentMethodDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class BoardingRequestDto {
  @ApiProperty({ example: 'bus-uuid' })
  @IsUUID()
  @IsNotEmpty()
  busId: string;

  @ApiProperty({ example: 'payment-method-citizen-uuid' })
  @IsUUID()
  @IsNotEmpty()
  paymentMethodCitizenId: string;

  @ApiProperty({ example: 'node-uuid' })
  @IsUUID()
  @IsNotEmpty()
  nodeId: string;
}

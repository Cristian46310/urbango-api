import { ApiProperty } from '@nestjs/swagger';

export class ResponseAddressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  createdAt: Date;
}

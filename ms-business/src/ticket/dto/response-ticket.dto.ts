import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseTicketDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  buyedAt!: Date;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

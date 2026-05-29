import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseHistoryDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'ticket-uuid' })
  @Expose()
  ticketId?: string;

  @ApiProperty({ example: 'node-uuid' })
  @Expose()
  nodeId?: string;

  @ApiProperty({ example: 1, required: false })
  @Expose()
  nodeOrder?: number;

  @ApiProperty({ example: 'boarding', required: false })
  @Expose()
  eventType?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

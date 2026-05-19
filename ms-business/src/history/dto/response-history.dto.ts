import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { HistoryEventType } from '../entities/history.entity';

export class ResponseHistoryDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  order!: number;

  @ApiProperty({ enum: HistoryEventType })
  @Expose()
  eventType!: HistoryEventType;

  @ApiProperty()
  @Expose()
  eventTimestamp!: Date;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

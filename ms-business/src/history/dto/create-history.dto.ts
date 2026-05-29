import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { HistoryEventType } from '../enums/history-event-type.enum';

export class CreateHistoryDto {
  @ApiProperty({ example: 'ticket-uuid' })
  @IsUUID()
  @IsNotEmpty()
  ticketId!: string;

  @ApiProperty({ example: 'node-uuid' })
  @IsUUID()
  @IsNotEmpty()
  nodeId!: string;

  @ApiProperty({ enum: HistoryEventType, example: HistoryEventType.BOARDING })
  @IsEnum(HistoryEventType)
  @IsNotEmpty()
  eventType!: HistoryEventType;
}

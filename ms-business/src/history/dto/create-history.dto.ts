import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { HistoryEventType } from '../entities/history.entity';

export class CreateHistoryDto {
  @ApiProperty({ example: 'ticket-uuid' })
  @IsOptional()
  @IsString()
  ticketId?: string;

  @ApiProperty({ example: 'node-uuid' })
  @IsOptional()
  @IsString()
  nodeId?: string;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ enum: HistoryEventType, required: false })
  @IsOptional()
  @IsEnum(HistoryEventType)
  eventType?: HistoryEventType;

  @ApiProperty({ example: '2026-05-18T10:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  eventTimestamp?: string;
}

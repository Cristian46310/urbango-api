import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateHistoryDto {
  @ApiProperty({ example: 'ticket-uuid' })
  @IsUUID()
  @IsNotEmpty()
  ticketId!: string;

  @ApiProperty({ example: 'node-uuid' })
  @IsUUID()
  @IsNotEmpty()
  nodeId!: string;
}

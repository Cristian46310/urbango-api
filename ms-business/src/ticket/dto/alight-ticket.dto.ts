import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AlightTicketDto {
  @ApiProperty({ example: 'node-uuid', description: 'ID del paradero actual' })
  @IsString()
  @IsNotEmpty()
  nodeId!: string;

  @ApiProperty({ example: 'bus-uuid', description: 'ID del bus actual' })
  @IsString()
  @IsNotEmpty()
  busId!: string;
}

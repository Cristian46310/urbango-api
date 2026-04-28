import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

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

  @ApiProperty({ example: -12.12 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ example: -34.34 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { TicketStatus } from '../entities/ticket.entity';

export class BaseTicketDto {
  @ApiProperty({ example: 'citizen-uuid' })
  @IsOptional()
  @IsString()
  citizenId?: string;

  @ApiProperty({ example: 'payment-method-uuid' })
  @IsOptional()
  @IsString()
  paymentMethodCitizenId?: string;

  @ApiProperty({ example: 'scheduler-uuid' })
  @IsOptional()
  @IsString()
  schedulerId?: string;

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  buyedAt?: string;

  @ApiProperty({ example: 2500, required: false })
  @IsOptional()
  @IsNumber()
  appliedRate?: number;

  @ApiProperty({ enum: TicketStatus, required: false })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiProperty({ example: '2026-01-01T10:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  boardedAt?: string;
}

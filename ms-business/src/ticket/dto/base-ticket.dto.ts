import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
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

  @ApiProperty({ enum: TicketStatus, required: false })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}

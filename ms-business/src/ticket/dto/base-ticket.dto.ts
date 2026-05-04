import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

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
}

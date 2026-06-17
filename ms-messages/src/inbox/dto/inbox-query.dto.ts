import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { MessageType } from '@/messages/enums/message-type.enum';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

export class InboxQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Solo mensajes sin leer por el usuario autenticado',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({
    enum: MessageType,
    description: 'Filtrar por mensajes directos o grupales',
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({
    description: 'Fecha mínima de recepción (ISO 8601)',
    example: '2026-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha máxima de recepción (ISO 8601)',
    example: '2026-06-30T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

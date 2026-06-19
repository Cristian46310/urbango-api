import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateArrivalNotificationDto {
  @ApiPropertyOptional({ example: 'usuario@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'route-uuid' })
  @IsOptional()
  @IsUUID()
  routeId?: string;

  @ApiPropertyOptional({ example: 'bus-uuid' })
  @IsOptional()
  @IsUUID()
  busId?: string;

  @ApiPropertyOptional({ example: 'stop-uuid' })
  @IsOptional()
  @IsUUID()
  stopId?: string;

  @ApiPropertyOptional({ example: 10, enum: [5, 10, 15] })
  @IsOptional()
  @IsInt()
  @IsIn([5, 10, 15])
  anticipationMinutes?: number;

  @ApiPropertyOptional({
    example:
      'Quiero recibir una alerta cuando el bus esté próximo al paradero.',
  })
  @IsOptional()
  @IsString()
  message?: string;
}

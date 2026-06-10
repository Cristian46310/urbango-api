import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArrivalNotificationDto {
  @ApiProperty({ example: 'usuario@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'route-uuid' })
  routeId?: string;

  @ApiPropertyOptional({ example: 'bus-uuid' })
  busId?: string;

  @ApiProperty({ example: 'stop-uuid', required: false })
  stopId?: string;

  @ApiPropertyOptional({ example: 10 })
  anticipationMinutes?: number;

  @ApiProperty({ example: 'Quiero recibir una alerta cuando el bus esté próximo al paradero.' })
  message!: string;
}

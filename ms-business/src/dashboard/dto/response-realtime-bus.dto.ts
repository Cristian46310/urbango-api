import { ApiProperty } from '@nestjs/swagger';
import { RealtimeBusRouteDto } from './realtime-bus-route.dto';
import { RealtimeStopInfoDto } from './realtime-stop-info.dto';

export class ResponseRealtimeBusDto {
  @ApiProperty({ example: 'bus-uuid' })
  busId!: string;

  @ApiProperty({ example: 'PUX-123' })
  plate!: string;

  @ApiProperty({ example: 'operativo' })
  status!: string;

  @ApiProperty({ example: 4.749, description: 'Alias de latitude para el frontend' })
  lat!: number;

  @ApiProperty({ example: -74.0695, description: 'Alias de longitude para el frontend' })
  lng!: number;

  @ApiProperty({ example: 4.749 })
  latitude!: number;

  @ApiProperty({ example: -74.0695 })
  longitude!: number;

  @ApiProperty({ example: 'route-uuid', required: false })
  routeId?: string;

  @ApiProperty({ example: 'Ruta 12', required: false })
  routeName?: string;

  @ApiProperty({ example: '2026-06-02T12:34:56.789Z' })
  updatedAt!: Date;

  @ApiProperty({ type: RealtimeBusRouteDto, required: false })
  route?: RealtimeBusRouteDto;

  @ApiProperty({ type: RealtimeStopInfoDto, required: false })
  nearestStop?: RealtimeStopInfoDto;

  @ApiProperty({ type: RealtimeStopInfoDto, required: false })
  nextStop?: RealtimeStopInfoDto;

  @ApiProperty({ example: 75, required: false })
  occupancyPercent?: number;

  @ApiProperty({ example: true })
  isFull!: boolean;

  @ApiProperty({ example: true })
  delayAlert!: boolean;

  @ApiProperty({ example: 'green' })
  statusColor!: string;

  @ApiProperty({ example: 8, required: false })
  estimatedMinutesToNextStop?: number;

  @ApiProperty({
    example: 12,
    required: false,
    description:
      'ETA al paradero de espera del ciudadano (cuando se envía stopId)',
  })
  estimatedMinutesToWaitingStop?: number;

  @ApiProperty({ example: 23 })
  activePassengers!: number;

  @ApiProperty({ example: 1 })
  activeIncidents!: number;
}

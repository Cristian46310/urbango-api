import { ApiProperty } from '@nestjs/swagger';
import { RealtimeStopInfoDto } from './realtime-stop-info.dto';

export class RealtimeBusRouteDto {
  @ApiProperty({ example: 'route-uuid' })
  id!: string;

  @ApiProperty({ example: 'Ruta 12' })
  name!: string;

  @ApiProperty({ type: [RealtimeStopInfoDto] })
  stops!: RealtimeStopInfoDto[];
}

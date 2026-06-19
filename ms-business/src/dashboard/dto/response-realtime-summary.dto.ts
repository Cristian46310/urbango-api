import { ApiProperty } from '@nestjs/swagger';
import { ResponseIncidentDto } from '@/incident/dto/response-incident.dto';
import { ResponseRealtimeBusDto } from './response-realtime-bus.dto';
import { ResponseRealtimeBusListDto } from './response-realtime-bus-list.dto';

export class ResponseRealtimeSummaryDto {
  @ApiProperty({ type: ResponseRealtimeBusListDto })
  fleet!: ResponseRealtimeBusListDto;

  @ApiProperty({ type: [ResponseIncidentDto] })
  incidents!: ResponseIncidentDto[];

  @ApiProperty({ example: '2026-06-18T12:00:00.000Z' })
  updatedAt!: Date;

  @ApiProperty({ example: 142 })
  totalPassengersInTransit!: number;

  @ApiProperty({ type: [ResponseRealtimeBusDto] })
  fullBusAlerts!: ResponseRealtimeBusDto[];
}

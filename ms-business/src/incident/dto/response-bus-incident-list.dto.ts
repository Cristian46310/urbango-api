import { ApiProperty } from '@nestjs/swagger';
import { ResponseIncidentDto } from './response-incident.dto';
import { ResponseIncidentStatisticsDto } from './response-incident-statistics.dto';

export class ResponseBusIncidentListDto {
  @ApiProperty({ type: [ResponseIncidentDto] })
  items!: ResponseIncidentDto[];

  @ApiProperty()
  meta!: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };

  @ApiProperty({ type: ResponseIncidentStatisticsDto })
  statistics!: ResponseIncidentStatisticsDto;
}

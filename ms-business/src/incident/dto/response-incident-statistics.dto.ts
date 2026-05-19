import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IncidentType } from '../enums/incident.enum';

export class ResponseIncidentStatisticsDto {
  @ApiProperty({ example: 12 })
  @Expose()
  total!: number;

  @ApiProperty({
    example: {
      [IncidentType.MECHANICAL]: 5,
      [IncidentType.ACCIDENT]: 2,
      [IncidentType.DELAY]: 3,
      [IncidentType.PASSENGER]: 1,
      [IncidentType.OTHER]: 2,
    },
  })
  @Expose()
  byType!: Record<IncidentType, number>;

  @ApiProperty({
    example: 0.42,
    description: 'Proporción de incidentes con estado closed (0–1)',
  })
  @Expose()
  resolutionRate!: number;
}

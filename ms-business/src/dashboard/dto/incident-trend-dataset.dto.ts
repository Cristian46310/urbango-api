import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IncidentType } from '@/incident/enums/incident.enum';

export class IncidentTrendDatasetDto {
  @ApiProperty({ enum: IncidentType, example: IncidentType.MECHANICAL })
  @Expose()
  type!: IncidentType;

  @ApiProperty({ example: 'Mecánico' })
  @Expose()
  typeLabel!: string;

  @ApiProperty({
    example: [2, 1, 0],
    description: 'Cantidad de incidentes por mes, alineados con labels',
  })
  @Expose()
  data!: number[];

  @ApiProperty({ example: 15 })
  @Expose()
  total!: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class AgeSegmentDto {
  @ApiProperty({ example: 'Jovenes (18-25)' })
  name: string;

  @ApiProperty({ example: 3200 })
  count: number;

  @ApiProperty({ example: 39.7 })
  percentage: number;

  @ApiProperty({ example: -1.2, nullable: true })
  variationVsPreviousMonth: number | null;

  @ApiProperty({ example: '#36A2EB' })
  color: string;
}

export class AgeDistributionFilterAppliedDto {
  @ApiProperty({ required: false })
  routeId?: string;

  @ApiProperty({ example: '2025-04-01' })
  startDate: string;

  @ApiProperty({ example: '2025-04-30' })
  endDate: string;
}

export class AgeDistributionResponseDto {
  @ApiProperty({ type: [AgeSegmentDto] })
  segments: AgeSegmentDto[];

  @ApiProperty({ example: 'Jovenes (18-25)' })
  predominantSegment: string;

  @ApiProperty({ example: 8050 })
  totalPassengers: number;

  @ApiProperty({ type: () => AgeDistributionFilterAppliedDto })
  filterApplied: AgeDistributionFilterAppliedDto;
}

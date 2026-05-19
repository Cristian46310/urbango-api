import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseDashboardPeriodDto {
  @ApiProperty({ example: 6 })
  @Expose()
  months!: number;

  @ApiProperty({ example: '2025-12-01T00:00:00.000Z' })
  @Expose()
  from!: string;

  @ApiProperty({ example: '2026-06-01T00:00:00.000Z' })
  @Expose()
  to!: string;
}

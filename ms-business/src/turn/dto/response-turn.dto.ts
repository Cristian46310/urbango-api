import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseTurnDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '2026-01-01T08:00:00.000Z' })
  @Expose()
  startTime!: Date;

  @ApiProperty({ example: '2026-01-01T12:00:00.000Z' })
  @Expose()
  endTime?: Date;

  @ApiProperty({ example: 'active' })
  @Expose()
  status?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

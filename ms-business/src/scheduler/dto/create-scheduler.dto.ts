import { IsUUID, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSchedulerDto {
  @ApiProperty({
    example: 'a3f5c1d2-1234-4a5b-9cde-111111111111',
    description: 'Bus id',
  })
  @IsUUID()
  @IsNotEmpty()
  busId: string;

  @ApiProperty({
    example: 'b4f6c2d3-2222-4a5b-9cde-222222222222',
    description: 'Route id',
  })
  @IsUUID()
  @IsNotEmpty()
  routeId: string;

  @ApiProperty({
    example: '2026-05-01T08:00:00.000Z',
    description: 'Start time ISO string',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    example: '2026-05-01T10:00:00.000Z',
    description: 'End time ISO string',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;
}

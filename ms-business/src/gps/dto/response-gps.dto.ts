import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseGpsDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @Expose()
  busId!: string;

  @ApiProperty({ example: 4.8156 })
  @Expose()
  latitude!: number;

  @ApiProperty({ example: -75.5149 })
  @Expose()
  longitude!: number;

  @ApiPropertyOptional({ example: '2026-05-22T12:00:00.000Z' })
  @Expose()
  updatedAt?: Date;
}

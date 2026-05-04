import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseBusDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'ABC-123' })
  @Expose()
  plate!: string;

  @ApiProperty({ example: 'Mercedes' })
  @Expose()
  model?: string;

  @ApiProperty({ example: 'Blanco' })
  @Expose()
  color?: string;

  @ApiProperty({ example: 40 })
  @Expose()
  capacity?: number;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @Expose()
  createdAt!: Date;
}

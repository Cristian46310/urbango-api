import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { StopType } from '../entities/stop.entity';

export class ResponseStopDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    example: 'PAR-001',
  })
  @Expose()
  code!: string;

  @ApiProperty({
    example: 'Parque Principal',
  })
  @Expose()
  name!: string;

  @ApiProperty({
    example: 'Calle 123',
  })
  @Expose()
  location!: string;

  @ApiProperty({
    example: 5.070275,
    required: false,
  })
  @Expose()
  latitude?: number;

  @ApiProperty({
    example: -75.513817,
    required: false,
  })
  @Expose()
  longitude?: number;

  @ApiProperty({
    enum: StopType,
    example: StopType.REGULAR,
  })
  @Expose()
  type!: StopType;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;
}

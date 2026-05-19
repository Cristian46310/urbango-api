import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseStopDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id!: string;
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
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    example: -12.3456,
    required: false,
  })
  @Expose()
  latitude?: number;

  @ApiProperty({
    example: 78.9012,
    required: false,
  })
  @Expose()
  longitude?: number;
}

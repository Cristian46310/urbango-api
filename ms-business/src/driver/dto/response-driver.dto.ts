import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseDriverDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Juan Perez' })
  @Expose()
  name?: string;

  @ApiProperty({ example: 'ABC123456' })
  @Expose()
  licenseNumber?: string;

  @ApiProperty({ example: '2026-12-31' })
  @Expose()
  licenseExpiry?: Date;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @Expose()
  enterpriseId?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

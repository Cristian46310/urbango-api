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

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

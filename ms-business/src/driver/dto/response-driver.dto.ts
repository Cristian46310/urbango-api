import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseDriverDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Juan Perez' })
  @Expose()
  name?: string;

  @ApiPropertyOptional({ example: '87654321' })
  @Expose()
  document?: string;

  @ApiPropertyOptional({ example: 'juan@example.com' })
  @Expose()
  email?: string;

  @ApiPropertyOptional({ example: '+573009998877' })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({
    example:
      'https://xxx.supabase.co/storage/v1/object/public/user-photo/users/...',
  })
  @Expose()
  photoUrl?: string;

  @ApiProperty({ example: 'ABC123456' })
  @Expose()
  licenseNumber?: string;

  @ApiProperty({ example: '2026-12-31' })
  @Expose()
  licenseExpiry?: Date;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @Expose()
  enterpriseId?: string;

  @ApiPropertyOptional()
  @Expose()
  userId?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

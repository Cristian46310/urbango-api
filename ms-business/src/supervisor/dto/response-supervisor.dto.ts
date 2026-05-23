import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseSupervisorDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Ana Supervisor' })
  @Expose()
  name?: string;

  @ApiProperty({ example: '12345678' })
  @Expose()
  document?: string;

  @ApiProperty({ example: 'supervisor@transu.com' })
  @Expose()
  email?: string;

  @ApiProperty({ example: '+573001234567' })
  @Expose()
  phone?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @Expose()
  enterpriseId?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

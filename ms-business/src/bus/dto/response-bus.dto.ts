import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BusStatus } from '../enums/bus-status.enum';

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

  @ApiProperty({ example: 2023 })
  @Expose()
  year?: number;

  @ApiProperty({ example: 35 })
  @Expose()
  seatedCapacity?: number;

  @ApiProperty({ example: 5 })
  @Expose()
  standingCapacity?: number;

  @ApiProperty({ enum: BusStatus, example: BusStatus.OPERATIVO })
  @Expose()
  status!: BusStatus;

  @ApiProperty({ example: 'https://supabase.com/...' })
  @Expose()
  photoUrl?: string;

  @ApiProperty({ example: 'data:image/png;base64,...' })
  @Expose()
  qrCode?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @Expose()
  enterpriseId?: string;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  @Expose()
  createdAt!: Date;
}

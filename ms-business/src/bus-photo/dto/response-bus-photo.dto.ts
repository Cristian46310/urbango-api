import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseBusPhotoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @Expose()
  busId!: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/photo.jpg' })
  @Expose()
  publicUrl?: string;

  @ApiPropertyOptional({ example: 'bus-front.jpg' })
  @Expose()
  originalName?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @Expose()
  mimeType?: string;

  @ApiPropertyOptional({ example: 102400 })
  @Expose()
  size?: number;

  @ApiProperty({ example: '2026-05-23T12:00:00.000Z' })
  @Expose()
  createdAt!: Date;
}

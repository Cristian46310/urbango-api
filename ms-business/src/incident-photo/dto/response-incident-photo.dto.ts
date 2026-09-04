import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class ResponseIncidentPhotoDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  /**
   * Entidad persiste `photoUrl`; el contrato de API expone `publicUrl`.
   */
  @ApiPropertyOptional({ example: 'https://storage.example.com/photo.jpg' })
  @Expose()
  @Transform(({ obj }) => {
    const value = obj?.publicUrl ?? obj?.photoUrl;
    return typeof value === 'string' && value.trim() ? value : undefined;
  })
  publicUrl?: string;

  @ApiPropertyOptional({ example: 'damage-front.jpg' })
  @Expose()
  originalName?: string;

  @ApiProperty({ example: '2026-05-18T12:00:00.000Z' })
  @Expose()
  createdAt!: Date;
}

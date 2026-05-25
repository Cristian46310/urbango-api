import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseIncidentCommentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Se programó revisión en taller.' })
  @Expose()
  text!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @Expose()
  authorUserId!: string;

  @ApiProperty({ example: 'Admin Empresa' })
  @Expose()
  authorName!: string;

  @ApiProperty({ example: '2026-05-18T14:00:00.000Z' })
  @Expose()
  createdAt!: Date;
}

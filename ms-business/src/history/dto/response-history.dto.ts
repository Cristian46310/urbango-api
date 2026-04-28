import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseHistoryDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  order!: number;

  @ApiProperty()
  @Expose()
  latitude?: number;

  @ApiProperty()
  @Expose()
  longitude?: number;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

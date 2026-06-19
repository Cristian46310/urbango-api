import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ResponseGroupPublicSummaryDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  name!: string;

  @ApiPropertyOptional()
  @Expose()
  description?: string;

  @ApiProperty()
  @Expose()
  memberCount!: number;

  @ApiPropertyOptional()
  @Expose()
  iconUrl?: string;

  @ApiProperty()
  @Expose()
  isMember!: boolean;
}

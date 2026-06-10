import { ApiProperty } from '@nestjs/swagger';

export class RealtimeStopInfoDto {
  @ApiProperty({ example: 'stop-uuid' })
  id!: string;

  @ApiProperty({ example: 'Paradero Central' })
  name!: string;

  @ApiProperty({ example: -74.0695 })
  latitude!: number;

  @ApiProperty({ example: 4.7490 })
  longitude!: number;
}

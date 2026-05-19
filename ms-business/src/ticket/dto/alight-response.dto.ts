import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AlightResponseDto {
  @ApiProperty()
  @Expose()
  message!: string;

  @ApiProperty()
  @Expose()
  ticketId!: string;

  @ApiProperty()
  @Expose()
  completedAt!: Date;

  @ApiProperty()
  @Expose()
  stopName!: string;

  @ApiProperty()
  @Expose()
  totalTravelTime!: number;
}

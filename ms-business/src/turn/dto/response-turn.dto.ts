import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TurnStatus } from '../entities/turn.entity';

export class ResponseTurnDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '2026-01-01T08:00:00.000Z' })
  @Expose()
  startTime!: Date;

  @ApiProperty({ example: '2026-01-01T12:00:00.000Z' })
  @Expose()
  endTime?: Date;

  @ApiProperty({ enum: TurnStatus, example: TurnStatus.SCHEDULED })
  @Expose()
  status?: TurnStatus;

  @ApiProperty({ required: false })
  @Expose()
  actualStartTime?: Date;

  @ApiProperty({ required: false })
  @Expose()
  busStatus?: string;

  @ApiProperty({ required: false })
  @Expose()
  busObservations?: string;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
}

import { ApiProperty } from '@nestjs/swagger';
import { TurnStatus } from '../entities/turn.entity';

export class EndTurnResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Turno finalizado' })
  message: string;

  @ApiProperty({ example: 'uuid' })
  turnId: string;

  @ApiProperty({ enum: TurnStatus, example: TurnStatus.COMPLETED })
  status: TurnStatus;

  @ApiProperty({
    example: '2025-05-18T16:00:00.000Z',
    description: 'Fin programado del turno',
  })
  endTime: Date;
}

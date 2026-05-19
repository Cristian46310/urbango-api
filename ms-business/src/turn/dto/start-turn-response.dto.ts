import { ApiProperty } from '@nestjs/swagger';
import { TurnStatus } from '../entities/turn.entity';

export class StartTurnBusResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'ABC-123' })
  placa: string;

  @ApiProperty({ example: '2023', required: false })
  modelo?: string;
}

export class StartTurnResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Turno iniciado' })
  message: string;

  @ApiProperty({ example: 'uuid' })
  turnId: string;

  @ApiProperty({ type: () => StartTurnBusResponseDto })
  bus: StartTurnBusResponseDto;

  @ApiProperty({ example: '2025-05-18T08:00:00.000Z' })
  actualStartTime: Date;

  @ApiProperty({ enum: TurnStatus, example: TurnStatus.IN_PROGRESS })
  status: TurnStatus;
}

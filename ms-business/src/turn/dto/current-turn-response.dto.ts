import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TurnStatus } from '../entities/turn.entity';
import { StartTurnBusResponseDto } from './start-turn-response.dto';

export class CurrentTurnResponseDto {
  @ApiProperty({
    example: true,
    description: 'true si el conductor tiene un turno in_progress',
  })
  active: boolean;

  @ApiPropertyOptional({ example: 'uuid' })
  turnId?: string;

  @ApiPropertyOptional({ type: () => StartTurnBusResponseDto })
  bus?: StartTurnBusResponseDto;

  @ApiPropertyOptional({
    example: '2025-05-18T08:00:00.000Z',
    description: 'Inicio real del turno (actualStartTime)',
  })
  startTime?: Date;

  @ApiPropertyOptional({
    example: '2025-05-18T07:30:00.000Z',
    description: 'Hora programada de inicio',
  })
  scheduledStartTime?: Date;

  @ApiPropertyOptional({
    example: '2025-05-18T16:00:00.000Z',
    description: 'Fin programado del turno',
  })
  endTime?: Date;

  @ApiPropertyOptional({ enum: TurnStatus, example: TurnStatus.IN_PROGRESS })
  status?: TurnStatus;
}

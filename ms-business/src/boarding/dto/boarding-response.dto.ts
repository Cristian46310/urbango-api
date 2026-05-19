import { ApiProperty } from '@nestjs/swagger';

export class BoardingResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Abordaje exitoso' })
  message: string;

  @ApiProperty({ example: 'ticket-uuid' })
  ticketId: string;

  @ApiProperty({ example: 12500, required: false })
  remainingBalance?: number;

  @ApiProperty()
  boardedAt: Date;
}

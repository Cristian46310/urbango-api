import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TicketStatus } from '../entities/ticket.entity';

export class ResponseTicketDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty({ enum: TicketStatus })
  @Expose()
  status!: TicketStatus;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty({ required: false })
  @Expose()
  boardedAt?: Date | null;

  @ApiProperty({ required: false })
  @Expose()
  completedAt?: Date | null;

  @ApiProperty({
    example: 2500,
    description: 'Tarifa de la ruta asociada al programador',
    required: false,
  })
  @Expose()
  routePrice?: number;
}

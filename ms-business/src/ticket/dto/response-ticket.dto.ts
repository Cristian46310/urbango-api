import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TicketStatus } from '../entities/ticket.entity';

export class ResponseTicketDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  buyedAt!: Date;

  @ApiProperty()
  @Expose()
  appliedRate!: number;

  @ApiProperty({ enum: TicketStatus })
  @Expose()
  status!: TicketStatus;

  @ApiProperty({ required: false })
  @Expose()
  boardedAt?: Date;

  @ApiProperty()
  @Expose()
  createdAt!: Date;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.ACTIVE })
  @Expose()
  status!: TicketStatus;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  completedAt?: Date | null;
}

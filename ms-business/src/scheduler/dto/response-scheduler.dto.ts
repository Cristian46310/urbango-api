import { ApiProperty } from '@nestjs/swagger';
import { ResponseBusDto } from '@/bus/dto/response-bus.dto';
import { ResponseRouteDto } from '@/route/dto/response-route.dto';
import { RecurrenceType, SchedulerStatus } from '../entities/scheduler.entity';

export class ResponseSchedulerDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: () => ResponseBusDto })
  bus: ResponseBusDto;

  @ApiProperty({ type: () => ResponseRouteDto })
  route: ResponseRouteDto;

  @ApiProperty({ description: 'Fecha del servicio' })
  date: string;

  @ApiProperty({ description: 'Hora de salida programada' })
  departureTime: Date;

  @ApiProperty({
    description: 'Fin estimado del servicio (calculado según duración de la ruta)',
  })
  endTime: Date;

  @ApiProperty({ enum: SchedulerStatus })
  status: SchedulerStatus;

  @ApiProperty({
    example: 5,
    description: 'Margen de tolerancia de salida en minutos',
  })
  toleranceMinutes: number;

  @ApiProperty({ enum: RecurrenceType })
  recurrenceType: RecurrenceType;

  @ApiProperty()
  createdAt: Date;
}

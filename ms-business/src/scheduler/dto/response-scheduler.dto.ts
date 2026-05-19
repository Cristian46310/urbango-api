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

  @ApiProperty()
  date: string;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty({ enum: SchedulerStatus })
  status: SchedulerStatus;

  @ApiProperty({ example: 5 })
  toleranceMinutes: number;

  @ApiProperty({ enum: RecurrenceType })
  recurrenceType: RecurrenceType;

  @ApiProperty()
  createdAt: Date;
}

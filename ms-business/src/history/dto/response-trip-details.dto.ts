import { ApiProperty } from '@nestjs/swagger';
import { ResponseRouteDto } from '@/route/dto/response-route.dto';
import { ResponseBusDto } from '@/bus/dto/response-bus.dto';
import { ResponseDriverDto } from '@/driver/dto/response-driver.dto';
import { ResponseTurnDto } from '@/turn/dto/response-turn.dto';
import { ResponseSchedulerDto } from '@/scheduler/dto/response-scheduler.dto';
import { CitizenSummaryDto } from './citizen-summary.dto';
import { ValidationDto } from './validation.dto';
import { TotalTimeDto } from './total-time.dto';

export class ResponseTripDetailsDto {
  @ApiProperty({ example: 'uuid' })
  tripId!: string;

  @ApiProperty({ type: () => ResponseRouteDto, required: false })
  route?: ResponseRouteDto | null;

  @ApiProperty({ type: () => ResponseBusDto, required: false })
  bus?: ResponseBusDto | null;

  @ApiProperty({ type: () => ResponseDriverDto, required: false })
  driver?: ResponseDriverDto | null;

  @ApiProperty({ type: () => ResponseTurnDto, required: false })
  turn?: ResponseTurnDto | null;

  @ApiProperty({ type: () => ResponseSchedulerDto, required: false })
  scheduler?: ResponseSchedulerDto | null;

  @ApiProperty({ type: [ValidationDto] })
  validations!: ValidationDto[];

  @ApiProperty({ type: () => TotalTimeDto })
  totalTime!: TotalTimeDto;

  @ApiProperty({ type: () => CitizenSummaryDto })
  citizen!: CitizenSummaryDto;
}

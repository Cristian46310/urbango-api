import { ApiProperty } from '@nestjs/swagger';
import { ResponseBusDto } from 'src/bus/dto/response-bus.dto';
import { ResponseRouteDto } from 'src/route/dto/response-route.dto';

export class ResponseSchedulerDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: () => ResponseBusDto })
  bus: ResponseBusDto;

  @ApiProperty({ type: () => ResponseRouteDto })
  route: ResponseRouteDto;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  createdAt: Date;
}

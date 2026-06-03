import { ApiProperty } from '@nestjs/swagger';
import { ResponseRealtimeBusDto } from './response-realtime-bus.dto';

export class ResponseRealtimeBusListDto {
  @ApiProperty({ type: [ResponseRealtimeBusDto] })
  items!: ResponseRealtimeBusDto[];
}

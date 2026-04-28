import { ApiProperty } from '@nestjs/swagger';
import { ResponseBusDto } from './response-bus.dto';

export class ResponseBusListDto {
  @ApiProperty({ type: [ResponseBusDto] })
  items!: ResponseBusDto[];

  @ApiProperty()
  meta!: any;
}

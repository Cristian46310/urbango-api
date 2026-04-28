import { ApiProperty } from '@nestjs/swagger';
import { ResponseHistoryDto } from './response-history.dto';

export class ResponseHistoryListDto {
  @ApiProperty({ type: [ResponseHistoryDto] })
  items!: ResponseHistoryDto[];

  @ApiProperty()
  meta!: any;
}

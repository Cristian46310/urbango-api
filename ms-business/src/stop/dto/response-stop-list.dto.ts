import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/shared/dto/pagination-meta.dto';
import { ResponseStopDto } from './response-stop.dto';

export class ResponseStopListDto {
  @ApiProperty({ type: [ResponseStopDto] })
  items!: ResponseStopDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

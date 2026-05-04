import { ApiProperty } from '@nestjs/swagger';
import { ResponseSchedulerDto } from './response-scheduler.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponseSchedulerListDto {
  @ApiProperty({ type: [ResponseSchedulerDto] })
  items!: ResponseSchedulerDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

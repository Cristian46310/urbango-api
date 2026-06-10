import { ApiProperty } from '@nestjs/swagger';
import { ResponseUserSummaryDto } from './response-user-summary.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponseUserSummaryListDto {
  @ApiProperty({ type: [ResponseUserSummaryDto] })
  items!: ResponseUserSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

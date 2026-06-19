import { ApiProperty } from '@nestjs/swagger';
import { ResponseGroupPublicSummaryDto } from './response-group-public-summary.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponseGroupPublicListDto {
  @ApiProperty({ type: [ResponseGroupPublicSummaryDto] })
  items!: ResponseGroupPublicSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

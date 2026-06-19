import { ApiProperty } from '@nestjs/swagger';
import { ResponseGroupMemberEnrichedDto } from './response-group-member-enriched.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponseGroupMemberListDto {
  @ApiProperty({ type: [ResponseGroupMemberEnrichedDto] })
  items!: ResponseGroupMemberEnrichedDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

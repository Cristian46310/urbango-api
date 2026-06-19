import { ApiProperty } from '@nestjs/swagger';
import { ResponseMembershipLogDto } from './response-membership-log.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponseMembershipLogListDto {
  @ApiProperty({ type: [ResponseMembershipLogDto] })
  items!: ResponseMembershipLogDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

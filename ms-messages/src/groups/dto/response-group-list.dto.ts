import { ApiProperty } from '@nestjs/swagger';
import { ResponseGroupDto } from './response-group.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponseGroupListDto {
  @ApiProperty({ type: [ResponseGroupDto] })
  items!: ResponseGroupDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

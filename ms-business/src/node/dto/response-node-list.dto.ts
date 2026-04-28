import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/shared/dto/pagination-meta.dto';
import { ResponseNodeDto } from './response-node.dto';

export class ResponseNodeListDto {
  @ApiProperty({ type: [ResponseNodeDto] })
  items!: ResponseNodeDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

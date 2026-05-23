import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';
import { ResponseGpsDto } from './response-gps.dto';

export class ResponseGpsListDto {
  @ApiProperty({ type: [ResponseGpsDto] })
  items!: ResponseGpsDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

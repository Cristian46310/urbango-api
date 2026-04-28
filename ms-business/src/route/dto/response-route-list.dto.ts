import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/shared/dto/pagination-meta.dto';
import { ResponseRouteDto } from './response-route.dto';

export class ResponseRouteListDto {
  @ApiProperty({ type: [ResponseRouteDto] })
  items!: ResponseRouteDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

import { ApiProperty } from '@nestjs/swagger';
import { ResponseAddressDto } from './response-address.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponseAddressListDto {
  @ApiProperty({ type: [ResponseAddressDto] })
  items!: ResponseAddressDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

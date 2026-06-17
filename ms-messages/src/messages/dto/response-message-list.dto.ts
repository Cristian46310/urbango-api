import { ApiProperty } from '@nestjs/swagger';
import { ResponseMessageDto } from './response-message.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponseMessageListDto {
  @ApiProperty({ type: [ResponseMessageDto] })
  items!: ResponseMessageDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

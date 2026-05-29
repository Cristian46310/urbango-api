import { ApiProperty } from '@nestjs/swagger';
import { ResponseCitizenTicketDto } from './response-citizen-ticket.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponseCitizenTicketListDto {
  @ApiProperty({ type: [ResponseCitizenTicketDto] })
  items!: ResponseCitizenTicketDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

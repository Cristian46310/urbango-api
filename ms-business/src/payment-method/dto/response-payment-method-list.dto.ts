import { ApiProperty } from '@nestjs/swagger';
import { ResponsePaymentMethodDto } from './response-payment-method.dto';
import { PaginationMetaDto } from '@/shared/dto/pagination-meta.dto';

export class ResponsePaymentMethodListDto {
  @ApiProperty({ type: [ResponsePaymentMethodDto] })
  items!: ResponsePaymentMethodDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

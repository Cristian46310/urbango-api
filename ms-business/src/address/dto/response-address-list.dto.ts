import { ResponseAddressDto } from './response-address.dto';

export class ResponseAddressListDto {
  items: ResponseAddressDto[];
  meta: Record<string, any>;
}

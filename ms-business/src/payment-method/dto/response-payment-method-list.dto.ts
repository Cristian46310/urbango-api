import { ResponsePaymentMethodDto } from './response-payment-method.dto';

export class ResponsePaymentMethodListDto {
  items: ResponsePaymentMethodDto[];
  meta: Record<string, any>;
}

import { ResponsePaymentMethodCitizenDto } from './response-payment-method-citizen.dto';

export class ResponsePaymentMethodCitizenListDto {
  items: ResponsePaymentMethodCitizenDto[];
  meta: Record<string, any>;
}

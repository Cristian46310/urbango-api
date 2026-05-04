import { PartialType } from '@nestjs/swagger';
import { CreatePaymentMethodCitizenDto } from './create-payment-method-citizen.dto';

export class UpdatePaymentMethodCitizenDto extends PartialType(
  CreatePaymentMethodCitizenDto,
) {}

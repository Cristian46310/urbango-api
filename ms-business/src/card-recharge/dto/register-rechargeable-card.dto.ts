import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class RegisterRechargeableCardDto {
  @ApiPropertyOptional({
    description:
      'ID del tipo de pago. Si se omite, usa el método "Tarjeta prepagada" del catálogo.',
  })
  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;
}

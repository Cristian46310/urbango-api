import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiPropertyOptional({
    example: 'CASH',
    description:
      'Código estable del catálogo (CASH, SYSTEM_CARD, EXTERNAL_CARD). Único.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[A-Z][A-Z0-9_]*$/, {
    message: 'code must be uppercase letters, digits and underscores',
  })
  code?: string;

  @ApiProperty({
    example: 'Efectivo',
    description: 'Nombre visible del método de pago',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Tarjeta prepagada recargable (p. ej. SYSTEM_CARD)',
  })
  @IsOptional()
  @IsBoolean()
  isRechargeable?: boolean;
}

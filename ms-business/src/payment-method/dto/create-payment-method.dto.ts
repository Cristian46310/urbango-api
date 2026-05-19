import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({
    example: 'Cash',
    description: 'Display name of the payment method',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Tarjeta prepagada recargable con ePayco',
  })
  @IsOptional()
  @IsBoolean()
  isRechargeable?: boolean;
}

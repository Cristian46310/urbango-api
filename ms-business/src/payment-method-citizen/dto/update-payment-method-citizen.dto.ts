import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdatePaymentMethodCitizenDto {
  @ApiProperty({ example: 15000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number;
}

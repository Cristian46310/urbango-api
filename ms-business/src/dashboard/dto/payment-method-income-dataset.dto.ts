import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PaymentMethodIncomeDatasetDto {
  @ApiProperty({ example: 'uuid' })
  @Expose()
  paymentMethodId!: string;

  @ApiProperty({ example: 'Tarjeta débito' })
  @Expose()
  paymentMethodName!: string;

  @ApiProperty({
    example: 'Tarjeta debito',
    description: 'Alias para librerias de graficos que esperan dataset.label',
  })
  @Expose()
  label!: string;

  @ApiProperty({
    example: [120000, 98000, 0],
    description: 'Ingresos por mes, alineados con labels',
  })
  @Expose()
  data!: number[];

  @ApiProperty({ example: 1500000 })
  @Expose()
  totalIncome!: number;
}

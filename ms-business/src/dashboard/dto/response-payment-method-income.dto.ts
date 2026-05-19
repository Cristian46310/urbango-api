import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ResponseDashboardPeriodDto } from './response-dashboard-period.dto';
import { PaymentMethodIncomeDatasetDto } from './payment-method-income-dataset.dto';

export class ResponsePaymentMethodIncomeDto {
  @ApiProperty({ type: ResponseDashboardPeriodDto })
  @Expose()
  @Type(() => ResponseDashboardPeriodDto)
  period!: ResponseDashboardPeriodDto;

  @ApiProperty({ example: ['2025-12', '2026-01', '2026-02'] })
  @Expose()
  labels!: string[];

  @ApiProperty({ type: [PaymentMethodIncomeDatasetDto] })
  @Expose()
  @Type(() => PaymentMethodIncomeDatasetDto)
  datasets!: PaymentMethodIncomeDatasetDto[];

  @ApiProperty({ example: 4200000 })
  @Expose()
  grandTotal!: number;

  @ApiProperty({
    example: 2,
    description:
      'Tickets completados en el período sin método de pago o con amount <= 0',
  })
  @Expose()
  excludedTicketsCount!: number;
}

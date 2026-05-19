import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentMethodIncomeService } from './services/payment-method-income.service';
import { IncidentTrendByTypeService } from './services/incident-trend-by-type.service';
import { DashboardPeriodQueryDto } from './dto/dashboard-period-query.dto';
import { DashboardIncidentTrendQueryDto } from './dto/dashboard-incident-trend-query.dto';
import { ResponsePaymentMethodIncomeDto } from './dto/response-payment-method-income.dto';
import { ResponseIncidentTrendByTypeDto } from './dto/response-incident-trend-by-type.dto';
import { DashboardPeriodMonths } from './enums/dashboard-period-months.enum';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly paymentMethodIncomeService: PaymentMethodIncomeService,
    private readonly incidentTrendByTypeService: IncidentTrendByTypeService,
  ) {}

  @Get('payment-method-income')
  @ApiOperation({
    summary: 'Ingresos por método de pago (evolución mensual)',
    description:
      'Agrega ingresos de tickets completados por mes y método de pago. ' +
      'Pensado para gráfico de barras apiladas en el dashboard financiero.',
  })
  @ApiOkResponse({ type: ResponsePaymentMethodIncomeDto })
  getPaymentMethodIncome(
    @Query() query: DashboardPeriodQueryDto,
  ): Promise<ResponsePaymentMethodIncomeDto> {
    return this.paymentMethodIncomeService.getPaymentMethodIncome(
      query.months ?? DashboardPeriodMonths.SIX,
    );
  }

  @Get('payment-method-income/export')
  @ApiOperation({
    summary: 'Exportar ingresos por método de pago (CSV)',
  })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportPaymentMethodIncome(
    @Query() query: DashboardPeriodQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const csv =
      await this.paymentMethodIncomeService.exportPaymentMethodIncomeCsv(
        query.months ?? DashboardPeriodMonths.SIX,
      );
    const months = query.months ?? DashboardPeriodMonths.SIX;
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payment-method-income-${months}m.csv"`,
    );
    res.send(csv);
  }

  @Get('incident-trend-by-type')
  @ApiOperation({
    summary: 'Evolución mensual de incidentes por tipo',
    description:
      'Agrega incidentes reportados por mes y tipo. ' +
      'Pensado para gráfico de líneas múltiples en el dashboard operativo.',
  })
  @ApiOkResponse({ type: ResponseIncidentTrendByTypeDto })
  getIncidentTrendByType(
    @Query() query: DashboardIncidentTrendQueryDto,
  ): Promise<ResponseIncidentTrendByTypeDto> {
    return this.incidentTrendByTypeService.getIncidentTrendByType(
      query.months ?? DashboardPeriodMonths.TWELVE,
      query.enterpriseId,
    );
  }

  @Get('incident-trend-by-type/export')
  @ApiOperation({
    summary: 'Exportar evolución de incidentes por tipo (CSV)',
  })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportIncidentTrendByType(
    @Query() query: DashboardIncidentTrendQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const months = query.months ?? DashboardPeriodMonths.TWELVE;
    const csv =
      await this.incidentTrendByTypeService.exportIncidentTrendByTypeCsv(
        months,
        query.enterpriseId,
      );
    const enterpriseSuffix = query.enterpriseId
      ? `-${query.enterpriseId}`
      : '-all';
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="incident-trend-by-type-${months}m${enterpriseSuffix}.csv"`,
    );
    res.send(csv);
  }
}

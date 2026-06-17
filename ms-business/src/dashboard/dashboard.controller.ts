import {
  Controller,
  Get,
  Header,
  Query,
  Res,
  StreamableFile,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
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
import { PassengerAgeDistributionService } from './services/passenger-age-distribution.service';
import { DashboardRealtimeService } from './services/dashboard-realtime.service';
import { DashboardPeriodQueryDto } from './dto/dashboard-period-query.dto';
import { DashboardIncidentTrendQueryDto } from './dto/dashboard-incident-trend-query.dto';
import { AgeDistributionQueryDto } from './dto/age-distribution-query.dto';
import { ResponsePaymentMethodIncomeDto } from './dto/response-payment-method-income.dto';
import { ResponseIncidentTrendByTypeDto } from './dto/response-incident-trend-by-type.dto';
import { AgeDistributionResponseDto } from './dto/age-distribution-response.dto';
import { ResponseRealtimeBusListDto } from './dto/response-realtime-bus-list.dto';
import { ResponseRealtimeBusDto } from './dto/response-realtime-bus.dto';
import { ResponseIncidentDto } from '@/incident/dto/response-incident.dto';
import { CreateArrivalNotificationDto } from './dto/create-arrival-notification.dto';
import { DashboardPeriodMonths } from './enums/dashboard-period-months.enum';

@ApiTags('dashboard')
@ApiBearerAuth()
@Authenticated()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly paymentMethodIncomeService: PaymentMethodIncomeService,
    private readonly incidentTrendByTypeService: IncidentTrendByTypeService,
    private readonly passengerAgeDistributionService: PassengerAgeDistributionService,
    private readonly dashboardRealtimeService: DashboardRealtimeService,
  ) {}

  @Get('realtime/fleet')
  @ApiOperation({
    summary: 'Estado de la flota en tiempo real',
    description:
      'Devuelve posición actual, ruta, paradero más cercano, pasajeros activos e incidentes activos por bus.',
  })
  @ApiOkResponse({ type: ResponseRealtimeBusListDto })
  getRealtimeFleet(
    @Query('enterpriseId') enterpriseId?: string,
    @Query('routeId') routeId?: string,
  ): Promise<ResponseRealtimeBusListDto> {
    return this.dashboardRealtimeService.getRealtimeFleet(enterpriseId, routeId);
  }

  @Get('realtime/incidents')
  @ApiOperation({
    summary: 'Lista de incidentes activos',
    description: 'Devuelve los incidentes no resueltos que afectan a la flota en tiempo real.',
  })
  @ApiOkResponse({ type: [ResponseIncidentDto] })
  getActiveIncidents(
    @Query('enterpriseId') enterpriseId?: string,
  ) {
    return this.dashboardRealtimeService.getActiveIncidents(enterpriseId);
  }

  @Get('realtime/bus/:id')
  @ApiOperation({
    summary: 'Estado en tiempo real de un bus específico',
    description:
      'Devuelve los datos de GPS y estado operativo de un bus, incluyendo su ruta, paradero siguiente y ETA.',
  })
  @ApiOkResponse({ type: ResponseRealtimeBusDto })
  getBusRealtimeStatus(@Param('id') id: string): Promise<ResponseRealtimeBusDto> {
    return this.dashboardRealtimeService.getBusRealtimeStatus(id);
  }

  @Post('realtime/arrival-notification')
  @ApiOperation({
    summary: 'Crear notificación de llegada para un bus o ruta',
    description:
      'Registra una suscripción y envía la alerta cuando el bus está dentro de los minutos de anticipación configurados.',
  })
  @ApiOkResponse({ type: Object })
  sendArrivalNotification(
    @Body() payload: CreateArrivalNotificationDto,
  ) {
    return this.dashboardRealtimeService.sendArrivalNotification(payload);
  }

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

  @Get('passengers/age-distribution')
  @ApiOperation({
    summary: 'Distribución porcentual de pasajeros por rango etario',
    description:
      'Calcula la edad de cada pasajero según fecha de nacimiento y fecha de viaje. ' +
      'Pensado para gráfico de torta y tabla comparativa vs mes anterior.',
  })
  @ApiOkResponse({ type: AgeDistributionResponseDto })
  getPassengerAgeDistribution(
    @Query() query: AgeDistributionQueryDto,
  ): Promise<AgeDistributionResponseDto> {
    return this.passengerAgeDistributionService.getAgeDistribution(query);
  }

  @Get('passengers/age-distribution/export/excel')
  @ApiOperation({
    summary: 'Exportar distribución etaria (Excel)',
  })
  @ApiProduces(
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  async exportPassengerAgeDistributionAsExcel(
    @Query() query: AgeDistributionQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { buffer, filename } =
      await this.passengerAgeDistributionService.exportAgeDistributionAsExcel(
        query,
      );

    response.set({
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(buffer);
  }
}

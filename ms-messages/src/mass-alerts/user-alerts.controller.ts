import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MassAlertsService } from './mass-alerts.service';
import {
  ResponseUserAlertDto,
  ResponseUserAlertListDto,
  ResponseUserAlertUnreadCountDto,
} from './dto/response-user-alert.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { AlertsQueryDto } from './dto/alerts-query.dto';

@ApiTags('Alerts (User)')
@ApiBearerAuth('bearer')
@Controller('alerts')
export class UserAlertsController {
  constructor(private readonly massAlertsService: MassAlertsService) {}

  @Get('unread-count')
  @Authenticated()
  @ApiOperation({ summary: 'Contador de alertas masivas sin leer' })
  @ApiOkResponse({ type: ResponseUserAlertUnreadCountDto })
  async unreadCount(
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseUserAlertUnreadCountDto> {
    const count = await this.massAlertsService.countUnreadUserAlerts(user.id);
    return { count };
  }

  @Get()
  @Authenticated()
  @ApiOperation({
    summary:
      'Bandeja de alertas masivas recibidas (solo lectura, sin respuesta)',
  })
  @ApiOkResponse({ type: ResponseUserAlertListDto })
  async list(
    @Query() query: AlertsQueryDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseUserAlertListDto> {
    return this.massAlertsService.listUserAlerts(user.id, query);
  }

  @Get(':id')
  @Authenticated()
  @ApiOperation({ summary: 'Detalle de alerta recibida' })
  @ApiParam({ name: 'id', description: 'ID de la alerta' })
  @ApiOkResponse({ type: ResponseUserAlertDto })
  async getById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseUserAlertDto> {
    return this.massAlertsService.getUserAlertById(id, user.id);
  }

  @Patch(':id/read')
  @Authenticated()
  @ApiOperation({ summary: 'Marcar alerta como leída' })
  @ApiParam({ name: 'id', description: 'ID de la alerta' })
  @ApiOkResponse({ type: ResponseUserAlertDto })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ResponseUserAlertDto> {
    return this.massAlertsService.markUserAlertAsRead(id, user.id);
  }
}

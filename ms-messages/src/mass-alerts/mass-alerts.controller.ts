import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { MassAlertsService } from './mass-alerts.service';
import {
  CreateMassAlertDto,
  PreviewMassAlertRecipientsDto,
} from './dto/create-mass-alert.dto';
import {
  ResponseMassAlertDto,
  ResponseMassAlertListDto,
  ResponseMassAlertRecipientCountDto,
  ResponseMassAlertStatsDto,
} from './dto/response-mass-alert.dto';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { Roles } from '@/auth/decorators/roles.decorator';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';

@ApiTags('Mass Alerts (Admin)')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({ description: 'JWT inválido o ausente' })
@ApiForbiddenResponse({
  description: 'El token no incluye el rol ADMIN (claim roles del JWT)',
})
@Controller('mass-alerts')
@Authenticated()
@UseGuards(RolesGuard)
@Roles('ADMIN')
export class MassAlertsController {
  constructor(private readonly massAlertsService: MassAlertsService) {}

  @Post('preview-recipients')
  @ApiOperation({
    summary: 'Contador de destinatarios antes de enviar (HU-ENTR-3-008)',
  })
  @ApiOkResponse({ type: ResponseMassAlertRecipientCountDto })
  async previewRecipients(
    @Body() dto: PreviewMassAlertRecipientsDto,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMassAlertRecipientCountDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    return this.massAlertsService.previewRecipients(dto, token);
  }

  @Post()
  @ApiOperation({
    summary:
      'Crear y enviar alerta masiva (inmediata o programada). Con previewOnly=true solo devuelve contador de destinatarios.',
  })
  @ApiCreatedResponse({ type: ResponseMassAlertDto })
  @ApiOkResponse({ type: ResponseMassAlertRecipientCountDto })
  async create(
    @Body() dto: CreateMassAlertDto,
    @CurrentUser() user: JwtPayload,
    @Headers('authorization') authorization: string,
  ): Promise<ResponseMassAlertDto | ResponseMassAlertRecipientCountDto> {
    const token = authorization.replace(/^Bearer\s+/i, '');
    if (dto.previewOnly) {
      return this.massAlertsService.previewRecipients(dto, token);
    }
    return this.massAlertsService.createAlert(user.id, dto, token);
  }

  @Get()
  @ApiOperation({ summary: 'Listar alertas masivas enviadas o programadas' })
  @ApiOkResponse({ type: ResponseMassAlertListDto })
  async list(
    @Query() pagination: PaginationQueryDto,
  ): Promise<ResponseMassAlertListDto> {
    return this.massAlertsService.listAdminAlerts(pagination);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Estadísticas de entrega y lectura post-envío',
  })
  @ApiParam({ name: 'id', description: 'ID de la alerta masiva' })
  @ApiOkResponse({ type: ResponseMassAlertStatsDto })
  async stats(@Param('id') id: string): Promise<ResponseMassAlertStatsDto> {
    return this.massAlertsService.getAlertStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una alerta masiva' })
  @ApiParam({ name: 'id', description: 'ID de la alerta masiva' })
  @ApiOkResponse({ type: ResponseMassAlertDto })
  async getById(@Param('id') id: string): Promise<ResponseMassAlertDto> {
    return this.massAlertsService.getAlertById(id);
  }
}

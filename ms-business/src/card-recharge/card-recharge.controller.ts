import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CardRechargeService } from './card-recharge.service';
import { Public } from '@/auth/decorators/public.decorator';
import { Authenticated } from '@/auth/decorators/authenticated.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtPayload } from '@/auth/types';
import {
  CardRechargeCheckoutDto,
  PreviewCardRechargeDto,
} from './dto/preview-card-recharge.dto';
import { ResponseCardRechargeConfigDto } from './dto/response-card-recharge-config.dto';
import { ResponseRechargeableCardDto } from './dto/response-rechargeable-card.dto';
import { ResponseCardRechargePreviewDto } from './dto/response-card-recharge-preview.dto';
import { ResponseCardRechargeCheckoutDto } from './dto/response-card-recharge-checkout.dto';
import { ResponseCardRechargeStatusDto } from './dto/response-card-recharge-status.dto';
import { RegisterRechargeableCardDto } from './dto/register-rechargeable-card.dto';

@ApiTags('Card Recharge (ePayco)')
@Controller('card-recharge')
export class CardRechargeController {
  constructor(
    private readonly cardRechargeService: CardRechargeService,
    private readonly configService: ConfigService,
  ) {}

  @Get('config')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Montos predefinidos, límites y comisión ePayco',
  })
  getConfig(): ResponseCardRechargeConfigDto {
    return this.cardRechargeService.getConfig();
  }

  @Get('cards')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Tarjetas recargables del ciudadano. Tras pagar en ePayco, consulte statusPollUrl del checkout',
  })
  listCards(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<ResponseRechargeableCardDto[]> {
    return this.cardRechargeService.listRechargeableCards(currentUser);
  }

  @Post('cards/register')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Obtener o crear tarjeta prepagada del ciudadano (solo JWT, sin RBAC)',
  })
  registerCard(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: RegisterRechargeableCardDto,
  ): Promise<ResponseRechargeableCardDto> {
    return this.cardRechargeService.registerRechargeableCard(currentUser, dto);
  }

  @Post('preview')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Vista previa: saldo actual, saldo después y comisión',
  })
  preview(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: PreviewCardRechargeDto,
  ): Promise<ResponseCardRechargePreviewDto> {
    return this.cardRechargeService.preview(currentUser, dto);
  }

  @Post('checkout')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Inicia recarga: crea referencia única y sesión ePayco (Continuar al pago)',
  })
  checkout(
    @CurrentUser() currentUser: JwtPayload,
    @Body() dto: CardRechargeCheckoutDto,
  ): Promise<ResponseCardRechargeCheckoutDto> {
    return this.cardRechargeService.startCheckout(currentUser, dto);
  }

  @Get('transactions/:reference/status')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Consultar estado tras el pago; en sandbox (EPAYCO_TEST_MODE) confirma pending y devuelve saldo',
  })
  getStatus(
    @CurrentUser() currentUser: JwtPayload,
    @Param('reference') reference: string,
  ): Promise<ResponseCardRechargeStatusDto> {
    return this.cardRechargeService.getTransactionStatus(
      currentUser,
      reference,
    );
  }

  @Post('transactions/:reference/confirm-local-test')
  @Authenticated()
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary:
      'Aplica recarga en BD tras pago aceptado en ePayco (solo sandbox/local sin webhook)',
  })
  confirmLocalTest(
    @CurrentUser() currentUser: JwtPayload,
    @Param('reference') reference: string,
  ): Promise<ResponseCardRechargeStatusDto> {
    return this.cardRechargeService.confirmLocalTestPayment(
      currentUser,
      reference,
    );
  }

  @Get('return')
  @Public()
  @ApiOperation({
    summary:
      'Retorno del navegador ePayco: confirma la recarga y redirige al front (usar en EPAYCO_RESPONSE_URL con URL pública)',
  })
  async returnFromEpayco(
    @Query() query: Record<string, string | string[] | undefined>,
    @Res() res: Response,
  ): Promise<void> {
    const payload = this.normalizeWebhookPayload({
      method: 'GET',
      query,
    } as unknown as Request);
    const result =
      await this.cardRechargeService.confirmFromEpaycoReturn(payload);

    const frontendBase =
      this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:5173';
    const returnToRaw =
      typeof query.returnTo === 'string' ? query.returnTo.trim() : '';
    const returnTo =
      returnToRaw.startsWith('/app') && !returnToRaw.includes('://')
        ? returnToRaw
        : '/app/card-recharge';

    const redirectUrl = new URL(
      `${frontendBase.replace(/\/$/, '')}/app/card-recharge/return`,
    );
    redirectUrl.searchParams.set('returnTo', returnTo);
    redirectUrl.searchParams.set('reference', result.reference);
    redirectUrl.searchParams.set('x_id_invoice', result.reference);
    redirectUrl.searchParams.set('status', result.status);

    res.redirect(302, redirectUrl.toString());
  }

  @Public()
  @Post('webhook/confirmation')
  @ApiOperation({
    summary:
      'Webhook ePayco (confirmación servidor a servidor). No usar desde el frontend.',
  })
  @ApiBody({
    description: 'Payload enviado por ePayco (form-urlencoded o JSON)',
    schema: { type: 'object', additionalProperties: true },
  })
  async confirmationWebhook(@Req() req: Request): Promise<string> {
    const payload = this.normalizeWebhookPayload(req);
    await this.cardRechargeService.handleWebhookConfirmation(payload);
    return 'OK';
  }

  private normalizeWebhookPayload(
    req: Request,
  ): Record<string, string | undefined> {
    const source =
      req.method === 'GET'
        ? (req.query as Record<string, string | undefined>)
        : ({
            ...(typeof req.body === 'object' && req.body !== null
              ? req.body
              : {}),
          } as Record<string, string | undefined>);

    const normalized: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined || value === null) continue;
      normalized[key] = Array.isArray(value) ? String(value[0]) : String(value);
    }
    return normalized;
  }
}

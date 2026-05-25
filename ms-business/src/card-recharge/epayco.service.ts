import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { createHash } from 'crypto';
import { AxiosResponse } from 'axios';
export type EpaycoSessionPayload = {
  checkout_version: string;
  name: string;
  currency: string;
  amount: number;
  description: string;
  invoice: string;
  lang: string;
  country: string;
  response?: string;
  confirmation?: string;
  billing?: {
    email: string;
    name: string;
  };
  extras?: Record<string, string>;
};

export type EpaycoWebhookPayload = Record<string, string | undefined>;

@Injectable()
export class EpaycoService {
  private readonly logger = new Logger(EpaycoService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('EPAYCO_PUBLIC_KEY') &&
      this.configService.get<string>('EPAYCO_PRIVATE_KEY'),
    );
  }

  isTestMode(): boolean {
    return this.configService.get<string>('EPAYCO_TEST_MODE') !== 'false';
  }

  getFeePercent(): number {
    const raw = this.configService.get<string>('EPAYCO_FEE_PERCENT');
    const parsed = raw ? Number.parseFloat(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : 2.99;
  }

  calculateFee(amountCop: number): number {
    const percent = this.getFeePercent();
    return Math.round((amountCop * percent) / 100);
  }

  /**
   * ePayco Apify rechaza localhost/127.0.0.1 en response y confirmation.
   * En local, omitir esos campos o usar URLs públicas (ngrok) vía EPAYCO_*_URL.
   */
  private isLocalCallbackUrl(url: string): boolean {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return (
        host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')
      );
    } catch {
      return false;
    }
  }

  private isPublicCallbackUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return false;
      }
      return !this.isLocalCallbackUrl(url);
    } catch {
      return false;
    }
  }

  private shouldKeepCallbackUrl(url: string): boolean {
    return this.isPublicCallbackUrl(url);
  }

  private buildSessionPayload(
    payload: EpaycoSessionPayload,
  ): EpaycoSessionPayload {
    const sessionPayload: EpaycoSessionPayload = { ...payload };

    if (payload.response && !this.shouldKeepCallbackUrl(payload.response)) {
      this.logger.warn(
        `ePayco: se omite response (Apify no acepta localhost; use EPAYCO_RESPONSE_URL con HTTPS público): ${payload.response}`,
      );
      delete sessionPayload.response;
    }

    if (
      payload.confirmation &&
      !this.shouldKeepCallbackUrl(payload.confirmation)
    ) {
      this.logger.warn(
        `ePayco: se omite confirmation (use EPAYCO_CONFIRMATION_URL con HTTPS público): ${payload.confirmation}`,
      );
      delete sessionPayload.confirmation;
    }

    return sessionPayload;
  }

  private formatEpaycoSessionError(data: {
    textResponse?: string;
    data?: { errors?: Array<{ errorMessage?: string }> };
  }): string {
    const validationErrors = data.data?.errors
      ?.map((entry) => entry.errorMessage)
      .filter((message): message is string => Boolean(message));

    if (validationErrors?.length) {
      return validationErrors.join('; ');
    }

    return data.textResponse ?? 'ePayco no devolvió sessionId';
  }

  async createCheckoutSession(
    payload: EpaycoSessionPayload,
  ): Promise<{ sessionId: string }> {
    const publicKey = this.configService.get<string>('EPAYCO_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('EPAYCO_PRIVATE_KEY');

    if (!publicKey || !privateKey) {
      throw new InternalServerErrorException(
        'ePayco no está configurado (EPAYCO_PUBLIC_KEY / EPAYCO_PRIVATE_KEY)',
      );
    }

    const basicAuth = Buffer.from(`${publicKey}:${privateKey}`).toString(
      'base64',
    );
    const sessionPayload = this.buildSessionPayload(payload);

    try {
      const loginResponse = await firstValueFrom(
        this.httpService.post<{ token: string }>(
          'https://apify.epayco.co/login',
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Basic ${basicAuth}`,
            },
          },
        ),
      );

      const token = loginResponse.data.token;
      if (!token) {
        throw new Error('ePayco login sin token');
      }
      
      const sessionResponse = await firstValueFrom(
        this.httpService.post<{
          success: boolean;
          textResponse?: string;
          data?: {
            sessionId?: string;
            errors?: Array<{ errorMessage?: string }>;
          };
        }>('https://apify.epayco.co/payment/session/create', sessionPayload, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      const sessionId = sessionResponse.data.data?.sessionId;
      if (!sessionResponse.data.success || !sessionId) {
        throw new Error(this.formatEpaycoSessionError(sessionResponse.data));
      }

      return { sessionId };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Error desconocido';

      this.logger.error(`Error creando sesión ePayco: ${reason}`, error);

      throw new InternalServerErrorException({
        message: 'No se pudo iniciar el pago con ePayco',
        reason,
      });
    }
  }

  validateWebhookSignature(payload: EpaycoWebhookPayload): boolean {
    const customerId = this.configService.get<string>('EPAYCO_CUSTOMER_ID');
    const pKey = this.configService.get<string>('EPAYCO_P_KEY');
    const signature = payload.x_signature;

    if (!customerId || !pKey || !signature) {
      this.logger.warn(
        'Webhook ePayco sin firma validable (faltan EPAYCO_CUSTOMER_ID, EPAYCO_P_KEY o x_signature)',
      );
      return this.configService.get<string>('EPAYCO_SKIP_SIGNATURE') === 'true';
    }

    const expected = createHash('sha256')
      .update(
        `${customerId}^${pKey}^${payload.x_ref_payco}^${payload.x_transaction_id}^${payload.x_amount}^${payload.x_currency_code}`,
      )
      .digest('hex');

    return expected === signature;
  }

  getConfirmationUrl(): string {
    const explicit = this.configService.get<string>('EPAYCO_CONFIRMATION_URL');
    if (explicit) return explicit;

    const base =
      this.configService.get<string>('MS_BUSINESS_PUBLIC_URL') ??
      `http://localhost:${this.configService.get<string>('PORT') ?? '3000'}`;

    return `${base.replace(/\/$/, '')}/card-recharge/webhook/confirmation`;
  }

  getDefaultResponseUrl(): string {
    const explicit = this.configService.get<string>('EPAYCO_RESPONSE_URL');
    if (explicit) {
      return explicit;
    }

    const base =
      this.configService.get<string>('MS_BUSINESS_PUBLIC_URL') ??
      `http://localhost:${this.configService.get<string>('PORT') ?? '3000'}`;

    return `${base.replace(/\/$/, '')}/card-recharge/return`;
  }

  getMerchantName(): string {
    return (
      this.configService.get<string>('EPAYCO_MERCHANT_NAME') ??
      'UCaldas Transporte'
    );
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  formatCardDisplay,
  generateTransportCardNumber,
} from './utils/card-number.util';
import { PaymentMethodCitizen } from '@/payment-method-citizen/entities/payment-method-citizen.entity';
import { PaymentMethod } from '@/payment-method/entities/payment-method.entity';
import { CitizenService } from '@/citizen/citizen.service';
import { PaymentMethodCitizenService } from '@/payment-method-citizen/payment-method-citizen.service';
import { RegisterRechargeableCardDto } from './dto/register-rechargeable-card.dto';
import { CardRechargeTransaction } from './entities/card-recharge-transaction.entity';
import { CardRechargeStatus } from './enums/card-recharge-status.enum';
import {
  MAX_RECHARGE_AMOUNT_COP,
  MIN_RECHARGE_AMOUNT_COP,
  PREDEFINED_RECHARGE_AMOUNTS_COP,
} from './constants/recharge.constants';
import { EpaycoService, EpaycoWebhookPayload } from './epayco.service';
import {
  CardRechargeCheckoutDto,
  PreviewCardRechargeDto,
} from './dto/preview-card-recharge.dto';
import { ResponseCardRechargeConfigDto } from './dto/response-card-recharge-config.dto';
import { ResponseRechargeableCardDto } from './dto/response-rechargeable-card.dto';
import { ResponseCardRechargePreviewDto } from './dto/response-card-recharge-preview.dto';
import { ResponseCardRechargeCheckoutDto } from './dto/response-card-recharge-checkout.dto';
import { ResponseCardRechargeStatusDto } from './dto/response-card-recharge-status.dto';
import type { JwtPayload } from '@/auth/types';
import {
  encodeApprovedReference,
  encodeFailedReference,
  encodeRejectedReference,
  extractReference,
  getTransactionStatus,
  isPendingTransaction,
} from './utils/card-recharge-transaction.util';
import { Like } from 'typeorm';

@Injectable()
export class CardRechargeService {
  private readonly logger = new Logger(CardRechargeService.name);

  constructor(
    @InjectRepository(PaymentMethodCitizen)
    private readonly pmcRepository: Repository<PaymentMethodCitizen>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(CardRechargeTransaction)
    private readonly transactionRepository: Repository<CardRechargeTransaction>,
    private readonly citizenService: CitizenService,
    private readonly paymentMethodCitizenService: PaymentMethodCitizenService,
    private readonly epaycoService: EpaycoService,
    private readonly dataSource: DataSource,
  ) {}

  async registerRechargeableCard(
    currentUser: JwtPayload,
    dto: RegisterRechargeableCardDto = {},
  ): Promise<ResponseRechargeableCardDto> {
    if (!currentUser?.id) {
      throw new BadRequestException('Usuario no identificado en el token');
    }

    let paymentMethodId = dto.paymentMethodId;
    if (!paymentMethodId) {
      const defaultMethod =
        (await this.paymentMethodRepository.findOne({
          where: { code: 'SYSTEM_CARD' },
        })) ??
        (await this.paymentMethodRepository.findOne({
          where: { isRechargeable: true },
          order: { createdAt: 'ASC' },
        }));
      if (!defaultMethod) {
        throw new BadRequestException(
          'No hay método de pago recargable en el catálogo. Ejecute la migración de seed o cree uno con isRechargeable: true',
        );
      }
      paymentMethodId = defaultMethod.id;
    } else {
      const pm = await this.paymentMethodRepository.findOne({
        where: { id: paymentMethodId, isRechargeable: true },
      });
      if (!pm) {
        throw new BadRequestException(
          'El método de pago no existe o no es recargable',
        );
      }
    }

    const pmc = await this.paymentMethodCitizenService.createForCitizenUser(
      currentUser.id,
      paymentMethodId,
    );

    return {
      id: pmc.id,
      cardDisplay: formatCardDisplay(pmc.cardNumber),
      currentBalance: pmc.balance ?? 0,
      paymentMethodName: pmc.paymentMethod?.name ?? 'Tarjeta prepagada',
      createdAt: pmc.createdAt,
    };
  }

  getConfig(): ResponseCardRechargeConfigDto {
    return {
      predefinedAmounts: [...PREDEFINED_RECHARGE_AMOUNTS_COP],
      minAmount: MIN_RECHARGE_AMOUNT_COP,
      maxAmount: MAX_RECHARGE_AMOUNT_COP,
      epaycoFeePercent: this.epaycoService.getFeePercent(),
      checkoutScriptUrl: 'https://checkout.epayco.co/checkout-v2.js',
    };
  }

  async listRechargeableCards(
    currentUser: JwtPayload,
  ): Promise<ResponseRechargeableCardDto[]> {
    const citizen = await this.citizenService.findByUserId(currentUser.id);

    try {
      const synced = await this.syncPendingSandboxPaymentsForCitizen(
        citizen.id,
      );
      if (synced > 0) {
        this.logger.log(
          `Sandbox: ${synced} recarga(s) pending acreditadas al listar tarjetas (ciudadano ${citizen.id})`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Sandbox: no se pudo auto-acreditar recargas pending al listar tarjetas: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const cards = await this.pmcRepository.find({
      where: { citizen: { id: citizen.id } },
      relations: ['paymentMethod'],
      order: { createdAt: 'DESC' },
    });

    return cards
      .filter((card) => card.paymentMethod?.isRechargeable)
      .map((card) => ({
        id: card.id,
        cardDisplay: formatCardDisplay(card.cardNumber),
        currentBalance: Number(card.balance ?? 0),
        paymentMethodName: card.paymentMethod?.name ?? 'Tarjeta prepagada',
        createdAt: card.createdAt,
      }));
  }

  async preview(
    currentUser: JwtPayload,
    dto: PreviewCardRechargeDto,
  ): Promise<ResponseCardRechargePreviewDto> {
    const card = await this.resolveOwnedRechargeableCard(
      currentUser,
      dto.paymentMethodCitizenId,
    );
    this.assertValidAmount(dto.amount);

    return this.buildPreview(card, dto.amount);
  }

  async startCheckout(
    currentUser: JwtPayload,
    dto: CardRechargeCheckoutDto,
  ): Promise<ResponseCardRechargeCheckoutDto> {
    const card = await this.resolveOwnedRechargeableCard(
      currentUser,
      dto.paymentMethodCitizenId,
    );
    this.assertValidAmount(dto.amount);

    const preview = this.buildPreview(card, dto.amount);
    const reference = this.generateReference();
    const description = `Recarga tarjeta transporte #${preview.cardDisplay}`;

    const transaction = this.transactionRepository.create({
      amount: dto.amount,
      epaycoTransactionId: reference,
      paymentMethodCitizen: { id: card.id } as PaymentMethodCitizen,
    });
    await this.transactionRepository.save(transaction);

    const { sessionId } = await this.epaycoService.createCheckoutSession({
      checkout_version: '2',
      name: this.epaycoService.getMerchantName(),
      currency: 'COP',
      amount: preview.totalToPay,
      description,
      invoice: reference,
      lang: 'ES',
      country: 'CO',
      response: dto.responseUrl ?? this.epaycoService.getDefaultResponseUrl(),
      confirmation: this.epaycoService.getConfirmationUrl(),
      billing: {
        email:
          currentUser.email ?? card.citizen.email ?? 'cliente@ucaldas.edu.co',
        name: currentUser.name ?? card.citizen.name,
      },
      extras: {
        extra1: card.id,
        extra2: card.citizen.id,
      },
    });

    const testMode = this.epaycoService.isTestMode();

    return {
      reference,
      sessionId,
      checkoutUrl: `https://checkout.epayco.co/?sessionId=${sessionId}`,
      preview,
      testMode,
      statusPollUrl: `/card-recharge/transactions/${reference}/status`,
    };
  }

  async getTransactionStatus(
    currentUser: JwtPayload,
    reference: string,
  ): Promise<ResponseCardRechargeStatusDto> {
    const citizen = await this.citizenService.findByUserId(currentUser.id);
    await this.syncPendingSandboxPaymentByReference(citizen.id, reference);

    const transaction = await this.findOwnedTransactionByReference(
      citizen.id,
      reference,
    );

    if (!transaction) {
      throw new NotFoundException('Transacción de recarga no encontrada');
    }

    const status = getTransactionStatus(transaction);
    let currentBalance: number | undefined;
    if (status === CardRechargeStatus.APPROVED) {
      const card = await this.pmcRepository.findOne({
        where: { id: transaction.paymentMethodCitizen.id },
      });
      currentBalance = card?.balance;
    }

    return {
      reference,
      status,
      amount: transaction.amount,
      currentBalance,
      completedAt:
        status === CardRechargeStatus.APPROVED
          ? transaction.createdAt
          : undefined,
    };
  }

  async handleWebhookConfirmation(
    payload: EpaycoWebhookPayload,
  ): Promise<void> {
    if (!this.epaycoService.validateWebhookSignature(payload)) {
      throw new BadRequestException('Firma ePayco inválida');
    }

    const reference = payload.x_id_invoice;
    if (!reference) {
      throw new BadRequestException('Referencia de recarga no encontrada');
    }

    const transaction = await this.transactionRepository.findOne({
      where: [
        { epaycoTransactionId: reference },
        { epaycoTransactionId: Like(`approved:${reference}:%`) },
        { epaycoTransactionId: encodeRejectedReference(reference) },
        { epaycoTransactionId: encodeFailedReference(reference) },
      ],
      relations: ['paymentMethodCitizen'],
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transacción de recarga ${reference} no encontrada`,
      );
    }

    if (getTransactionStatus(transaction) === CardRechargeStatus.APPROVED) {
      return;
    }

    const response = payload.x_response ?? '';
    const epaycoTransactionId = payload.x_transaction_id ?? 'unknown';

    if (response === 'Aceptada') {
      const paidAmount = Number.parseInt(payload.x_amount ?? '0', 10);
      const expectedTotal =
        transaction.amount +
        this.epaycoService.calculateFee(transaction.amount);
      if (
        Number.isFinite(paidAmount) &&
        paidAmount > 0 &&
        paidAmount !== expectedTotal
      ) {
        throw new BadRequestException(
          'Monto pagado no coincide con la recarga',
        );
      }

      await this.creditApprovedTransaction(transaction, epaycoTransactionId);
      return;
    }

    const ref = extractReference(transaction.epaycoTransactionId) ?? reference;
    if (response === 'Rechazada') {
      transaction.epaycoTransactionId = encodeRejectedReference(ref);
    } else if (response === 'Fallida') {
      transaction.epaycoTransactionId = encodeFailedReference(ref);
    }
    await this.transactionRepository.save(transaction);
  }

  /**
   * En local ePayco no puede llamar al webhook (localhost). Tras un pago aceptado en
   * sandbox, el front puede invocar esto con la referencia del checkout.
   * Solo con EPAYCO_TEST_MODE=true.
   */
  async confirmLocalTestPayment(
    currentUser: JwtPayload,
    reference: string,
  ): Promise<ResponseCardRechargeStatusDto> {
    if (!this.epaycoService.isTestMode()) {
      throw new ForbiddenException(
        'La confirmación local solo está disponible con EPAYCO_TEST_MODE=true',
      );
    }

    const citizen = await this.citizenService.findByUserId(currentUser.id);
    await this.syncPendingSandboxPaymentByReference(citizen.id, reference);

    return this.getTransactionStatus(currentUser, reference);
  }

  /**
   * Retorno del navegador tras pago ePayco (query params).
   * Nunca acredita saldo: solo informa estado. La acreditación es vía webhook
   * (producción) o confirm-local-test / sync autenticado (sandbox).
   */
  async confirmFromEpaycoReturn(
    payload: EpaycoWebhookPayload,
  ): Promise<{ reference: string; status: string }> {
    const reference = payload.x_id_invoice;
    if (!reference) {
      throw new BadRequestException(
        'Referencia de recarga no encontrada en retorno ePayco',
      );
    }

    const response = payload.x_response ?? '';
    if (response !== 'Aceptada') {
      return { reference, status: response || 'unknown' };
    }

    const transaction = await this.transactionRepository.findOne({
      where: [
        { epaycoTransactionId: reference },
        { epaycoTransactionId: Like(`approved:${reference}:%`) },
      ],
      relations: ['paymentMethodCitizen'],
    });

    if (!transaction) {
      throw new NotFoundException(
        `Transacción de recarga ${reference} no encontrada`,
      );
    }

    if (getTransactionStatus(transaction) === CardRechargeStatus.APPROVED) {
      return { reference, status: 'approved' };
    }

    return { reference, status: 'pending' };
  }

  /**
   * En sandbox acredita todas las recargas pending del ciudadano (p. ej. al listar tarjetas).
   */
  private async syncPendingSandboxPaymentsForCitizen(
    citizenId: string,
  ): Promise<number> {
    if (!this.epaycoService.isTestMode()) {
      return 0;
    }

    const pending = await this.transactionRepository.find({
      where: {
        paymentMethodCitizen: { citizen: { id: citizenId } },
        epaycoTransactionId: Like('RC-%'),
      },
      relations: ['paymentMethodCitizen'],
      order: { createdAt: 'ASC' },
    });

    for (const transaction of pending) {
      if (!isPendingTransaction(transaction)) continue;
      await this.creditApprovedTransaction(transaction, 'sandbox-auto-sync');
    }

    return pending.length;
  }

  /**
   * En sandbox, ePayco no llama al webhook en localhost: al consultar el estado
   * con la referencia del checkout se acredita si sigue pending.
   */
  private async syncPendingSandboxPaymentByReference(
    citizenId: string,
    reference: string,
  ): Promise<void> {
    if (!this.epaycoService.isTestMode()) {
      return;
    }

    const transaction = await this.findOwnedTransactionByReference(
      citizenId,
      reference,
    );

    if (!transaction || !isPendingTransaction(transaction)) {
      return;
    }

    await this.creditApprovedTransaction(transaction, 'sandbox-auto-sync');
  }

  private async creditApprovedTransaction(
    transaction: CardRechargeTransaction,
    epaycoTransactionId: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const txRepo = manager.getRepository(CardRechargeTransaction);
      const pmcRepo = manager.getRepository(PaymentMethodCitizen);

      const lockedTx = await txRepo.findOne({
        where: { id: transaction.id },
        relations: ['paymentMethodCitizen'],
        lock: { mode: 'pessimistic_write' },
      });

      if (
        !lockedTx ||
        getTransactionStatus(lockedTx) === CardRechargeStatus.APPROVED
      ) {
        return;
      }

      const paymentMethodCitizenId =
        lockedTx.paymentMethodCitizen?.id ??
        transaction.paymentMethodCitizen?.id;

      if (!paymentMethodCitizenId) {
        throw new BadRequestException(
          'La transacción de recarga no tiene tarjeta asociada',
        );
      }

      await pmcRepo.increment(
        { id: paymentMethodCitizenId },
        'balance',
        lockedTx.amount,
      );

      const reference =
        extractReference(lockedTx.epaycoTransactionId) ?? lockedTx.id;
      lockedTx.epaycoTransactionId = encodeApprovedReference(
        reference,
        epaycoTransactionId,
      );
      await txRepo.save(lockedTx);
    });
  }

  private async findOwnedTransactionByReference(
    citizenId: string,
    reference: string,
  ): Promise<CardRechargeTransaction | null> {
    const transaction = await this.transactionRepository.findOne({
      where: [
        { epaycoTransactionId: reference },
        { epaycoTransactionId: Like(`approved:${reference}:%`) },
        { epaycoTransactionId: encodeRejectedReference(reference) },
        { epaycoTransactionId: encodeFailedReference(reference) },
      ],
      relations: ['paymentMethodCitizen', 'paymentMethodCitizen.citizen'],
    });

    if (!transaction) return null;
    if (transaction.paymentMethodCitizen.citizen.id !== citizenId) {
      return null;
    }
    return transaction;
  }

  private buildPreview(
    card: PaymentMethodCitizen,
    amount: number,
  ): ResponseCardRechargePreviewDto {
    const feeAmount = this.epaycoService.calculateFee(amount);
    const totalToPay = amount + feeAmount;
    const currentBalance = card.balance ?? 0;
    const feePercent = this.epaycoService.getFeePercent();

    return {
      cardDisplay: formatCardDisplay(card.cardNumber),
      currentBalance,
      rechargeAmount: amount,
      feeAmount,
      totalToPay,
      balanceAfterRecharge: currentBalance + amount,
      epaycoFeePercent: feePercent,
      feeMessage: `Se aplicará una comisión del ${feePercent}% por transacción (ePayco).`,
    };
  }

  private async resolveOwnedRechargeableCard(
    currentUser: JwtPayload,
    paymentMethodCitizenId: string,
  ): Promise<PaymentMethodCitizen> {
    const citizen = await this.citizenService.findByUserId(currentUser.id);
    const card = await this.pmcRepository.findOne({
      where: { id: paymentMethodCitizenId },
      relations: ['paymentMethod', 'citizen'],
    });

    if (!card) {
      throw new NotFoundException('Tarjeta no encontrada');
    }

    if (card.citizen.id !== citizen.id) {
      throw new ForbiddenException('No puede recargar una tarjeta ajena');
    }

    if (!card.paymentMethod?.isRechargeable) {
      throw new BadRequestException(
        'El método de pago seleccionado no es una tarjeta recargable',
      );
    }

    return card;
  }

  private assertValidAmount(amount: number): void {
    if (amount < MIN_RECHARGE_AMOUNT_COP || amount > MAX_RECHARGE_AMOUNT_COP) {
      throw new BadRequestException(
        `El monto debe estar entre $${MIN_RECHARGE_AMOUNT_COP.toLocaleString('es-CO')} y $${MAX_RECHARGE_AMOUNT_COP.toLocaleString('es-CO')} COP`,
      );
    }
  }

  private generateReference(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = randomBytes(4).toString('hex');
    return `RC-${date}-${suffix}`;
  }
}

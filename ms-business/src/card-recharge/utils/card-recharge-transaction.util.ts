import { CardRechargeStatus } from '../enums/card-recharge-status.enum';
import { CardRechargeTransaction } from '../entities/card-recharge-transaction.entity';

const PENDING_PREFIX = 'RC-';
const APPROVED_PREFIX = 'approved:';
const REJECTED_PREFIX = 'rejected:';
const FAILED_PREFIX = 'failed:';

export function encodePendingReference(reference: string): string {
  return reference;
}

export function encodeApprovedReference(
  reference: string,
  epaycoTransactionId: string,
): string {
  return `${APPROVED_PREFIX}${reference}:${epaycoTransactionId}`;
}

export function encodeRejectedReference(reference: string): string {
  return `${REJECTED_PREFIX}${reference}`;
}

export function encodeFailedReference(reference: string): string {
  return `${FAILED_PREFIX}${reference}`;
}

export function extractReference(epaycoTransactionId?: string): string | null {
  if (!epaycoTransactionId) return null;
  if (epaycoTransactionId.startsWith(PENDING_PREFIX)) {
    return epaycoTransactionId;
  }
  if (epaycoTransactionId.startsWith(APPROVED_PREFIX)) {
    const payload = epaycoTransactionId.slice(APPROVED_PREFIX.length);
    const separator = payload.indexOf(':');
    return separator >= 0 ? payload.slice(0, separator) : payload;
  }
  if (epaycoTransactionId.startsWith(REJECTED_PREFIX)) {
    return epaycoTransactionId.slice(REJECTED_PREFIX.length);
  }
  if (epaycoTransactionId.startsWith(FAILED_PREFIX)) {
    return epaycoTransactionId.slice(FAILED_PREFIX.length);
  }
  return epaycoTransactionId;
}

export function getTransactionStatus(
  transaction: CardRechargeTransaction,
): CardRechargeStatus {
  const id = transaction.epaycoTransactionId ?? '';
  if (id.startsWith(REJECTED_PREFIX)) return CardRechargeStatus.REJECTED;
  if (id.startsWith(FAILED_PREFIX)) return CardRechargeStatus.FAILED;
  if (id.startsWith(APPROVED_PREFIX)) return CardRechargeStatus.APPROVED;
  return CardRechargeStatus.PENDING;
}

export function isPendingTransaction(
  transaction: CardRechargeTransaction,
): boolean {
  return getTransactionStatus(transaction) === CardRechargeStatus.PENDING;
}

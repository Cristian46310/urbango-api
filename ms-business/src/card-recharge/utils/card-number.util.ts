import { randomBytes } from 'crypto';

export function generateTransportCardNumber(): string {
  const suffix = randomBytes(4).toString('hex').toUpperCase();
  return `TC${Date.now().toString(36).toUpperCase()}${suffix}`.slice(0, 20);
}

export function formatCardDisplay(cardNumber?: string): string {
  if (!cardNumber) return '00000';
  const digits = cardNumber.replace(/\D/g, '');
  return digits.slice(-5).padStart(5, '0');
}

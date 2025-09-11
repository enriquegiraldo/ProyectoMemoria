// src/shared/logger/payment.ts
import { Logger } from 'winston';

export interface PaymentEvent {
  paymentId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  requestId?: string;
}

export const createPaymentMethods = (logger: Logger) => ({
  log: (level: 'info' | 'warn' | 'error', message: string, { paymentId, customerId, amount, currency, status, provider, requestId }: PaymentEvent) =>
    logger.log(level, message, { event: 'payment_event', paymentId, customerId, amount, currency, status, provider, requestId, timestamp: new Date().toISOString() }),
});

//export type { PaymentEvent };
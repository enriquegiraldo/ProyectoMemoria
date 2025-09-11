// src/shared/logger/webhook.ts
import { Logger } from 'winston';

export interface WebhookEvent {
  eventId: string;
  eventType: string;
  provider: string;
  processed: boolean;
  retryCount: number;
  requestId?: string;
}

export const createWebhookMethods = (logger: Logger) => ({
  log: (level: 'info' | 'warn' | 'error', message: string, { eventId, eventType, provider, processed, retryCount, requestId }: WebhookEvent) =>
    logger.log(level, message, { event: 'webhook_event', eventId, eventType, provider, processed, retryCount, requestId, timestamp: new Date().toISOString() }),
});

//export type { WebhookEvent };
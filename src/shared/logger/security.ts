// src/shared/logger/security.ts
import { Logger } from 'winston';
import { SecurityEvent } from './audit';

export const createSecurityMethods = (logger: Logger) => ({
  log: ({ event, severity, userId, ip, source, details, requestId }: SecurityEvent) =>
    logger.warn('Security event', { event, severity, userId, ip, source, details, requestId, timestamp: new Date().toISOString() }),
});

export type { SecurityEvent };
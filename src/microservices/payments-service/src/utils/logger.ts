// src/microservices/payments-service/src/utils/logger.ts
import {
  createBaseLogger,
  createHttpMiddleware,
  createAuditMethods,
  createPerformanceMethods,
  createPaymentMethods,
  createWebhookMethods,
  createSecurityMethods,
  LoggerConfig,
} from '@/../../src/shared/logger';

import  config  from '../config';

const loggerConfig: LoggerConfig = {
  service: 'payments-service',
  logLevel: config.server?.environment === 'production' ? 'info' : 'debug',
  environment: config.server?.environment || 'development',
  logDir: process.env['LOG_DIR'] || 'logs', //aqui el error La propiedad "LOG_DIR" procede de una signatura de índice, por lo que debe accederse a ella con ["LOG_DIR"].ts(4111) string | undefined
};

const baseLogger = createBaseLogger(loggerConfig);

export const { requestLogger, errorLogger } = createHttpMiddleware(baseLogger);
export const audit = createAuditMethods(baseLogger.child({ type: 'audit' }));
export const performance = createPerformanceMethods(baseLogger.child({ type: 'performance' }));
export const payment = createPaymentMethods(baseLogger.child({ type: 'payment' }));
export const webhook = createWebhookMethods(baseLogger.child({ type: 'webhook' }));
export const security = createSecurityMethods(baseLogger.child({ type: 'security' }));

export default baseLogger;
// src/microservices/notifications-service/src/utils/logger.ts
import {
  createBaseLogger,
  createHttpMiddleware,
  createAuditMethods,
  createPerformanceMethods,
  createNotificationMethods,
  LoggerConfig,
} from '@/shared/logger';
import { config } from '../config';

const loggerConfig: LoggerConfig = {
  service: 'notifications-service',
  logLevel: config.env === 'development' ? 'debug' : 'info',
  environment: config.env || 'development',
  logDir: process.env.LOG_DIR || 'logs',
};

const baseLogger = createBaseLogger(loggerConfig);

export const { requestLogger, errorLogger } = createHttpMiddleware(baseLogger);
export const audit = createAuditMethods(baseLogger.child({ type: 'audit' }));
export const performance = createPerformanceMethods(baseLogger.child({ type: 'performance' }));
export const notification = createNotificationMethods(baseLogger.child({ type: 'notification' }));

export default baseLogger;
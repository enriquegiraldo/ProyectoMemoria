// src/microservices/auth-service/utils/logger.ts
import {
  createBaseLogger,
  createHttpMiddleware,
  createAuditMethods,
  createPerformanceMethods,
  createMetricsMethods,
  LoggerConfig,
} from '@/shared/logger';
import { config } from '../config';

const loggerConfig: LoggerConfig = {
  service: 'auth-service',
  logLevel: config.monitoring?.logLevel || 'info',
  environment: config.nodeEnv || 'development',
  logDir: process.env.LOG_DIR || 'logs',
};

const baseLogger = createBaseLogger(loggerConfig);

export const { requestLogger, errorLogger } = createHttpMiddleware(baseLogger);
export const audit = createAuditMethods(baseLogger.child({ type: 'audit' }));
export const performance = createPerformanceMethods(baseLogger.child({ type: 'performance' }));
export const metrics = createMetricsMethods(baseLogger);

export default baseLogger;
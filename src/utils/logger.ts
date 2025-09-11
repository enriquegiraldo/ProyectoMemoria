// src/utils/logger.ts
import {
  createBaseLogger,
  createAuditMethods,
  createMetricsMethods,
  LoggerConfig,
} from '@/shared/logger';

const loggerConfig: LoggerConfig = {
  service: 'shared', // Nombre genérico para componentes compartidos
  logLevel: process.env.LOG_LEVEL || 'info',
  environment: process.env.NODE_ENV || 'development',
  logDir: process.env.LOG_DIR || 'logs',
};

const baseLogger = createBaseLogger(loggerConfig);

export const audit = createAuditMethods(baseLogger.child({ type: 'audit' }));
export const metrics = createMetricsMethods(baseLogger);

export default baseLogger;
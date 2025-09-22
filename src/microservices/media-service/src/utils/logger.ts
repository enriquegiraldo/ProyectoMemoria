// src/microservices/media-service/src/utils/logger.ts
import {
  createBaseLogger,
  createAuditMethods,
  createPerformanceMethods,
  createUploadMethods,
  createProcessingMethods,
  LoggerConfig,
} from '@../../../src/shared/logger';
import { config } from '../config';

const loggerConfig: LoggerConfig = {
  service: 'media-service',
  logLevel: config.monitoring?.logLevel || 'info',
  environment: config.server?.nodeEnv || 'development',
  logDir: process.env["LOG_DIR"] || 'logs',
};

const baseLogger = createBaseLogger(loggerConfig);

export const audit = createAuditMethods(baseLogger.child({ type: 'audit' }));
export const performance = createPerformanceMethods(baseLogger.child({ type: 'performance' }));
export const upload = createUploadMethods(baseLogger.child({ type: 'upload' }));
export const processing = createProcessingMethods(baseLogger.child({ type: 'processing' }));

export default baseLogger;
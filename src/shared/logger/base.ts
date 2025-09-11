// src/shared/logger/base.ts
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

export interface LoggerConfig {
  service: string;
  logDir?: string;
  logLevel?: string;
  environment?: string;
}

export const createBaseLogger = (config: LoggerConfig): winston.Logger => {
  const { service, logDir = 'logs', logLevel = 'info', environment = 'development' } = config;
  const isDev = environment !== 'production';

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  );

  const transports: winston.transport[] = [
    new DailyRotateFile({
      filename: path.join(logDir, `${service}-error-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      format: fileFormat,
    }),
    new DailyRotateFile({
      filename: path.join(logDir, `${service}-combined-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      format: fileFormat,
    }),
  ];

  if (isDev) {
    transports.push(new winston.transports.Console({ format: consoleFormat }));
  }

  const logger = winston.createLogger({
    level: logLevel,
    format: fileFormat,
    defaultMeta: { service },
    transports,
  });

  // Handlers globales
  logger.exceptions.handle(
    new DailyRotateFile({
      filename: path.join(logDir, `${service}-exceptions-%DATE%.log`),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
      format: fileFormat,
    })
  );

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString(),
      timestamp: new Date().toISOString(),
    });
  });

  return logger;
};
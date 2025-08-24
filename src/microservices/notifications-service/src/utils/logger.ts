import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config';

// Create custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console transport for development
const consoleTransport = new winston.transports.Console({
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  level: config.env === 'development' ? 'debug' : 'info',
});

// File transports for production
const errorTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

const combinedTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

const auditTransport = new DailyRotateFile({
  filename: 'logs/audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
});

const notificationTransport = new DailyRotateFile({
  filename: 'logs/notifications-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat,
});

// Main logger
export const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: { service: 'notifications-service' },
  transports: [
    consoleTransport,
    errorTransport,
    combinedTransport,
  ],
});

// Specialized loggers
export const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'notifications-service', type: 'audit' },
  transports: [auditTransport],
});

export const notificationLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'notifications-service', type: 'notification' },
  transports: [notificationTransport],
});

// Utility functions for different log types
export const logNotification = (level: string, message: string, meta?: any) => {
  notificationLogger.log(level, message, meta);
};

export const logAudit = (action: string, userId: string, resource: string, details?: any) => {
  auditLogger.info('Audit event', {
    action,
    userId,
    resource,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

export const logSecurity = (event: string, details: any) => {
  auditLogger.warn('Security event', {
    event,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

export const logPerformance = (operation: string, duration: number, details?: any) => {
  logger.info('Performance metric', {
    operation,
    duration,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new DailyRotateFile({
    filename: 'logs/exceptions-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
  })
);

logger.rejections.handle(
  new DailyRotateFile({
    filename: 'logs/rejections-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
  })
);

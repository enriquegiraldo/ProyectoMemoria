import winston from 'winston';
import config from '../config';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: config.server.environment === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'payments-service' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: config.server.environment === 'development' ? consoleFormat : logFormat,
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Create specialized loggers
export const auditLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'payments-service', type: 'audit' },
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

export const securityLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'payments-service', type: 'security' },
  transports: [
    new winston.transports.File({
      filename: 'logs/security.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

export const performanceLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'payments-service', type: 'performance' },
  transports: [
    new winston.transports.File({
      filename: 'logs/performance.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Payment-specific loggers
export const paymentLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'payments-service', type: 'payment' },
  transports: [
    new winston.transports.File({
      filename: 'logs/payments.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

export const webhookLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  defaultMeta: { service: 'payments-service', type: 'webhook' },
  transports: [
    new winston.transports.File({
      filename: 'logs/webhooks.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Helper functions for structured logging
export const logPayment = (level: string, message: string, paymentData: any) => {
  paymentLogger.log(level, message, {
    paymentId: paymentData.id,
    customerId: paymentData.customerId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: paymentData.status,
    provider: paymentData.provider,
  });
};

export const logWebhook = (level: string, message: string, webhookData: any) => {
  webhookLogger.log(level, message, {
    eventId: webhookData.id,
    eventType: webhookData.type,
    provider: webhookData.provider,
    processed: webhookData.processed,
    retryCount: webhookData.retryCount,
  });
};

export const logAudit = (action: string, userId: string, resource: string, details: any) => {
  auditLogger.info('Audit event', {
    action,
    userId,
    resource,
    details,
    timestamp: new Date().toISOString(),
  });
};

export const logSecurity = (event: string, details: any) => {
  securityLogger.warn('Security event', {
    event,
    details,
    timestamp: new Date().toISOString(),
  });
};

export const logPerformance = (operation: string, duration: number, details: any) => {
  performanceLogger.info('Performance metric', {
    operation,
    duration,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

logger.rejections.handle(
  new winston.transports.File({ filename: 'logs/rejections.log' })
);

export default logger;

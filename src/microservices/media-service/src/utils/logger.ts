import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config';

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// File format for production
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Main logger
const logger = winston.createLogger({
  level: config.monitoring.logLevel,
  format: fileFormat,
  defaultMeta: { service: 'media-service' },
  transports: [
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
});

// Add console transport for development
if (config.server.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Audit logger for security events
const auditLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'media-service', type: 'audit' },
  transports: [
    new DailyRotateFile({
      filename: 'logs/audit-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true,
    }),
  ],
});

// Performance logger
const performanceLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'media-service', type: 'performance' },
  transports: [
    new DailyRotateFile({
      filename: 'logs/performance-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    }),
  ],
});

// Upload logger
const uploadLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'media-service', type: 'upload' },
  transports: [
    new DailyRotateFile({
      filename: 'logs/upload-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    }),
  ],
});

// Processing logger
const processingLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'media-service', type: 'processing' },
  transports: [
    new DailyRotateFile({
      filename: 'logs/processing-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    }),
  ],
});

// Audit logging functions
export const audit = {
  fileUploaded: (userId: string, fileId: string, fileName: string, fileSize: number, ip: string, details?: any) => {
    auditLogger.info('File uploaded', {
      userId,
      fileId,
      fileName,
      fileSize,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  fileAccessed: (userId: string, fileId: string, action: string, ip: string, details?: any) => {
    auditLogger.info('File accessed', {
      userId,
      fileId,
      action,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  fileDeleted: (userId: string, fileId: string, ip: string, details?: any) => {
    auditLogger.info('File deleted', {
      userId,
      fileId,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  processingStarted: (userId: string, fileId: string, jobId: string, operation: string, ip: string, details?: any) => {
    auditLogger.info('Processing started', {
      userId,
      fileId,
      jobId,
      operation,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  processingCompleted: (userId: string, fileId: string, jobId: string, operation: string, duration: number, details?: any) => {
    auditLogger.info('Processing completed', {
      userId,
      fileId,
      jobId,
      operation,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  securityEvent: (userId: string, event: string, severity: 'low' | 'medium' | 'high' | 'critical', ip: string, details?: any) => {
    auditLogger.warn('Security event', {
      userId,
      event,
      severity,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  suspiciousActivity: (userId: string, activity: string, source: string, details?: any) => {
    auditLogger.error('Suspicious activity', {
      userId,
      activity,
      source,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Performance logging functions
export const performance = {
  uploadTime: (userId: string, fileId: string, fileSize: number, duration: number, details?: any) => {
    performanceLogger.info('Upload performance', {
      userId,
      fileId,
      fileSize,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  processingTime: (userId: string, fileId: string, jobId: string, operation: string, duration: number, details?: any) => {
    performanceLogger.info('Processing performance', {
      userId,
      fileId,
      jobId,
      operation,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  storageOperation: (userId: string, operation: string, provider: string, duration: number, details?: any) => {
    performanceLogger.info('Storage operation', {
      userId,
      operation,
      provider,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  cdnOperation: (userId: string, operation: string, duration: number, details?: any) => {
    performanceLogger.info('CDN operation', {
      userId,
      operation,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Upload logging functions
export const upload = {
  started: (userId: string, fileId: string, fileName: string, fileSize: number, mimeType: string, details?: any) => {
    uploadLogger.info('Upload started', {
      userId,
      fileId,
      fileName,
      fileSize,
      mimeType,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  completed: (userId: string, fileId: string, fileName: string, duration: number, details?: any) => {
    uploadLogger.info('Upload completed', {
      userId,
      fileId,
      fileName,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  failed: (userId: string, fileId: string, fileName: string, error: string, details?: any) => {
    uploadLogger.error('Upload failed', {
      userId,
      fileId,
      fileName,
      error,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  validationFailed: (userId: string, fileName: string, reason: string, details?: any) => {
    uploadLogger.warn('Upload validation failed', {
      userId,
      fileName,
      reason,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Processing logging functions
export const processing = {
  jobQueued: (userId: string, fileId: string, jobId: string, operation: string, details?: any) => {
    processingLogger.info('Processing job queued', {
      userId,
      fileId,
      jobId,
      operation,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  jobStarted: (userId: string, fileId: string, jobId: string, operation: string, details?: any) => {
    processingLogger.info('Processing job started', {
      userId,
      fileId,
      jobId,
      operation,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  jobCompleted: (userId: string, fileId: string, jobId: string, operation: string, duration: number, details?: any) => {
    processingLogger.info('Processing job completed', {
      userId,
      fileId,
      jobId,
      operation,
      duration,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  jobFailed: (userId: string, fileId: string, jobId: string, operation: string, error: string, details?: any) => {
    processingLogger.error('Processing job failed', {
      userId,
      fileId,
      jobId,
      operation,
      error,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  progress: (userId: string, fileId: string, jobId: string, operation: string, progress: number, details?: any) => {
    processingLogger.debug('Processing progress', {
      userId,
      fileId,
      jobId,
      operation,
      progress,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

export { logger, auditLogger, performanceLogger, uploadLogger, processingLogger };

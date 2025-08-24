import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '../config';

// Custom format for console output
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

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.monitoring.logLevel,
  format: fileFormat,
  defaultMeta: { service: 'memories-service' },
  transports: [
    // Error logs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    // Combined logs
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
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
}

// Create audit logger for security events
const auditLogger = winston.createLogger({
  level: 'info',
  format: fileFormat,
  defaultMeta: { service: 'memories-service', type: 'audit' },
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

// Audit logging methods
export const audit = {
  // Data access events
  dataAccess: (userId: string, action: string, resource: string, ip: string, details?: any) => {
    auditLogger.info('Data access', {
      userId,
      action,
      resource,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Memory creation events
  memoryCreated: (userId: string, memoryId: string, ip: string, details?: any) => {
    auditLogger.info('Memory created', {
      userId,
      memoryId,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Memory modification events
  memoryModified: (userId: string, memoryId: string, action: string, ip: string, details?: any) => {
    auditLogger.info('Memory modified', {
      userId,
      memoryId,
      action,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Memory deletion events
  memoryDeleted: (userId: string, memoryId: string, ip: string, details?: any) => {
    auditLogger.info('Memory deleted', {
      userId,
      memoryId,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // File upload events
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

  // File access events
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

  // Permission events
  permissionChanged: (userId: string, targetUserId: string, action: string, ip: string, details?: any) => {
    auditLogger.info('Permission changed', {
      userId,
      targetUserId,
      action,
      ip,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  // Security events
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

  // Suspicious activity
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

// Performance logging
export const performance = {
  // API response time
  apiResponse: (endpoint: string, method: string, duration: number, statusCode: number, userId?: string) => {
    logger.info('API response', {
      endpoint,
      method,
      duration,
      statusCode,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  // Database query performance
  dbQuery: (query: string, duration: number, table: string, userId?: string) => {
    logger.info('Database query', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration,
      table,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  // File processing performance
  fileProcessing: (fileId: string, operation: string, duration: number, fileSize: number, userId?: string) => {
    logger.info('File processing', {
      fileId,
      operation,
      duration,
      fileSize,
      userId,
      timestamp: new Date().toISOString(),
    });
  },

  // Cache performance
  cacheOperation: (operation: 'hit' | 'miss' | 'set' | 'delete', key: string, duration: number) => {
    logger.debug('Cache operation', {
      operation,
      key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
      duration,
      timestamp: new Date().toISOString(),
    });
  },
};

// Business metrics logging
export const metrics = {
  // Memory metrics
  memoryCreated: (userId: string, memoryType: string, hasMedia: boolean) => {
    logger.info('Memory created metric', {
      userId,
      memoryType,
      hasMedia,
      timestamp: new Date().toISOString(),
    });
  },

  // User engagement
  userEngagement: (userId: string, action: string, memoryId?: string) => {
    logger.info('User engagement', {
      userId,
      action,
      memoryId,
      timestamp: new Date().toISOString(),
    });
  },

  // Storage usage
  storageUsage: (userId: string, bytesUsed: number, fileCount: number) => {
    logger.info('Storage usage', {
      userId,
      bytesUsed,
      fileCount,
      timestamp: new Date().toISOString(),
    });
  },

  // Search metrics
  searchPerformed: (userId: string, query: string, resultCount: number, duration: number) => {
    logger.info('Search performed', {
      userId,
      query: query.substring(0, 50) + (query.length > 50 ? '...' : ''),
      resultCount,
      duration,
      timestamp: new Date().toISOString(),
    });
  },
};

export { logger, auditLogger };

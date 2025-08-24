import winston from 'winston';
import { config } from '../config';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: config.monitoring.logLevel,
  format: logFormat,
  defaultMeta: {
    service: 'auth-service',
    version: '1.0.0',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
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

// Add request logging middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// Add error logging middleware
export const errorLogger = (error: any, req: any, res: any, next: any) => {
  logger.error('Unhandled Error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
  });
  
  next(error);
};

// Audit logging for security events
export const auditLogger = {
  login: (userId: string, method: string, success: boolean, ip: string, userAgent: string) => {
    logger.info('User Login', {
      event: 'login',
      userId,
      method,
      success,
      ip,
      userAgent,
    });
  },

  logout: (userId: string, ip: string) => {
    logger.info('User Logout', {
      event: 'logout',
      userId,
      ip,
    });
  },

  passwordChange: (userId: string, ip: string) => {
    logger.info('Password Changed', {
      event: 'password_change',
      userId,
      ip,
    });
  },

  twoFactorEnabled: (userId: string, method: string, ip: string) => {
    logger.info('2FA Enabled', {
      event: '2fa_enabled',
      userId,
      method,
      ip,
    });
  },

  twoFactorDisabled: (userId: string, ip: string) => {
    logger.info('2FA Disabled', {
      event: '2fa_disabled',
      userId,
      ip,
    });
  },

  ssoLogin: (userId: string, provider: string, ip: string) => {
    logger.info('SSO Login', {
      event: 'sso_login',
      userId,
      provider,
      ip,
    });
  },

  permissionDenied: (userId: string, action: string, resource: string, ip: string) => {
    logger.warn('Permission Denied', {
      event: 'permission_denied',
      userId,
      action,
      resource,
      ip,
    });
  },

  suspiciousActivity: (userId: string, activity: string, ip: string, details: any) => {
    logger.warn('Suspicious Activity', {
      event: 'suspicious_activity',
      userId,
      activity,
      ip,
      details,
    });
  },

  dataAccess: (userId: string, action: string, resource: string, ip: string) => {
    logger.info('Data Access', {
      event: 'data_access',
      userId,
      action,
      resource,
      ip,
    });
  },

  dataExport: (userId: string, dataType: string, ip: string) => {
    logger.info('Data Export', {
      event: 'data_export',
      userId,
      dataType,
      ip,
    });
  },

  dataDeletion: (userId: string, dataType: string, ip: string) => {
    logger.info('Data Deletion', {
      event: 'data_deletion',
      userId,
      dataType,
      ip,
    });
  },
};

// Performance logging
export const performanceLogger = {
  databaseQuery: (query: string, duration: number, success: boolean) => {
    logger.info('Database Query', {
      event: 'database_query',
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      success,
    });
  },

  externalApiCall: (service: string, endpoint: string, duration: number, success: boolean) => {
    logger.info('External API Call', {
      event: 'external_api_call',
      service,
      endpoint,
      duration: `${duration}ms`,
      success,
    });
  },

  cacheHit: (key: string, duration: number) => {
    logger.debug('Cache Hit', {
      event: 'cache_hit',
      key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
      duration: `${duration}ms`,
    });
  },

  cacheMiss: (key: string, duration: number) => {
    logger.debug('Cache Miss', {
      event: 'cache_miss',
      key: key.substring(0, 50) + (key.length > 50 ? '...' : ''),
      duration: `${duration}ms`,
    });
  },
};

// Business metrics logging
export const metricsLogger = {
  userRegistration: (method: string, success: boolean) => {
    logger.info('User Registration', {
      event: 'user_registration',
      method,
      success,
    });
  },

  subscriptionChange: (userId: string, oldPlan: string, newPlan: string) => {
    logger.info('Subscription Change', {
      event: 'subscription_change',
      userId,
      oldPlan,
      newPlan,
    });
  },

  featureUsage: (userId: string, feature: string, usage: any) => {
    logger.info('Feature Usage', {
      event: 'feature_usage',
      userId,
      feature,
      usage,
    });
  },
};

// Development logging (only in development mode)
if (config.nodeEnv === 'development') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Handle uncaught exceptions
logger.exceptions.handle(
  new winston.transports.File({ filename: 'logs/exceptions.log' })
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });
});

export default logger;

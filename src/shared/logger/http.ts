// src/shared/logger/http.ts
import { Logger } from 'winston';

export const createHttpMiddleware = (logger: Logger) => ({
  requestLogger: (req: any, res: any, next: any) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id || 'anonymous',
        requestId: req.requestId, // Asumiendo middleware de tracing
        timestamp: new Date().toISOString(),
      });
    });
    next();
  },

  errorLogger: (error: any, req: any, res: any, next: any) => {
    logger.error('Unhandled Error', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
    next(error);
  },
});
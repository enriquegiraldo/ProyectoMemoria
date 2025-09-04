import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils';
import { 
  BaseError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError,
  NotificationError,
  TemplateError,
  SubscriptionError,
  ScheduleError,
  ProviderError,
  DatabaseError,
  ExternalServiceError,
  NetworkError,
  ConfigurationError,
  BusinessLogicError,
  formatErrorResponse 
} from '../utils/errors';

/**
 * Centralized Error Handling Middleware
 */
export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  });

  // Format error response
  const errorResponse = formatErrorResponse(error);

  // Send error response
  res.status(errorResponse.statusCode).json(errorResponse);
};

/**
 * 404 Handler Middleware
 */
export const notFoundMiddleware = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      details: `The requested route ${req.method} ${req.url} does not exist`,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch unhandled promise rejections
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Request Validation Middleware
 * Validates request body, query, and params using Zod schemas
 */
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationResult = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (!validationResult.success) {
        throw new ValidationError('Request validation failed', validationResult.error.errors);
      }

      // Update request with validated data
      req.body = validationResult.data.body || req.body;
      req.query = validationResult.data.query || req.query;
      req.params = validationResult.data.params || req.params;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Request ID Middleware
 * Adds a unique request ID to each request for tracing
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  // Add request ID to request object
  (req as any).requestId = requestId;
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);
  
  // Add request ID to logger context
  logger.defaultMeta = { ...logger.defaultMeta, requestId };
  
  next();
};

/**
 * Response Time Middleware
 * Logs response time for performance monitoring
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const requestId = (req as any).requestId;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  });
  
  next();
};

/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
};

/**
 * Security Headers Middleware
 * Adds security headers to responses
 */
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.header('Content-Security-Policy', "default-src 'self'");
  
  next();
};

/**
 * Rate Limiting Middleware
 * Basic rate limiting implementation
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // TODO: Implement proper rate limiting with Redis
  // For now, we'll just pass through
  next();
};

/**
 * Security Middleware
 * Combines security-related middleware
 */
export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  corsMiddleware(req, res, () => {
    securityHeadersMiddleware(req, res, next);
  });
};

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

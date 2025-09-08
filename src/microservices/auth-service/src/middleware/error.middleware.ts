// src/microservices/auth-service/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { CustomError } from '../utils/errors';

// Error response interface
interface AuthErrorResponse {
  success: false;
  message: string;
  error?: string;
  details?: any;
  timestamp: string;
  path: string;
  method: string;
  statusCode: number;
}

/**
 * Centralized error handling middleware
 */
export const errorHandler = (
  error: Error | CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorDetails: any = {};

  // Handle CustomError instances
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    errorDetails = error.details || {};
  } else {
    // Handle other types of errors
    switch (error.name) {
      case 'ValidationError':
        statusCode = 400;
        message = 'Validation Error';
        errorDetails = { validationErrors: error.message };
        break;

      case 'CastError':
        statusCode = 400;
        message = 'Invalid ID format';
        errorDetails = { field: (error as any).path };
        break;

      case 'MongoError':
        if ((error as any).code === 11000) {
          statusCode = 409;
          message = 'Duplicate key error';
          errorDetails = { field: (error as any).keyValue };
        }
        break;

      case 'JsonWebTokenError':
        statusCode = 401;
        message = 'Invalid token';
        break;

      case 'TokenExpiredError':
        statusCode = 401;
        message = 'Token expired';
        break;

      case 'SyntaxError':
        statusCode = 400;
        message = 'Invalid JSON';
        break;

      default:
        // Log unexpected errors
        logger.error('Unexpected error occurred', {
          error: error.message,
          stack: error.stack,
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: (req as any).user?.id || 'anonymous',
        });
    }
  }

  // Create error response
  const errorResponse: AuthErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode,
  };

  // Add error details in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error = error.message;
    errorResponse.details = {
      ...errorDetails,
      stack: error.stack,
    };
  }

  // Log error with appropriate level
  const logData = {
    error: error.message,
    statusCode,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id || 'anonymous',
    timestamp: new Date().toISOString(),
  };

  if (statusCode >= 500) {
    logger.error('Server Error', logData);
  } else if (statusCode >= 400) {
    logger.warn('Client Error', logData);
  } else {
    logger.info('Error', logData);
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const errorResponse: AuthErrorResponse = {
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode: 404,
  };

  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json(errorResponse);
};

/**
 * Request timeout handler
 */
export const timeoutHandler = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const errorResponse: AuthErrorResponse = {
          success: false,
          message: 'Request timeout',
          timestamp: new Date().toISOString(),
          path: req.path,
          method: req.method,
          statusCode: 408,
        };

        logger.warn('Request timeout', {
          method: req.method,
          url: req.url,
          ip: req.ip,
          timeoutMs,
        });

        res.status(408).json(errorResponse);
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Security error handler for security-related errors
 */
export const securityErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.message.includes('CSRF') || error.message.includes('XSS')) {
    logger.warn('Security violation detected', {
      error: error.message,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id || 'anonymous',
    });

    res.status(403).json({
      success: false,
      message: 'Security violation detected',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 403,
    });
    return;
  }

  next(error);
};

/**
 * Database error handler for database-related errors
 */
export const databaseErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.message.includes('connection') || error.message.includes('timeout')) {
    logger.error('Database connection error', {
      error: error.message,
      method: req.method,
      url: req.url,
      ip: req.ip,
    });

    res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 503,
    });
    return;
  }

  next(error);
};

/**
 * Rate limit error handler
 */
export const rateLimitErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
    logger.warn('Rate limit exceeded', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 429,
    });
    return;
  }

  next(error);
};

/**
 * Validation error handler for input validation errors
 */
export const validationErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.name === 'ValidationError' || error.message.includes('validation')) {
    logger.warn('Validation error', {
      error: error.message,
      method: req.method,
      url: req.url,
      ip: req.ip,
      body: req.body,
    });

    res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 400,
    });
    return;
  }

  next(error);
};

/**
 * Authentication error handler for auth-related errors
 */
export const authenticationErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (
    error.message.includes('token') ||
    error.message.includes('authentication') ||
    error.message.includes('unauthorized')
  ) {
    logger.warn('Authentication error', {
      error: error.message,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(401).json({
      success: false,
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 401,
    });
    return;
  }

  next(error);
};

/**
 * Authorization error handler for permission-related errors
 */
export const authorizationErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (
    error.message.includes('permission') ||
    error.message.includes('forbidden') ||
    error.message.includes('access denied')
  ) {
    logger.warn('Authorization error', {
      error: error.message,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: (req as any).user?.id || 'anonymous',
    });

    res.status(403).json({
      success: false,
      message: 'Access denied',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 403,
    });
    return;
  }

  next(error);
};

export default {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  timeoutHandler,
  securityErrorHandler,
  databaseErrorHandler,
  rateLimitErrorHandler,
  validationErrorHandler,
  authenticationErrorHandler,
  authorizationErrorHandler,
};
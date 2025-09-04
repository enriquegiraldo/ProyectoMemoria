import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { handleError, formatErrorResponse, CustomError } from '../utils/errors';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Handle known custom errors
    if (error instanceof CustomError) {
      logger.error('Custom error occurred', {
        error: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        userId: req.user?.id,
      });

      res.status(error.statusCode).json(formatErrorResponse(error));
      return;
    }

    // Handle unknown errors
    logger.error('Unhandled error occurred', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
      userId: req.user?.id,
    });

    // Don't expose internal errors in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({
      success: false,
      error: {
        message: isDevelopment ? error.message : 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (middlewareError) {
    // Fallback error response if error middleware itself fails
    logger.error('Error middleware failed', {
      originalError: error.message,
      middlewareError: middlewareError instanceof Error ? middlewareError.message : middlewareError,
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Async error wrapper for Express routes
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found middleware
 */
export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  logger.warn('Route not found', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
    },
  });
};

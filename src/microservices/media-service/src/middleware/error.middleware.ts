import { Request, Response, NextFunction } from 'express';
import { 
  CustomError, 
  handleError, 
  formatErrorResponse,
  ValidationError,
  FileUploadError,
  ProcessingError,
  StorageError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  AuthenticationError,
  AuthorizationError,
  TokenError,
  TokenExpiredError,
  TokenInvalidError,
  FileTooLargeError,
  InvalidFileTypeError,
  FileValidationError,
  FileCorruptedError,
  VirusDetectedError,
  ContentModerationError,
  ProcessingJobNotFoundError,
  ProcessingJobFailedError,
  ProcessingTimeoutError,
  UnsupportedFormatError,
  FileNotFoundError,
  StorageQuotaExceededError,
  StorageProviderError,
  CDNError,
  InvalidInputError,
  MissingRequiredFieldError,
  UploadLimitError,
  DatabaseConnectionError,
  DatabaseQueryError,
  ServiceUnavailableError,
  TimeoutError,
  NetworkError,
  ConnectionError,
  ConfigurationError,
  MissingConfigurationError,
  BusinessLogicError,
  ResourceNotFoundError,
  ResourceConflictError,
  ResourceLockedError
} from '../utils/errors';
import { logger } from '@/utils/logger';
import { metrics } from '@/utils/metrics';
import { config } from '@/config';

/**
 * Error handling middleware
 * Centralized error handling for all routes
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Convert to custom error if needed
  const customError = handleError(error);
  
  // Log error
  logError(customError, req);
  
  // Record metrics
  recordErrorMetrics(customError, req);
  
  // Format error response
  const errorResponse = formatErrorResponse(customError);
  
  // Add additional context in development
  if (config.server.nodeEnv === 'development') {
    errorResponse.error.stack = customError.stack;
    errorResponse.error.path = req.path;
    errorResponse.error.method = req.method;
    errorResponse.error.userId = req.user?.userId;
    errorResponse.error.ip = req.ip;
    errorResponse.error.userAgent = req.get('User-Agent');
  }
  
  // Send error response
  res.status(customError.statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new ResourceNotFoundError(`Route ${req.method} ${req.path} not found`);
  
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
  });
  
  metrics.recordError('routing', 'ROUTE_NOT_FOUND', 'media-service');
  
  const errorResponse = formatErrorResponse(error);
  errorResponse.error.path = req.path;
  errorResponse.error.method = req.method;
  
  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch unhandled promise rejections
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Log error with appropriate level
 */
function logError(error: CustomError, req: Request): void {
  const logContext = {
    errorCode: error.code,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    timestamp: new Date().toISOString(),
  };
  
  // Determine log level based on error type
  if (error.statusCode >= 500) {
    logger.error(`Server error: ${error.message}`, logContext);
  } else if (error.statusCode >= 400) {
    logger.warn(`Client error: ${error.message}`, logContext);
  } else {
    logger.info(`Information: ${error.message}`, logContext);
  }
  
  // Log stack trace for server errors
  if (error.statusCode >= 500 && error.stack) {
    logger.error('Stack trace:', { stack: error.stack });
  }
}

/**
 * Record error metrics
 */
function recordErrorMetrics(error: CustomError, req: Request): void {
  const errorType = getErrorType(error);
  const endpoint = req.path;
  
  metrics.recordError(errorType, error.code, 'media-service');
  
  // Record specific error types
  if (error instanceof ValidationError) {
    metrics.recordError('validation', error.code, 'media-service');
  } else if (error instanceof FileUploadError) {
    metrics.recordError('file_upload', error.code, 'media-service');
  } else if (error instanceof ProcessingError) {
    metrics.recordError('processing', error.code, 'media-service');
  } else if (error instanceof StorageError) {
    metrics.recordError('storage', error.code, 'media-service');
  } else if (error instanceof DatabaseError) {
    metrics.recordError('database', error.code, 'media-service');
  } else if (error instanceof AuthenticationError) {
    metrics.recordError('authentication', error.code, 'media-service');
  } else if (error instanceof AuthorizationError) {
    metrics.recordError('authorization', error.code, 'media-service');
  } else if (error instanceof RateLimitError) {
    metrics.recordError('rate_limit', error.code, 'media-service');
  }
}

/**
 * Get error type for metrics
 */
function getErrorType(error: CustomError): string {
  if (error instanceof ValidationError) return 'validation';
  if (error instanceof FileUploadError) return 'file_upload';
  if (error instanceof ProcessingError) return 'processing';
  if (error instanceof StorageError) return 'storage';
  if (error instanceof DatabaseError) return 'database';
  if (error instanceof AuthenticationError) return 'authentication';
  if (error instanceof AuthorizationError) return 'authorization';
  if (error instanceof RateLimitError) return 'rate_limit';
  if (error instanceof ExternalServiceError) return 'external_service';
  if (error instanceof NetworkError) return 'network';
  if (error instanceof ConfigurationError) return 'configuration';
  if (error instanceof BusinessLogicError) return 'business_logic';
  
  return 'unknown';
}

/**
 * Request validation error handler
 * Handles validation errors from Zod or other validation libraries
 */
export const validationErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.name === 'ZodError') {
    const validationError = new ValidationError('Request validation failed');
    validationError.details = error.errors;
    
    logger.warn('Validation error', {
      errors: error.errors,
      path: req.path,
      method: req.method,
      userId: req.user?.userId,
    });
    
    metrics.recordError('validation', 'ZOD_VALIDATION_ERROR', 'media-service');
    
    const errorResponse = formatErrorResponse(validationError);
    errorResponse.error.details = error.errors;
    
    res.status(400).json(errorResponse);
    return;
  }
  
  next(error);
};

/**
 * Multer error handler
 * Handles file upload errors from Multer
 */
export const multerErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.name === 'MulterError') {
    let customError: CustomError;
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        customError = new FileTooLargeError('File size exceeds limit');
        break;
      case 'LIMIT_FILE_COUNT':
        customError = new UploadLimitError('Too many files');
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        customError = new FileValidationError('Unexpected file field');
        break;
      case 'LIMIT_PART_COUNT':
        customError = new FileValidationError('Too many parts');
        break;
      case 'LIMIT_FIELD_KEY':
        customError = new FileValidationError('Field name too long');
        break;
      case 'LIMIT_FIELD_VALUE':
        customError = new FileValidationError('Field value too long');
        break;
      case 'LIMIT_FIELD_COUNT':
        customError = new FileValidationError('Too many fields');
        break;
      default:
        customError = new FileUploadError(error.message);
    }
    
    logger.warn('Multer error', {
      code: error.code,
      message: error.message,
      path: req.path,
      method: req.method,
      userId: req.user?.userId,
    });
    
    metrics.recordError('file_upload', error.code, 'media-service');
    
    const errorResponse = formatErrorResponse(customError);
    res.status(customError.statusCode).json(errorResponse);
    return;
  }
  
  next(error);
};

/**
 * Database error handler
 * Handles database-specific errors
 */
export const databaseErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.name === 'SequelizeError' || error.name === 'PrismaClientKnownRequestError') {
    let customError: CustomError;
    
    if (error.code === 'P2002') {
      customError = new ResourceConflictError('Resource already exists');
    } else if (error.code === 'P2025') {
      customError = new ResourceNotFoundError('Resource not found');
    } else if (error.code === 'P2003') {
      customError = new ValidationError('Foreign key constraint failed');
    } else {
      customError = new DatabaseError('Database operation failed');
    }
    
    logger.error('Database error', {
      code: error.code,
      message: error.message,
      path: req.path,
      method: req.method,
      userId: req.user?.userId,
    });
    
    metrics.recordError('database', error.code || 'DATABASE_ERROR', 'media-service');
    
    const errorResponse = formatErrorResponse(customError);
    res.status(customError.statusCode).json(errorResponse);
    return;
  }
  
  next(error);
};

/**
 * Unhandled promise rejection handler
 */
export const unhandledRejectionHandler = (reason: any, promise: Promise<any>): void => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });
  
  metrics.recordError('system', 'UNHANDLED_REJECTION', 'media-service');
  
  // In production, you might want to exit the process
  if (config.server.nodeEnv === 'production') {
    process.exit(1);
  }
};

/**
 * Uncaught exception handler
 */
export const uncaughtExceptionHandler = (error: Error): void => {
  logger.error('Uncaught exception', {
    message: error.message,
    stack: error.stack,
  });
  
  metrics.recordError('system', 'UNCAUGHT_EXCEPTION', 'media-service');
  
  // In production, you might want to exit the process
  if (config.server.nodeEnv === 'production') {
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdownHandler = (signal: string): void => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Close server
  process.exit(0);
};

/**
 * Error response formatter with additional context
 */
export const formatErrorResponseWithContext = (
  error: CustomError,
  req: Request,
  includeStack: boolean = false
) => {
  const errorResponse = formatErrorResponse(error);
  
  // Add request context
  errorResponse.error.path = req.path;
  errorResponse.error.method = req.method;
  errorResponse.error.ip = req.ip;
  errorResponse.error.userAgent = req.get('User-Agent');
  errorResponse.error.userId = req.user?.userId;
  
  // Add stack trace in development
  if (includeStack && config.server.nodeEnv === 'development') {
    errorResponse.error.stack = error.stack;
  }
  
  return errorResponse;
};

/**
 * Custom error response for specific error types
 */
export const createCustomErrorResponse = (
  errorType: string,
  message: string,
  statusCode: number = 500,
  details?: any
) => {
  return {
    success: false,
    error: {
      message,
      code: errorType.toUpperCase(),
      statusCode,
      timestamp: new Date().toISOString(),
      details,
    },
  };
};

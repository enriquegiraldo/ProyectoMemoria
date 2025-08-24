// Base custom error class
export class CustomError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication errors
export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
  }
}

export class TokenError extends CustomError {
  constructor(message: string = 'Invalid token') {
    super(message, 401, 'INVALID_TOKEN');
  }
}

export class TokenExpiredError extends CustomError {
  constructor(message: string = 'Token expired') {
    super(message, 401, 'TOKEN_EXPIRED');
  }
}

export class TokenInvalidError extends CustomError {
  constructor(message: string = 'Invalid token format') {
    super(message, 401, 'TOKEN_INVALID');
  }
}

// Authorization errors
export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS');
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = 'Access forbidden') {
    super(message, 403, 'ACCESS_FORBIDDEN');
  }
}

// File upload errors
export class FileUploadError extends CustomError {
  constructor(message: string = 'File upload failed') {
    super(message, 400, 'FILE_UPLOAD_FAILED');
  }
}

export class FileTooLargeError extends CustomError {
  constructor(message: string = 'File size exceeds limit') {
    super(message, 413, 'FILE_TOO_LARGE');
  }
}

export class InvalidFileTypeError extends CustomError {
  constructor(message: string = 'Invalid file type') {
    super(message, 400, 'INVALID_FILE_TYPE');
  }
}

export class FileValidationError extends CustomError {
  constructor(message: string = 'File validation failed') {
    super(message, 400, 'FILE_VALIDATION_FAILED');
  }
}

export class FileCorruptedError extends CustomError {
  constructor(message: string = 'File appears to be corrupted') {
    super(message, 400, 'FILE_CORRUPTED');
  }
}

export class VirusDetectedError extends CustomError {
  constructor(message: string = 'Virus detected in file') {
    super(message, 400, 'VIRUS_DETECTED');
  }
}

export class ContentModerationError extends CustomError {
  constructor(message: string = 'Content violates community guidelines') {
    super(message, 400, 'CONTENT_MODERATION_FAILED');
  }
}

// Processing errors
export class ProcessingError extends CustomError {
  constructor(message: string = 'File processing failed') {
    super(message, 500, 'PROCESSING_FAILED');
  }
}

export class ProcessingJobNotFoundError extends CustomError {
  constructor(message: string = 'Processing job not found') {
    super(message, 404, 'PROCESSING_JOB_NOT_FOUND');
  }
}

export class ProcessingJobFailedError extends CustomError {
  constructor(message: string = 'Processing job failed') {
    super(message, 500, 'PROCESSING_JOB_FAILED');
  }
}

export class ProcessingTimeoutError extends CustomError {
  constructor(message: string = 'Processing timeout') {
    super(message, 408, 'PROCESSING_TIMEOUT');
  }
}

export class UnsupportedFormatError extends CustomError {
  constructor(message: string = 'Unsupported file format') {
    super(message, 400, 'UNSUPPORTED_FORMAT');
  }
}

// Storage errors
export class StorageError extends CustomError {
  constructor(message: string = 'Storage operation failed') {
    super(message, 500, 'STORAGE_ERROR');
  }
}

export class FileNotFoundError extends CustomError {
  constructor(message: string = 'File not found') {
    super(message, 404, 'FILE_NOT_FOUND');
  }
}

export class StorageQuotaExceededError extends CustomError {
  constructor(message: string = 'Storage quota exceeded') {
    super(message, 413, 'STORAGE_QUOTA_EXCEEDED');
  }
}

export class StorageProviderError extends CustomError {
  constructor(message: string = 'Storage provider error') {
    super(message, 500, 'STORAGE_PROVIDER_ERROR');
  }
}

export class CDNError extends CustomError {
  constructor(message: string = 'CDN operation failed') {
    super(message, 500, 'CDN_ERROR');
  }
}

// Validation errors
export class ValidationError extends CustomError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class InvalidInputError extends CustomError {
  constructor(message: string = 'Invalid input') {
    super(message, 400, 'INVALID_INPUT');
  }
}

export class MissingRequiredFieldError extends CustomError {
  constructor(message: string = 'Missing required field') {
    super(message, 400, 'MISSING_REQUIRED_FIELD');
  }
}

// Rate limiting errors
export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class UploadLimitError extends CustomError {
  constructor(message: string = 'Upload limit exceeded') {
    super(message, 429, 'UPLOAD_LIMIT_EXCEEDED');
  }
}

// Database errors
export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
  }
}

export class DatabaseConnectionError extends CustomError {
  constructor(message: string = 'Database connection failed') {
    super(message, 500, 'DATABASE_CONNECTION_ERROR');
  }
}

export class DatabaseQueryError extends CustomError {
  constructor(message: string = 'Database query failed') {
    super(message, 500, 'DATABASE_QUERY_ERROR');
  }
}

// External service errors
export class ExternalServiceError extends CustomError {
  constructor(message: string = 'External service error') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

export class TimeoutError extends CustomError {
  constructor(message: string = 'Request timeout') {
    super(message, 408, 'TIMEOUT');
  }
}

// Network errors
export class NetworkError extends CustomError {
  constructor(message: string = 'Network error') {
    super(message, 500, 'NETWORK_ERROR');
  }
}

export class ConnectionError extends CustomError {
  constructor(message: string = 'Connection failed') {
    super(message, 500, 'CONNECTION_ERROR');
  }
}

// Configuration errors
export class ConfigurationError extends CustomError {
  constructor(message: string = 'Configuration error') {
    super(message, 500, 'CONFIGURATION_ERROR');
  }
}

export class MissingConfigurationError extends CustomError {
  constructor(message: string = 'Missing configuration') {
    super(message, 500, 'MISSING_CONFIGURATION');
  }
}

// Business logic errors
export class BusinessLogicError extends CustomError {
  constructor(message: string = 'Business logic error') {
    super(message, 400, 'BUSINESS_LOGIC_ERROR');
  }
}

export class ResourceNotFoundError extends CustomError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'RESOURCE_NOT_FOUND');
  }
}

export class ResourceConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'RESOURCE_CONFLICT');
  }
}

export class ResourceLockedError extends CustomError {
  constructor(message: string = 'Resource is locked') {
    super(message, 423, 'RESOURCE_LOCKED');
  }
}

// Utility functions
export const handleError = (error: Error): CustomError => {
  if (error instanceof CustomError) {
    return error;
  }

  // Handle known error types
  if (error.name === 'ValidationError') {
    return new ValidationError(error.message);
  }

  if (error.name === 'CastError') {
    return new ValidationError('Invalid data format');
  }

  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return new DatabaseError(error.message);
  }

  if (error.name === 'MulterError') {
    switch (error.message) {
      case 'LIMIT_FILE_SIZE':
        return new FileTooLargeError('File size exceeds limit');
      case 'LIMIT_FILE_COUNT':
        return new UploadLimitError('Too many files');
      case 'LIMIT_UNEXPECTED_FILE':
        return new FileValidationError('Unexpected file field');
      default:
        return new FileUploadError(error.message);
    }
  }

  if (error.name === 'SyntaxError') {
    return new ValidationError('Invalid JSON format');
  }

  if (error.name === 'TypeError') {
    return new ValidationError('Invalid data type');
  }

  if (error.name === 'ReferenceError') {
    return new CustomError('Reference error', 500, 'REFERENCE_ERROR', false);
  }

  if (error.name === 'RangeError') {
    return new ValidationError('Value out of range');
  }

  if (error.name === 'URIError') {
    return new ValidationError('Invalid URI');
  }

  if (error.name === 'EvalError') {
    return new CustomError('Evaluation error', 500, 'EVAL_ERROR', false);
  }

  // Default to internal server error
  return new CustomError('Internal server error', 500, 'INTERNAL_SERVER_ERROR', false);
};

// Error response formatter
export const formatErrorResponse = (error: CustomError) => {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      path: error.stack?.split('\n')[1]?.trim() || 'unknown',
    },
  };
};

// Error codes mapping
export const ERROR_CODES = {
  // Authentication
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCESS_FORBIDDEN: 'ACCESS_FORBIDDEN',

  // File operations
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_VALIDATION_FAILED: 'FILE_VALIDATION_FAILED',
  FILE_CORRUPTED: 'FILE_CORRUPTED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',

  // Security
  VIRUS_DETECTED: 'VIRUS_DETECTED',
  CONTENT_MODERATION_FAILED: 'CONTENT_MODERATION_FAILED',

  // Processing
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  PROCESSING_JOB_NOT_FOUND: 'PROCESSING_JOB_NOT_FOUND',
  PROCESSING_JOB_FAILED: 'PROCESSING_JOB_FAILED',
  PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',

  // Storage
  STORAGE_ERROR: 'STORAGE_ERROR',
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_PROVIDER_ERROR: 'STORAGE_PROVIDER_ERROR',
  CDN_ERROR: 'CDN_ERROR',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UPLOAD_LIMIT_EXCEEDED: 'UPLOAD_LIMIT_EXCEEDED',

  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR: 'DATABASE_QUERY_ERROR',

  // External services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',

  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // Configuration
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  MISSING_CONFIGURATION: 'MISSING_CONFIGURATION',

  // Business logic
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',

  // System errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  REFERENCE_ERROR: 'REFERENCE_ERROR',
  EVAL_ERROR: 'EVAL_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

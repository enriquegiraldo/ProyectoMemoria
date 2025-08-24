// Base custom error class
export class CustomError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication errors
export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class TokenError extends CustomError {
  constructor(message: string = 'Invalid token') {
    super(message, 401);
  }
}

export class TokenExpiredError extends CustomError {
  constructor(message: string = 'Token has expired') {
    super(message, 401);
  }
}

export class TokenInvalidError extends CustomError {
  constructor(message: string = 'Invalid token format') {
    super(message, 401);
  }
}

// Memory-related errors
export class MemoryNotFoundError extends CustomError {
  constructor(memoryId: string) {
    super(`Memory with ID ${memoryId} not found`, 404);
  }
}

export class MemoryAccessDeniedError extends CustomError {
  constructor(memoryId: string) {
    super(`Access denied to memory ${memoryId}`, 403);
  }
}

export class MemoryValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class MemoryLimitExceededError extends CustomError {
  constructor(message: string = 'Memory limit exceeded') {
    super(message, 413);
  }
}

// File-related errors
export class FileNotFoundError extends CustomError {
  constructor(fileId: string) {
    super(`File with ID ${fileId} not found`, 404);
  }
}

export class FileUploadError extends CustomError {
  constructor(message: string = 'File upload failed') {
    super(message, 400);
  }
}

export class FileSizeLimitError extends CustomError {
  constructor(maxSize: number) {
    super(`File size exceeds limit of ${maxSize} bytes`, 413);
  }
}

export class FileTypeNotAllowedError extends CustomError {
  constructor(fileType: string) {
    super(`File type ${fileType} is not allowed`, 400);
  }
}

export class FileProcessingError extends CustomError {
  constructor(message: string = 'File processing failed') {
    super(message, 500);
  }
}

export class FileStorageError extends CustomError {
  constructor(message: string = 'File storage error') {
    super(message, 500);
  }
}

// User-related errors
export class UserNotFoundError extends CustomError {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`, 404);
  }
}

export class UserAlreadyExistsError extends CustomError {
  constructor(message: string = 'User already exists') {
    super(message, 409);
  }
}

// Database errors
export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500);
  }
}

export class DatabaseConnectionError extends CustomError {
  constructor(message: string = 'Database connection failed') {
    super(message, 503);
  }
}

// Cache errors
export class CacheError extends CustomError {
  constructor(message: string = 'Cache operation failed') {
    super(message, 500);
  }
}

export class CacheConnectionError extends CustomError {
  constructor(message: string = 'Cache connection failed') {
    super(message, 503);
  }
}

// External service errors
export class ExternalServiceError extends CustomError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502);
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(service: string) {
    super(`Service ${service} is unavailable`, 503);
  }
}

// Validation errors
export class ValidationError extends CustomError {
  public errors: any[];

  constructor(message: string, errors: any[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class InvalidInputError extends CustomError {
  constructor(message: string = 'Invalid input data') {
    super(message, 400);
  }
}

// Rate limiting errors
export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
  }
}

// Search errors
export class SearchError extends CustomError {
  constructor(message: string = 'Search operation failed') {
    super(message, 500);
  }
}

export class InvalidSearchQueryError extends CustomError {
  constructor(message: string = 'Invalid search query') {
    super(message, 400);
  }
}

// Media processing errors
export class MediaProcessingError extends CustomError {
  constructor(message: string = 'Media processing failed') {
    super(message, 500);
  }
}

export class UnsupportedMediaTypeError extends CustomError {
  constructor(mediaType: string) {
    super(`Unsupported media type: ${mediaType}`, 400);
  }
}

// Email errors
export class EmailError extends CustomError {
  constructor(message: string = 'Email operation failed') {
    super(message, 500);
  }
}

// Notification errors
export class NotificationError extends CustomError {
  constructor(message: string = 'Notification operation failed') {
    super(message, 500);
  }
}

// Permission errors
export class PermissionError extends CustomError {
  constructor(message: string = 'Permission denied') {
    super(message, 403);
  }
}

export class InsufficientPermissionsError extends CustomError {
  constructor(requiredPermission: string) {
    super(`Insufficient permissions. Required: ${requiredPermission}`, 403);
  }
}

// Resource errors
export class ResourceNotFoundError extends CustomError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 404);
  }
}

export class ResourceConflictError extends CustomError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

// Configuration errors
export class ConfigurationError extends CustomError {
  constructor(message: string = 'Configuration error') {
    super(message, 500);
  }
}

// Network errors
export class NetworkError extends CustomError {
  constructor(message: string = 'Network error') {
    super(message, 503);
  }
}

export class TimeoutError extends CustomError {
  constructor(message: string = 'Request timeout') {
    super(message, 408);
  }
}

// Security errors
export class SecurityError extends CustomError {
  constructor(message: string = 'Security violation') {
    super(message, 403);
  }
}

export class MaliciousInputError extends CustomError {
  constructor(message: string = 'Malicious input detected') {
    super(message, 400);
  }
}

// Business logic errors
export class BusinessLogicError extends CustomError {
  constructor(message: string = 'Business logic error') {
    super(message, 400);
  }
}

export class StateTransitionError extends CustomError {
  constructor(message: string = 'Invalid state transition') {
    super(message, 400);
  }
}

// Error handler utility
export const handleError = (error: Error): CustomError => {
  if (error instanceof CustomError) {
    return error;
  }

  // Handle known error types
  if (error.name === 'ValidationError') {
    return new ValidationError(error.message);
  }

  if (error.name === 'CastError') {
    return new InvalidInputError('Invalid ID format');
  }

  if (error.name === 'MongoError' || error.name === 'PostgresError') {
    return new DatabaseError(error.message);
  }

  if (error.name === 'JsonWebTokenError') {
    return new TokenInvalidError('Invalid token');
  }

  if (error.name === 'TokenExpiredError') {
    return new TokenExpiredError('Token has expired');
  }

  if (error.name === 'MulterError') {
    return new FileUploadError(error.message);
  }

  // Default to internal server error
  return new CustomError('Internal server error', 500, false);
};

// Error response formatter
export const formatErrorResponse = (error: CustomError) => {
  return {
    error: {
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
      path: error.stack?.split('\n')[1]?.trim() || 'unknown',
    },
  };
};

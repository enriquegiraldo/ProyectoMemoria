/**
 * Custom error class for better error handling
 */
export class CustomError extends Error {
  public statusCode: number;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    
    // Ensure proper inheritance
    Object.setPrototypeOf(this, CustomError.prototype);
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }
}

/**
 * Authentication specific errors
 */
export class AuthenticationError extends CustomError {
  constructor(message: string = 'Authentication failed', details?: any) {
    super(message, 401, details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 403, details);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 429, details);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message: string = 'Service temporarily unavailable', details?: any) {
    super(message, 503, details);
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Database specific errors
 */
export class DatabaseError extends CustomError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, details);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

export class ConnectionError extends CustomError {
  constructor(message: string = 'Database connection failed', details?: any) {
    super(message, 503, details);
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

/**
 * Token specific errors
 */
export class TokenError extends CustomError {
  constructor(message: string = 'Token validation failed', details?: any) {
    super(message, 401, details);
    Object.setPrototypeOf(this, TokenError.prototype);
  }
}

export class TokenExpiredError extends CustomError {
  constructor(message: string = 'Token has expired', details?: any) {
    super(message, 401, details);
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

export class TokenInvalidError extends CustomError {
  constructor(message: string = 'Invalid token', details?: any) {
    super(message, 401, details);
    Object.setPrototypeOf(this, TokenInvalidError.prototype);
  }
}

/**
 * User specific errors
 */
export class UserNotFoundError extends CustomError {
  constructor(message: string = 'User not found', details?: any) {
    super(message, 404, details);
    Object.setPrototypeOf(this, UserNotFoundError.prototype);
  }
}

export class UserAlreadyExistsError extends CustomError {
  constructor(message: string = 'User already exists', details?: any) {
    super(message, 409, details);
    Object.setPrototypeOf(this, UserAlreadyExistsError.prototype);
  }
}

export class AccountLockedError extends CustomError {
  constructor(message: string = 'Account is locked', details?: any) {
    super(message, 423, details);
    Object.setPrototypeOf(this, AccountLockedError.prototype);
  }
}

export class EmailNotVerifiedError extends CustomError {
  constructor(message: string = 'Email not verified', details?: any) {
    super(message, 403, details);
    Object.setPrototypeOf(this, EmailNotVerifiedError.prototype);
  }
}

/**
 * Password specific errors
 */
export class PasswordMismatchError extends CustomError {
  constructor(message: string = 'Password mismatch', details?: any) {
    super(message, 401, details);
    Object.setPrototypeOf(this, PasswordMismatchError.prototype);
  }
}

export class PasswordTooWeakError extends CustomError {
  constructor(message: string = 'Password too weak', details?: any) {
    super(message, 400, details);
    Object.setPrototypeOf(this, PasswordTooWeakError.prototype);
  }
}

/**
 * 2FA specific errors
 */
export class TwoFactorError extends CustomError {
  constructor(message: string = 'Two-factor authentication failed', details?: any) {
    super(message, 401, details);
    Object.setPrototypeOf(this, TwoFactorError.prototype);
  }
}

export class TwoFactorNotEnabledError extends CustomError {
  constructor(message: string = 'Two-factor authentication not enabled', details?: any) {
    super(message, 400, details);
    Object.setPrototypeOf(this, TwoFactorNotEnabledError.prototype);
  }
}

export class TwoFactorAlreadyEnabledError extends CustomError {
  constructor(message: string = 'Two-factor authentication already enabled', details?: any) {
    super(message, 400, details);
    Object.setPrototypeOf(this, TwoFactorAlreadyEnabledError.prototype);
  }
}

/**
 * SSO specific errors
 */
export class SSOError extends CustomError {
  constructor(message: string = 'SSO authentication failed', details?: any) {
    super(message, 401, details);
    Object.setPrototypeOf(this, SSOError.prototype);
  }
}

export class SSOProviderError extends CustomError {
  constructor(message: string = 'SSO provider error', details?: any) {
    super(message, 502, details);
    Object.setPrototypeOf(this, SSOProviderError.prototype);
  }
}

/**
 * Email specific errors
 */
export class EmailError extends CustomError {
  constructor(message: string = 'Email operation failed', details?: any) {
    super(message, 500, details);
    Object.setPrototypeOf(this, EmailError.prototype);
  }
}

export class EmailNotSentError extends CustomError {
  constructor(message: string = 'Email could not be sent', details?: any) {
    super(message, 500, details);
    Object.setPrototypeOf(this, EmailNotSentError.prototype);
  }
}

/**
 * Configuration specific errors
 */
export class ConfigurationError extends CustomError {
  constructor(message: string = 'Configuration error', details?: any) {
    super(message, 500, details, false); // Configuration errors are not operational
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends CustomError {
  constructor(message: string = 'External service error', details?: any) {
    super(message, 502, details);
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * Audit specific errors
 */
export class AuditError extends CustomError {
  constructor(message: string = 'Audit operation failed', details?: any) {
    super(message, 500, details);
    Object.setPrototypeOf(this, AuditError.prototype);
  }
}

/**
 * Compliance specific errors
 */
export class ComplianceError extends CustomError {
  constructor(message: string = 'Compliance violation', details?: any) {
    super(message, 400, details);
    Object.setPrototypeOf(this, ComplianceError.prototype);
  }
}

export class GDPRError extends CustomError {
  constructor(message: string = 'GDPR compliance error', details?: any) {
    super(message, 400, details);
    Object.setPrototypeOf(this, GDPRError.prototype);
  }
}

/**
 * Multi-tenancy specific errors
 */
export class TenantError extends CustomError {
  constructor(message: string = 'Tenant operation failed', details?: any) {
    super(message, 400, details);
    Object.setPrototypeOf(this, TenantError.prototype);
  }
}

export class TenantNotFoundError extends CustomError {
  constructor(message: string = 'Tenant not found', details?: any) {
    super(message, 404, details);
    Object.setPrototypeOf(this, TenantNotFoundError.prototype);
  }
}

/**
 * Error factory for creating specific error types
 */
export class ErrorFactory {
  static createAuthenticationError(message?: string, details?: any): AuthenticationError {
    return new AuthenticationError(message, details);
  }

  static createAuthorizationError(message?: string, details?: any): AuthorizationError {
    return new AuthorizationError(message, details);
  }

  static createValidationError(message?: string, details?: any): ValidationError {
    return new ValidationError(message, details);
  }

  static createNotFoundError(message?: string, details?: any): NotFoundError {
    return new NotFoundError(message, details);
  }

  static createConflictError(message?: string, details?: any): ConflictError {
    return new ConflictError(message, details);
  }

  static createRateLimitError(message?: string, details?: any): RateLimitError {
    return new RateLimitError(message, details);
  }

  static createServiceUnavailableError(message?: string, details?: any): ServiceUnavailableError {
    return new ServiceUnavailableError(message, details);
  }

  static createDatabaseError(message?: string, details?: any): DatabaseError {
    return new DatabaseError(message, details);
  }

  static createConnectionError(message?: string, details?: any): ConnectionError {
    return new ConnectionError(message, details);
  }

  static createTokenError(message?: string, details?: any): TokenError {
    return new TokenError(message, details);
  }

  static createTokenExpiredError(message?: string, details?: any): TokenExpiredError {
    return new TokenExpiredError(message, details);
  }

  static createTokenInvalidError(message?: string, details?: any): TokenInvalidError {
    return new TokenInvalidError(message, details);
  }

  static createUserNotFoundError(message?: string, details?: any): UserNotFoundError {
    return new UserNotFoundError(message, details);
  }

  static createUserAlreadyExistsError(message?: string, details?: any): UserAlreadyExistsError {
    return new UserAlreadyExistsError(message, details);
  }

  static createAccountLockedError(message?: string, details?: any): AccountLockedError {
    return new AccountLockedError(message, details);
  }

  static createEmailNotVerifiedError(message?: string, details?: any): EmailNotVerifiedError {
    return new EmailNotVerifiedError(message, details);
  }

  static createPasswordMismatchError(message?: string, details?: any): PasswordMismatchError {
    return new PasswordMismatchError(message, details);
  }

  static createPasswordTooWeakError(message?: string, details?: any): PasswordTooWeakError {
    return new PasswordTooWeakError(message, details);
  }

  static createTwoFactorError(message?: string, details?: any): TwoFactorError {
    return new TwoFactorError(message, details);
  }

  static createTwoFactorNotEnabledError(message?: string, details?: any): TwoFactorNotEnabledError {
    return new TwoFactorNotEnabledError(message, details);
  }

  static createTwoFactorAlreadyEnabledError(message?: string, details?: any): TwoFactorAlreadyEnabledError {
    return new TwoFactorAlreadyEnabledError(message, details);
  }

  static createSSOError(message?: string, details?: any): SSOError {
    return new SSOError(message, details);
  }

  static createSSOProviderError(message?: string, details?: any): SSOProviderError {
    return new SSOProviderError(message, details);
  }

  static createEmailError(message?: string, details?: any): EmailError {
    return new EmailError(message, details);
  }

  static createEmailNotSentError(message?: string, details?: any): EmailNotSentError {
    return new EmailNotSentError(message, details);
  }

  static createConfigurationError(message?: string, details?: any): ConfigurationError {
    return new ConfigurationError(message, details);
  }

  static createExternalServiceError(message?: string, details?: any): ExternalServiceError {
    return new ExternalServiceError(message, details);
  }

  static createAuditError(message?: string, details?: any): AuditError {
    return new AuditError(message, details);
  }

  static createComplianceError(message?: string, details?: any): ComplianceError {
    return new ComplianceError(message, details);
  }

  static createGDPRError(message?: string, details?: any): GDPRError {
    return new GDPRError(message, details);
  }

  static createTenantError(message?: string, details?: any): TenantError {
    return new TenantError(message, details);
  }

  static createTenantNotFoundError(message?: string, details?: any): TenantNotFoundError {
    return new TenantNotFoundError(message, details);
  }
}

/**
 * Error utility functions
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof CustomError) {
    return error.isOperational;
  }
  return false;
};

export const handleError = (error: Error): void => {
  if (isOperationalError(error)) {
    // Log operational errors but don't crash
    console.error('Operational error:', error.message);
  } else {
    // Log non-operational errors and exit
    console.error('Non-operational error:', error);
    process.exit(1);
  }
};

export default {
  CustomError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  DatabaseError,
  ConnectionError,
  TokenError,
  TokenExpiredError,
  TokenInvalidError,
  UserNotFoundError,
  UserAlreadyExistsError,
  AccountLockedError,
  EmailNotVerifiedError,
  PasswordMismatchError,
  PasswordTooWeakError,
  TwoFactorError,
  TwoFactorNotEnabledError,
  TwoFactorAlreadyEnabledError,
  SSOError,
  SSOProviderError,
  EmailError,
  EmailNotSentError,
  ConfigurationError,
  ExternalServiceError,
  AuditError,
  ComplianceError,
  GDPRError,
  TenantError,
  TenantNotFoundError,
  ErrorFactory,
  isOperationalError,
  handleError,
};

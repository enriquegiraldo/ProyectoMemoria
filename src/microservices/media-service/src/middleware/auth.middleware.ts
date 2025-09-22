import { Request, Response, NextFunction } from 'express';
import { 
  extractTokenFromHeader, 
  verifyToken, 
  createAuthContext, 
  validateAuthContext,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessResource,
  canModifyResource,
  canDeleteResource,
  validateApiKey,
  PERMISSIONS,
  ROLES,
  type Permission,
  type Role
} from '../utils/auth.utils';
import { 
  AuthenticationError, 
  AuthorizationError, 
  TokenError,
  TokenExpiredError,
  TokenInvalidError 
} from '../utils/errors';
import logger from '../utils/logger';
import {audit } from '../utils/logger';
import { metrics } from '../utils/metrics';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: Role;
        permissions: Permission[];
        payload: any;
      };
      authContext?: ReturnType<typeof createAuthContext>;
    }
  }
}

/**
 * Authentication middleware
 * Validates JWT token and sets user context
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    // Verify token
    const payload = verifyToken(token);
    
    // Create auth context
    const authContext = createAuthContext(token);
    validateAuthContext(authContext);
    
    // Set user context
    req.user = {
      userId: authContext.userId,
      email: authContext.email,
      role: authContext.role,
      permissions: authContext.permissions,
      payload: authContext.payload,
    };
    
    req.authContext = authContext;
    
    // Log authentication
    logger.info('User authenticated', {
      userId: authContext.userId,
      email: authContext.email,
      role: authContext.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      logger.warn('Token expired', { ip: req.ip, userAgent: req.get('User-Agent') });
      metrics.recordError('authentication', 'TOKEN_EXPIRED', 'media-service');
      res.status(401).json({
        success: false,
        error: {
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    if (error instanceof TokenInvalidError) {
      logger.warn('Invalid token', { ip: req.ip, userAgent: req.get('User-Agent') });
      metrics.recordError('authentication', 'TOKEN_INVALID', 'media-service');
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token format',
          code: 'TOKEN_INVALID',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    if (error instanceof TokenError) {
      logger.error('Token verification failed', { 
        error: error.message, 
        ip: req.ip, 
        userAgent: req.get('User-Agent') 
      });
      metrics.recordError('authentication', 'TOKEN_ERROR', 'media-service');
      res.status(401).json({
        success: false,
        error: {
          message: 'Token verification failed',
          code: 'TOKEN_ERROR',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
    
    logger.error('Authentication error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
    metrics.recordError('authentication', 'AUTHENTICATION_ERROR', 'media-service');
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * API Key authentication middleware
 * Validates API key for service-to-service communication
 */
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }
    
    if (!validateApiKey(apiKey)) {
      throw new AuthenticationError('Invalid API key');
    }
    
    // Set system user context
    req.user = {
      userId: 'system',
      email: 'system@media-service.com',
      role: ROLES.SYSTEM,
      permissions: [PERMISSIONS.FILE_UPLOAD, PERMISSIONS.FILE_DOWNLOAD, PERMISSIONS.FILE_DELETE, PERMISSIONS.FILE_UPDATE, PERMISSIONS.FILE_LIST, PERMISSIONS.PROCESSING_CREATE, PERMISSIONS.PROCESSING_CANCEL, PERMISSIONS.PROCESSING_LIST, PERMISSIONS.STORAGE_ACCESS, PERMISSIONS.STORAGE_MANAGE, PERMISSIONS.ADMIN_USERS, PERMISSIONS.ADMIN_SYSTEM, PERMISSIONS.ADMIN_ANALYTICS],
      payload: { userId: 'system', role: ROLES.SYSTEM },
    };
    
    logger.info('API key authenticated', { ip: req.ip, userAgent: req.get('User-Agent') });
    
    next();
  } catch (error) {
    logger.warn('API key authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
    metrics.recordError('authentication', 'API_KEY_ERROR', 'media-service');
    res.status(401).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Authentication failed',
        code: 'API_KEY_ERROR',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

/**
 * Optional authentication middleware
 * Sets user context if token is provided, but doesn't require it
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No token provided, continue without authentication
      next();
      return;
    }
    
    const token = extractTokenFromHeader(authHeader);
    const payload = verifyToken(token);
    const authContext = createAuthContext(token);
    validateAuthContext(authContext);
    
    req.user = {
      userId: authContext.userId,
      email: authContext.email,
      role: authContext.role,
      permissions: authContext.permissions,
      payload: authContext.payload,
    };
    
    req.authContext = authContext;
    
    logger.debug('Optional authentication successful', {
      userId: authContext.userId,
      email: authContext.email,
      role: authContext.role,
    });
    
    next();
  } catch (error) {
    // Authentication failed, but it's optional, so continue
    logger.debug('Optional authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    next();
  }
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      if (!hasPermission(req.user.permissions, permission)) {
        audit.securityEvent(
          req.user.userId,
          'permission_denied',
          'medium',
          req.ip,
          { permission, path: req.path, method: req.method }
        );
        throw new AuthorizationError(`Permission '${permission}' required`);
      }
      
      next();
    } catch (error) {
      logger.warn('Permission check failed', {
        userId: req.user?.userId,
        permission,
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      metrics.recordError('authorization', 'PERMISSION_DENIED', 'media-service');
      
      res.status(403).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Permission denied',
          code: 'PERMISSION_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Multiple permissions authorization middleware (any of the permissions)
 */
export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      if (!hasAnyPermission(req.user.permissions, permissions)) {
        audit.securityEvent(
          req.user.userId,
          'permission_denied',
          'medium',
          req.ip,
          { permissions, path: req.path, method: req.method }
        );
        throw new AuthorizationError(`Any of permissions [${permissions.join(', ')}] required`);
      }
      
      next();
    } catch (error) {
      logger.warn('Permission check failed', {
        userId: req.user?.userId,
        permissions,
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      metrics.recordError('authorization', 'PERMISSION_DENIED', 'media-service');
      
      res.status(403).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Permission denied',
          code: 'PERMISSION_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Multiple permissions authorization middleware (all permissions)
 */
export const requireAllPermissions = (permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      if (!hasAllPermissions(req.user.permissions, permissions)) {
        audit.securityEvent(
          req.user.userId,
          'permission_denied',
          'medium',
          req.ip,
          { permissions, path: req.path, method: req.method }
        );
        throw new AuthorizationError(`All permissions [${permissions.join(', ')}] required`);
      }
      
      next();
    } catch (error) {
      logger.warn('Permission check failed', {
        userId: req.user?.userId,
        permissions,
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      metrics.recordError('authorization', 'PERMISSION_DENIED', 'media-service');
      
      res.status(403).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Permission denied',
          code: 'PERMISSION_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (role: Role) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      if (req.user.role !== role) {
        audit.securityEvent(
          req.user.userId,
          'role_denied',
          'medium',
          req.ip,
          { requiredRole: role, userRole: req.user.role, path: req.path, method: req.method }
        );
        throw new AuthorizationError(`Role '${role}' required`);
      }
      
      next();
    } catch (error) {
      logger.warn('Role check failed', {
        userId: req.user?.userId,
        requiredRole: role,
        userRole: req.user?.role,
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      metrics.recordError('authorization', 'ROLE_DENIED', 'media-service');
      
      res.status(403).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Role denied',
          code: 'ROLE_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Resource ownership middleware
 * Checks if user can access the resource
 */
export const requireResourceAccess = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];
      
      if (!canAccessResource(req.user.userId, resourceUserId, req.user.role)) {
        audit.securityEvent(
          req.user.userId,
          'resource_access_denied',
          'medium',
          req.ip,
          { resourceUserId, path: req.path, method: req.method }
        );
        throw new AuthorizationError('Access to resource denied');
      }
      
      next();
    } catch (error) {
      logger.warn('Resource access check failed', {
        userId: req.user?.userId,
        resourceUserId: req.params[resourceUserIdParam] || req.body[resourceUserIdParam],
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      metrics.recordError('authorization', 'RESOURCE_ACCESS_DENIED', 'media-service');
      
      res.status(403).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Access denied',
          code: 'RESOURCE_ACCESS_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Resource modification middleware
 * Checks if user can modify the resource
 */
export const requireResourceModify = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];
      
      if (!canModifyResource(req.user.userId, resourceUserId, req.user.role)) {
        audit.securityEvent(
          req.user.userId,
          'resource_modify_denied',
          'medium',
          req.ip,
          { resourceUserId, path: req.path, method: req.method }
        );
        throw new AuthorizationError('Modification of resource denied');
      }
      
      next();
    } catch (error) {
      logger.warn('Resource modification check failed', {
        userId: req.user?.userId,
        resourceUserId: req.params[resourceUserIdParam] || req.body[resourceUserIdParam],
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      metrics.recordError('authorization', 'RESOURCE_MODIFY_DENIED', 'media-service');
      
      res.status(403).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Modification denied',
          code: 'RESOURCE_MODIFY_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Resource deletion middleware
 * Checks if user can delete the resource
 */
export const requireResourceDelete = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      
      const resourceUserId = req.params[resourceUserIdParam] || req.body[resourceUserIdParam];
      
      if (!canDeleteResource(req.user.userId, resourceUserId, req.user.role)) {
        audit.securityEvent(
          req.user.userId,
          'resource_delete_denied',
          'high',
          req.ip,
          { resourceUserId, path: req.path, method: req.method }
        );
        throw new AuthorizationError('Deletion of resource denied');
      }
      
      next();
    } catch (error) {
      logger.warn('Resource deletion check failed', {
        userId: req.user?.userId,
        resourceUserId: req.params[resourceUserIdParam] || req.body[resourceUserIdParam],
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      metrics.recordError('authorization', 'RESOURCE_DELETE_DENIED', 'media-service');
      
      res.status(403).json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Deletion denied',
          code: 'RESOURCE_DELETE_DENIED',
          statusCode: 403,
          timestamp: new Date().toISOString(),
        },
      });
    }
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(ROLES.ADMIN);

/**
 * System-only middleware
 */
export const requireSystem = requireRole(ROLES.SYSTEM);

/**
 * Premium or higher middleware
 */
export const requirePremium = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    
    const allowedRoles = [ROLES.PREMIUM, ROLES.ADMIN, ROLES.SYSTEM];
    
    if (!allowedRoles.includes(req.user.role)) {
      audit.securityEvent(
        req.user.userId,
        'premium_required',
        'low',
        req.ip,
        { userRole: req.user.role, path: req.path, method: req.method }
      );
      throw new AuthorizationError('Premium subscription required');
    }
    
    next();
  } catch (error) {
    logger.warn('Premium check failed', {
      userId: req.user?.userId,
      userRole: req.user?.role,
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    metrics.recordError('authorization', 'PREMIUM_REQUIRED', 'media-service');
    
    res.status(403).json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Premium subscription required',
        code: 'PREMIUM_REQUIRED',
        statusCode: 403,
        timestamp: new Date().toISOString(),
      },
    });
  }
};

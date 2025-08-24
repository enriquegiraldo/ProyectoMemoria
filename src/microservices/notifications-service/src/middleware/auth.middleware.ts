import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

/**
 * JWT Authentication Middleware
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new AuthenticationError('Missing JWT token');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    if (!decoded || !decoded.userId) {
      throw new AuthenticationError('Invalid JWT token');
    }

    // Add user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email || '',
      role: decoded.role || 'user',
      permissions: decoded.permissions || [],
    };

    logger.debug('User authenticated', {
      userId: req.user.id,
      role: req.user.role,
      permissions: req.user.permissions,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT verification failed', { error: error.message });
      next(new AuthenticationError('Invalid JWT token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT token expired', { error: error.message });
      next(new AuthenticationError('JWT token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * API Key Authentication Middleware
 */
export const apiKeyMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      throw new AuthenticationError('Missing API key');
    }

    // TODO: Validate API key against database
    // For now, we'll use a simple check
    if (apiKey !== config.apiKey) {
      throw new AuthenticationError('Invalid API key');
    }

    // Add API key user info to request
    req.user = {
      id: 'api-user',
      email: 'api@memoria-eterna.com',
      role: 'api',
      permissions: ['read', 'write'],
    };

    logger.debug('API key authenticated', {
      apiKey: apiKey.substring(0, 8) + '...',
    });

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Authentication Middleware
 * Allows requests to proceed even without authentication
 */
export const optionalAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as any;
        
        if (decoded && decoded.userId) {
          req.user = {
            id: decoded.userId,
            email: decoded.email || '',
            role: decoded.role || 'user',
            permissions: decoded.permissions || [],
          };
        }
      } catch (error) {
        // Ignore JWT errors for optional auth
        logger.debug('Optional auth failed, continuing without user', { error: error.message });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based Authorization Middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
      });
      next(new AuthorizationError('Insufficient role'));
      return;
    }

    next();
  };
};

/**
 * Permission-based Authorization Middleware
 */
export const requirePermission = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }

    const hasPermission = permissions.some(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermissions: permissions,
      });
      next(new AuthorizationError('Insufficient permissions'));
      return;
    }

    next();
  };
};

/**
 * Resource Ownership Middleware
 * Ensures user can only access their own resources
 */
export const requireOwnership = (resourceUserIdField: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      next(new AuthorizationError('Resource user ID not found'));
      return;
    }

    // Allow admin users to access any resource
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // Check if user owns the resource
    if (req.user.id !== resourceUserId) {
      logger.warn('Resource ownership violation', {
        userId: req.user.id,
        resourceUserId,
        resourceField: resourceUserIdField,
      });
      next(new AuthorizationError('Access denied: resource ownership required'));
      return;
    }

    next();
  };
};

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthenticationError, TokenError, TokenExpiredError, TokenInvalidError } from '../utils/errors';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Bearer token required');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AuthenticationError('Token is required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      issuer: 'memoria-eterna-auth',
      audience: 'memoria-eterna-users',
    }) as any;

    // Extract user information from token
    const user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    // Add user to request object
    req.user = user;

    // Log successful authentication
    logger.debug('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res.status(401).json({
        success: false,
        error: {
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED',
          timestamp: new Date().toISOString(),
        },
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      logger.error('Authentication middleware error', {
        error: error instanceof Error ? error.message : error,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication failed',
          code: 'AUTH_FAILED',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      // Empty token, continue without authentication
      next();
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      issuer: 'memoria-eterna-auth',
      audience: 'memoria-eterna-users',
    }) as any;

    // Extract user information from token
    const user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    // Add user to request object
    req.user = user;

    logger.debug('User authenticated (optional)', {
      userId: user.id,
      email: user.email,
      role: user.role,
      ip: req.ip,
    });

    next();
  } catch (error) {
    // Token verification failed, but continue without authentication
    logger.debug('Optional authentication failed', {
      error: error instanceof Error ? error.message : error,
      ip: req.ip,
    });
    next();
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    if (req.user.role !== requiredRole && req.user.role !== 'admin') {
      logger.warn('Insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRole,
        ip: req.ip,
      });
      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    const hasPermission = req.user.permissions.includes(requiredPermission) || 
                         req.user.permissions.includes('admin') ||
                         req.user.role === 'admin';

    if (!hasPermission) {
      logger.warn('Insufficient permission', {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermission,
        ip: req.ip,
      });
      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
};

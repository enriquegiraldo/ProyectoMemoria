import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { TokenService } from '../services/token.service';
import { UserService } from '../services/user.service';
import { logger, auditLogger } from '../utils/logger';
import { CustomError } from '../utils/errors';

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

export class AuthMiddleware {
  private tokenService: TokenService;
  private userService: UserService;

  constructor() {
    this.tokenService = new TokenService();
    this.userService = new UserService();
  }

  /**
   * Verify JWT token and attach user to request
   */
  verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CustomError('Access token required', 401);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token
      const payload = await this.tokenService.verifyAccessToken(token);

      // Get user from database
      const user = await this.userService.getUserById(payload.userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Check if account is locked
      if (user.accountLocked) {
        throw new CustomError('Account is locked', 423);
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      };

      next();
    } catch (error) {
      logger.warn('Token verification failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: error instanceof Error ? error.message : error,
      });

      if (error instanceof CustomError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  };

  /**
   * Require specific role
   */
  requireRole = (requiredRole: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (req.user.role !== requiredRole && req.user.role !== 'admin') {
        auditLogger.permissionDenied(
          req.user.id,
          'role_access',
          `role:${requiredRole}`,
          req.ip
        );

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      next();
    };
  };

  /**
   * Require specific permission
   */
  requirePermission = (requiredPermission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!req.user.permissions.includes(requiredPermission) && req.user.role !== 'admin') {
        auditLogger.permissionDenied(
          req.user.id,
          'permission_access',
          `permission:${requiredPermission}`,
          req.ip
        );

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      next();
    };
  };

  /**
   * Require any of the specified permissions
   */
  requireAnyPermission = (requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const hasPermission = requiredPermissions.some(permission => 
        req.user!.permissions.includes(permission)
      );

      if (!hasPermission && req.user.role !== 'admin') {
        auditLogger.permissionDenied(
          req.user.id,
          'permission_access',
          `permissions:${requiredPermissions.join(',')}`,
          req.ip
        );

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      next();
    };
  };

  /**
   * Require all specified permissions
   */
  requireAllPermissions = (requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const hasAllPermissions = requiredPermissions.every(permission => 
        req.user!.permissions.includes(permission)
      );

      if (!hasAllPermissions && req.user.role !== 'admin') {
        auditLogger.permissionDenied(
          req.user.id,
          'permission_access',
          `permissions:${requiredPermissions.join(',')}`,
          req.ip
        );

        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      next();
    };
  };

  /**
   * Optional authentication - doesn't fail if no token provided
   */
  optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(); // Continue without user
      }

      const token = authHeader.substring(7);

      // Verify token
      const payload = await this.tokenService.verifyAccessToken(token);

      // Get user from database
      const user = await this.userService.getUserById(payload.userId);
      if (user && !user.accountLocked) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        };
      }

      next();
    } catch (error) {
      // Continue without user if token is invalid
      next();
    }
  };

  /**
   * Rate limiting for authentication endpoints
   */
  authRateLimit = (req: Request, res: Response, next: NextFunction) => {
    // This would typically use a rate limiting library like express-rate-limit
    // For now, we'll implement a basic version
    const clientIp = req.ip;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    // In a real implementation, this would use Redis or a similar store
    // For now, we'll use a simple in-memory store (not suitable for production)
    if (!global.authAttempts) {
      global.authAttempts = new Map();
    }

    const attempts = global.authAttempts.get(clientIp) || { count: 0, resetTime: now + windowMs };

    if (now > attempts.resetTime) {
      attempts.count = 0;
      attempts.resetTime = now + windowMs;
    }

    attempts.count++;

    if (attempts.count > maxAttempts) {
      logger.warn('Rate limit exceeded for authentication', {
        ip: clientIp,
        attempts: attempts.count,
      });

      return res.status(429).json({
        success: false,
        message: 'Too many authentication attempts. Please try again later.',
        retryAfter: Math.ceil((attempts.resetTime - now) / 1000),
      });
    }

    global.authAttempts.set(clientIp, attempts);
    next();
  };

  /**
   * Check if user is accessing their own resource
   */
  requireOwnership = (resourceIdParam: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      const resourceId = req.params[resourceIdParam];
      
      if (req.user.id !== resourceId && req.user.role !== 'admin') {
        auditLogger.permissionDenied(
          req.user.id,
          'resource_access',
          `${resourceIdParam}:${resourceId}`,
          req.ip
        );

        return res.status(403).json({
          success: false,
          message: 'Access denied to this resource',
        });
      }

      next();
    };
  };

  /**
   * Multi-tenant middleware for tenant isolation
   */
  requireTenant = (req: Request, res: Response, next: NextFunction) => {
    if (!config.multiTenancy.enabled) {
      return next();
    }

    const tenantId = req.headers['x-tenant-id'] as string || req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID required',
      });
    }

    // Add tenant context to request
    req.tenantId = tenantId;
    next();
  };
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

// Export middleware functions
export const verifyToken = authMiddleware.verifyToken;
export const requireRole = authMiddleware.requireRole;
export const requirePermission = authMiddleware.requirePermission;
export const requireAnyPermission = authMiddleware.requireAnyPermission;
export const requireAllPermissions = authMiddleware.requireAllPermissions;
export const optionalAuth = authMiddleware.optionalAuth;
export const authRateLimit = authMiddleware.authRateLimit;
export const requireOwnership = authMiddleware.requireOwnership;
export const requireTenant = authMiddleware.requireTenant;

// Default export for backward compatibility
export default authMiddleware;

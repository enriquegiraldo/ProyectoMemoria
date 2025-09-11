// src/microservices/payments-service/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyJWT, validateApiKey, extractUserFromToken } from '../utils';
import { AuthenticationError } from '../utils/errors';
import { authIntegrationService } from '../services/auth-integration.service';
import config from '../config';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'] as string;

    if (!authHeader && !apiKey) {
      throw new AuthenticationError('No authentication provided');
    }

    if (apiKey) {
      // API Key authentication with Auth Service
      const validationResult = await authIntegrationService.validateApiKey(apiKey);
      if (!validationResult.valid) {
        throw new AuthenticationError(validationResult.error || 'Invalid API key');
      }

      // For API key auth, we'll use a service account user
      req.user = validationResult.user || {
        id: 'service-account',
        email: 'service@memoriaeterna.com',
        role: 'service',
        permissions: ['payments:*', 'subscriptions:*'],
      };
    } else {
      // JWT authentication with Auth Service
      const token = authHeader?.split(' ')[1];
      if (!token) {
        throw new AuthenticationError('Invalid authorization header');
      }

      // Validate token with Auth Service
      const validationResult = await authIntegrationService.validateToken(token);
      if (!validationResult.valid) {
        throw new AuthenticationError(validationResult.error || 'Invalid token');
      }

      if (!validationResult.user) {
        throw new AuthenticationError('User not found');
      }

      req.user = validationResult.user;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthenticationError('Insufficient role');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const hasPermission = req.user.permissions?.includes(permission) || 
                          req.user.permissions?.includes('*') ||
                          req.user.permissions?.includes(`${permission.split(':')[0]}:*`);

      if (!hasPermission) {
        throw new AuthenticationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

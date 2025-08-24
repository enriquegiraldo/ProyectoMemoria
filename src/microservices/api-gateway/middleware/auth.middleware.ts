import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { gatewayConfig } from '../config/gateway.config';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
    permissions: string[];
  };
  tenantId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  code?: number;
}

export class AuthMiddleware {
  private static instance: AuthMiddleware;
  private tokenCache: Map<string, { user: any; expires: number }> = new Map();

  static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }

  async authenticate(req: NextApiRequest): Promise<AuthResult> {
    try {
      // Check for API key first
      const apiKey = req.headers[gatewayConfig.security.apiKeyHeader] as string;
      if (apiKey) {
        return await this.validateApiKey(apiKey);
      }

      // Check for JWT token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        return await this.validateJWT(token);
      }

      // Check for SSO session
      const ssoToken = req.cookies['sso-token'];
      if (ssoToken) {
        return await this.validateSSOToken(ssoToken);
      }

      return {
        success: false,
        error: 'No authentication token provided',
        code: 401
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed',
        code: 500
      };
    }
  }

  private async validateApiKey(apiKey: string): Promise<AuthResult> {
    try {
      // In a real implementation, you would validate against a database
      // For now, we'll use a simple check
      if (apiKey.startsWith('sk_')) {
        const user = await this.getUserFromApiKey(apiKey);
        if (user) {
          return {
            success: true,
            user: {
              id: user.id,
              email: user.email,
              role: 'api_user',
              permissions: ['read', 'write'],
              tenantId: user.tenantId
            }
          };
        }
      }

      return {
        success: false,
        error: 'Invalid API key',
        code: 401
      };
    } catch (error) {
      console.error('API key validation error:', error);
      return {
        success: false,
        error: 'API key validation failed',
        code: 500
      };
    }
  }

  private async validateJWT(token: string): Promise<AuthResult> {
    try {
      // Check cache first
      const cached = this.tokenCache.get(token);
      if (cached && cached.expires > Date.now()) {
        return {
          success: true,
          user: cached.user
        };
      }

      // Verify JWT token
      const decoded = jwt.verify(token, gatewayConfig.security.jwtSecret) as any;
      
      if (!decoded) {
        return {
          success: false,
          error: 'Invalid JWT token',
          code: 401
        };
      }

      // Check if token is expired
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return {
          success: false,
          error: 'JWT token expired',
          code: 401
        };
      }

      const user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || [],
        tenantId: decoded.tenantId
      };

      // Cache the result
      this.tokenCache.set(token, {
        user,
        expires: Date.now() + 5 * 60 * 1000 // 5 minutes cache
      });

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('JWT validation error:', error);
      return {
        success: false,
        error: 'JWT validation failed',
        code: 401
      };
    }
  }

  private async validateSSOToken(ssoToken: string): Promise<AuthResult> {
    try {
      // In a real implementation, you would validate against your SSO provider
      // For now, we'll use a simple JWT validation
      const decoded = jwt.verify(ssoToken, process.env.SSO_SECRET || 'sso-secret') as any;
      
      if (!decoded) {
        return {
          success: false,
          error: 'Invalid SSO token',
          code: 401
        };
      }

      const user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'user',
        permissions: decoded.permissions || [],
        tenantId: decoded.tenantId
      };

      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('SSO validation error:', error);
      return {
        success: false,
        error: 'SSO validation failed',
        code: 401
      };
    }
  }

  private async getUserFromApiKey(apiKey: string): Promise<any> {
    // In a real implementation, you would query your database
    // For now, we'll return a mock user
    return {
      id: 'api-user-1',
      email: 'api@memoriaeterna.com',
      tenantId: 'default'
    };
  }

  async requireAuth(req: NextApiRequest, res: NextApiResponse, next: () => void): Promise<void> {
    const authResult = await this.authenticate(req);
    
    if (!authResult.success) {
      res.status(authResult.code || 401).json({
        error: authResult.error || 'Authentication required'
      });
      return;
    }

    (req as AuthenticatedRequest).user = authResult.user;
    next();
  }

  async requireRole(roles: string[]): Promise<(req: NextApiRequest, res: NextApiResponse, next: () => void) => Promise<void>> {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const authResult = await this.authenticate(req);
      
      if (!authResult.success) {
        res.status(authResult.code || 401).json({
          error: authResult.error || 'Authentication required'
        });
        return;
      }

      if (!roles.includes(authResult.user?.role)) {
        res.status(403).json({
          error: 'Insufficient permissions'
        });
        return;
      }

      (req as AuthenticatedRequest).user = authResult.user;
      next();
    };
  }

  async requirePermission(permissions: string[]): Promise<(req: NextApiRequest, res: NextApiResponse, next: () => void) => Promise<void>> {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const authResult = await this.authenticate(req);
      
      if (!authResult.success) {
        res.status(authResult.code || 401).json({
          error: authResult.error || 'Authentication required'
        });
        return;
      }

      const userPermissions = authResult.user?.permissions || [];
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        res.status(403).json({
          error: 'Insufficient permissions'
        });
        return;
      }

      (req as AuthenticatedRequest).user = authResult.user;
      next();
    };
  }

  async requireTenant(): Promise<(req: NextApiRequest, res: NextApiResponse, next: () => void) => Promise<void>> {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const authResult = await this.authenticate(req);
      
      if (!authResult.success) {
        res.status(authResult.code || 401).json({
          error: authResult.error || 'Authentication required'
        });
        return;
      }

      const tenantId = authResult.user?.tenantId || req.headers['x-tenant-id'] as string;
      
      if (!tenantId) {
        res.status(400).json({
          error: 'Tenant ID required'
        });
        return;
      }

      (req as AuthenticatedRequest).user = authResult.user;
      (req as AuthenticatedRequest).tenantId = tenantId;
      next();
    };
  }

  clearCache(): void {
    this.tokenCache.clear();
  }

  getCacheStats(): { size: number; entries: Array<{ key: string; expires: number }> } {
    const entries = Array.from(this.tokenCache.entries()).map(([key, value]) => ({
      key: key.substring(0, 10) + '...',
      expires: value.expires
    }));

    return {
      size: this.tokenCache.size,
      entries
    };
  }
}

export const authMiddleware = AuthMiddleware.getInstance();

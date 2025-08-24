import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { logger } from '../utils';
import config from '../config';

export interface UserInfo {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  tenantId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TokenValidationResponse {
  valid: boolean;
  user?: UserInfo;
  error?: string;
}

export interface AuthServiceConfig {
  baseURL: string;
  timeout: number;
  retries: number;
}

export class AuthIntegrationService {
  private authClient: AxiosInstance;
  private config: AuthServiceConfig;

  constructor() {
    this.config = {
      baseURL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      timeout: 5000,
      retries: 3
    };

    this.authClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'payments-service/1.0.0'
      }
    });

    // Add request interceptor for logging
    this.authClient.interceptors.request.use(
      (config) => {
        logger.debug('Auth Service Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          service: 'auth-integration'
        });
        return config;
      },
      (error) => {
        logger.error('Auth Service Request Error', {
          error: error.message,
          service: 'auth-integration'
        });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.authClient.interceptors.response.use(
      (response) => {
        logger.debug('Auth Service Response', {
          status: response.status,
          url: response.config.url,
          service: 'auth-integration'
        });
        return response;
      },
      (error) => {
        logger.error('Auth Service Response Error', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
          service: 'auth-integration'
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Validate JWT token with Auth Service
   */
  async validateToken(token: string): Promise<TokenValidationResponse> {
    try {
      const response: AxiosResponse<TokenValidationResponse> = await this.authClient.post(
        '/api/auth/validate',
        { token },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Service-Name': 'payments-service',
            'X-Service-Version': '1.0.0'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Token validation failed', {
        error: error.message,
        status: error.response?.status,
        service: 'auth-integration'
      });

      return {
        valid: false,
        error: error.response?.data?.message || 'Token validation failed'
      };
    }
  }

  /**
   * Get user information by user ID
   */
  async getUserInfo(userId: string, token: string): Promise<UserInfo | null> {
    try {
      const response: AxiosResponse<{ user: UserInfo }> = await this.authClient.get(
        `/api/auth/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Service-Name': 'payments-service',
            'X-Service-Version': '1.0.0'
          }
        }
      );

      return response.data.user;
    } catch (error: any) {
      logger.error('Failed to get user info', {
        userId,
        error: error.message,
        status: error.response?.status,
        service: 'auth-integration'
      });

      return null;
    }
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(userId: string, permission: string, token: string): Promise<boolean> {
    try {
      const response: AxiosResponse<{ hasPermission: boolean }> = await this.authClient.post(
        '/api/auth/permissions/check',
        {
          userId,
          permission
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Service-Name': 'payments-service',
            'X-Service-Version': '1.0.0'
          }
        }
      );

      return response.data.hasPermission;
    } catch (error: any) {
      logger.error('Permission check failed', {
        userId,
        permission,
        error: error.message,
        status: error.response?.status,
        service: 'auth-integration'
      });

      return false;
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string, token: string): Promise<string[]> {
    try {
      const response: AxiosResponse<{ permissions: string[] }> = await this.authClient.get(
        `/api/auth/users/${userId}/permissions`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Service-Name': 'payments-service',
            'X-Service-Version': '1.0.0'
          }
        }
      );

      return response.data.permissions;
    } catch (error: any) {
      logger.error('Failed to get user permissions', {
        userId,
        error: error.message,
        status: error.response?.status,
        service: 'auth-integration'
      });

      return [];
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(apiKey: string): Promise<TokenValidationResponse> {
    try {
      const response: AxiosResponse<TokenValidationResponse> = await this.authClient.post(
        '/api/auth/validate-api-key',
        { apiKey },
        {
          headers: {
            'X-API-Key': apiKey,
            'X-Service-Name': 'payments-service',
            'X-Service-Version': '1.0.0'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('API key validation failed', {
        error: error.message,
        status: error.response?.status,
        service: 'auth-integration'
      });

      return {
        valid: false,
        error: error.response?.data?.message || 'API key validation failed'
      };
    }
  }

  /**
   * Health check for Auth Service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.authClient.get('/health', {
        timeout: 3000
      });

      return response.status === 200;
    } catch (error: any) {
      logger.error('Auth Service health check failed', {
        error: error.message,
        service: 'auth-integration'
      });

      return false;
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): AuthServiceConfig {
    return this.config;
  }
}

// Export singleton instance
export const authIntegrationService = new AuthIntegrationService();

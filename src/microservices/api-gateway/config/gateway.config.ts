import { NextApiRequest, NextApiResponse } from 'next';

export interface GatewayConfig {
  services: ServiceConfig[];
  rateLimit: RateLimitConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
  cors: CorsConfig;
}

export interface ServiceConfig {
  name: string;
  url: string;
  healthCheck: string;
  timeout: number;
  retries: number;
  circuitBreaker: CircuitBreakerConfig;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface SecurityConfig {
  enableAuth: boolean;
  enableCors: boolean;
  enableHelmet: boolean;
  enableRateLimit: boolean;
  jwtSecret: string;
  apiKeyHeader: string;
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableLogging: boolean;
  metricsPort: number;
}

export interface CorsConfig {
  origin: string | string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  expectedFailures: number;
}

export const gatewayConfig: GatewayConfig = {
  services: [
    {
      name: 'auth-service',
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      healthCheck: '/health',
      timeout: 5000,
      retries: 3,
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        expectedFailures: 2
      }
    },
    {
      name: 'memory-service',
      url: process.env.MEMORY_SERVICE_URL || 'http://localhost:3002',
      healthCheck: '/health',
      timeout: 10000,
      retries: 2,
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 60000,
        expectedFailures: 1
      }
    },
    {
      name: 'user-service',
      url: process.env.USER_SERVICE_URL || 'http://localhost:3003',
      healthCheck: '/health',
      timeout: 5000,
      retries: 3,
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        expectedFailures: 2
      }
    },
    {
      name: 'notification-service',
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
      healthCheck: '/health',
      timeout: 3000,
      retries: 2,
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        expectedFailures: 1
      }
    },
    {
      name: 'analytics-service',
      url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005',
      healthCheck: '/health',
      timeout: 5000,
      retries: 2,
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 60000,
        expectedFailures: 1
      }
    },
    {
      name: 'payments-service',
      url: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3006',
      healthCheck: '/health',
      timeout: 15000, // Longer timeout for payment operations
      retries: 2,
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 120000, // 2 minutes recovery time for payments
        expectedFailures: 1
      }
    }
  ],
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  security: {
    enableAuth: true,
    enableCors: true,
    enableHelmet: true,
    enableRateLimit: true,
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
    apiKeyHeader: 'x-api-key'
  },
  monitoring: {
    enableMetrics: true,
    enableTracing: true,
    enableLogging: true,
    metricsPort: parseInt(process.env.METRICS_PORT || '9090')
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true
  }
};

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  lastCheck: Date;
  error?: string;
}

export interface GatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  activeConnections: number;
  circuitBreakerStatus: Record<string, 'open' | 'closed' | 'half-open'>;
}

export interface RouteConfig {
  path: string;
  method: string;
  service: string;
  auth: boolean;
  rateLimit?: RateLimitConfig;
  timeout?: number;
}

export const routes: RouteConfig[] = [
  // Auth routes
  { path: '/api/auth/login', method: 'POST', service: 'auth-service', auth: false },
  { path: '/api/auth/register', method: 'POST', service: 'auth-service', auth: false },
  { path: '/api/auth/logout', method: 'POST', service: 'auth-service', auth: true },
  { path: '/api/auth/refresh', method: 'POST', service: 'auth-service', auth: true },
  { path: '/api/auth/verify', method: 'GET', service: 'auth-service', auth: true },
  
  // Memory routes
  { path: '/api/memories', method: 'GET', service: 'memory-service', auth: true },
  { path: '/api/memories', method: 'POST', service: 'memory-service', auth: true },
  { path: '/api/memories/:id', method: 'GET', service: 'memory-service', auth: true },
  { path: '/api/memories/:id', method: 'PUT', service: 'memory-service', auth: true },
  { path: '/api/memories/:id', method: 'DELETE', service: 'memory-service', auth: true },
  
  // User routes
  { path: '/api/users/profile', method: 'GET', service: 'user-service', auth: true },
  { path: '/api/users/profile', method: 'PUT', service: 'user-service', auth: true },
  { path: '/api/users/settings', method: 'GET', service: 'user-service', auth: true },
  { path: '/api/users/settings', method: 'PUT', service: 'user-service', auth: true },
  
  // Notification routes
  { path: '/api/notifications', method: 'GET', service: 'notification-service', auth: true },
  { path: '/api/notifications/:id/read', method: 'PUT', service: 'notification-service', auth: true },
  { path: '/api/notifications/subscribe', method: 'POST', service: 'notification-service', auth: true },
  
  // Analytics routes
  { path: '/api/analytics/dashboard', method: 'GET', service: 'analytics-service', auth: true },
  { path: '/api/analytics/events', method: 'POST', service: 'analytics-service', auth: true },
  { path: '/api/analytics/reports', method: 'GET', service: 'analytics-service', auth: true },
  
  // Payment routes
  { path: '/api/payments/intents', method: 'POST', service: 'payments-service', auth: true },
  { path: '/api/payments', method: 'GET', service: 'payments-service', auth: true },
  { path: '/api/payments/:id', method: 'GET', service: 'payments-service', auth: true },
  { path: '/api/payments/:id/confirm', method: 'POST', service: 'payments-service', auth: true },
  { path: '/api/payments/:id/refund', method: 'POST', service: 'payments-service', auth: true },
  { path: '/api/payments/analytics', method: 'GET', service: 'payments-service', auth: true },
  
  // Subscription routes
  { path: '/api/subscriptions', method: 'POST', service: 'payments-service', auth: true },
  { path: '/api/subscriptions', method: 'GET', service: 'payments-service', auth: true },
  { path: '/api/subscriptions/user/:userId', method: 'GET', service: 'payments-service', auth: true },
  { path: '/api/subscriptions/:id', method: 'GET', service: 'payments-service', auth: true },
  { path: '/api/subscriptions/:id', method: 'PUT', service: 'payments-service', auth: true },
  { path: '/api/subscriptions/:id/cancel', method: 'POST', service: 'payments-service', auth: true },
  { path: '/api/subscriptions/analytics', method: 'GET', service: 'payments-service', auth: true },
  
  // Webhook routes (no authentication required)
  { path: '/api/webhooks/stripe', method: 'POST', service: 'payments-service', auth: false },
  { path: '/api/webhooks/paypal', method: 'POST', service: 'payments-service', auth: false },
  { path: '/api/webhooks/mercadopago', method: 'POST', service: 'payments-service', auth: false }
];

export function findRoute(path: string, method: string): RouteConfig | undefined {
  return routes.find(route => {
    const pathMatch = route.path.replace(/:[^/]+/g, '[^/]+') === path;
    const methodMatch = route.method === method;
    return pathMatch && methodMatch;
  });
}

export function getServiceByName(name: string): ServiceConfig | undefined {
  return gatewayConfig.services.find(service => service.name === name);
}

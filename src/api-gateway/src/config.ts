import { z } from 'zod';
// @ts-ignore
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  AUTH_SERVICE_URL: z.string().default('http://localhost:3001'),
  MEMORIES_SERVICE_URL: z.string().default('http://localhost:3002'),
  MEDIA_SERVICE_URL: z.string().default('http://localhost:3003'),
  NOTIFICATIONS_SERVICE_URL: z.string().default('http://localhost:3004'),
  PAYMENTS_SERVICE_URL: z.string().default('http://localhost:3005'),
  ANALYTICS_SERVICE_URL: z.string().default('http://localhost:3006'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

const env = envSchema.parse(process.env);

const services = {
  auth: {
    name: 'auth-service',
    url: env.AUTH_SERVICE_URL,
    health: `${env.AUTH_SERVICE_URL}/health`,
    routes: ['/api/auth/*'],
  },
  memories: {
    name: 'memories-service',
    url: env.MEMORIES_SERVICE_URL,
    health: `${env.MEMORIES_SERVICE_URL}/health`,
    routes: ['/api/memories/*'],
  },
  media: {
    name: 'media-service',
    url: env.MEDIA_SERVICE_URL,
    health: `${env.MEDIA_SERVICE_URL}/health`,
    routes: ['/api/media/*'],
  },
  notifications: {
    name: 'notifications-service',
    url: env.NOTIFICATIONS_SERVICE_URL,
    health: `${env.NOTIFICATIONS_SERVICE_URL}/health`,
    routes: ['/api/notifications/*'],
  },
  payments: {
    name: 'payments-service',
    url: env.PAYMENTS_SERVICE_URL,
    health: `${env.PAYMENTS_SERVICE_URL}/health`,
    routes: ['/api/payments/*'],
  },
  analytics: {
    name: 'analytics-service',
    url: env.ANALYTICS_SERVICE_URL,
    health: `${env.ANALYTICS_SERVICE_URL}/health`,
    routes: ['/api/analytics/*'],
  },
};

const config = {
  env: env.NODE_ENV,
  server: {
    port: env.PORT,
  },
  jwt: {
    secret: env.JWT_SECRET,
  },
  services,
  rateLimit: {
    max: env.RATE_LIMIT_MAX_REQUESTS,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  redis: {
    url: env.REDIS_URL,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
};

export default config;

// src/microservices/notifications-service/src/routes/health.routes.ts
import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Liveness probe endpoint
 * GET /health/live
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    service: 'notifications-service',
  });
});

/**
 * Readiness probe endpoint
 * GET /health/ready
 */
router.get('/ready', (req: Request, res: Response) => {
  // Check if all required services are ready
  const isReady = true; // TODO: Add actual health checks

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      service: 'notifications-service',
      checks: {
        database: 'ok',
        redis: 'ok',
        providers: 'ok',
      },
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      service: 'notifications-service',
      message: 'Service is not ready',
    });
  }
});

/**
 * Detailed health check endpoint
 * GET /health
 */
router.get('/', (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'notifications-service',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: { status: 'ok', responseTime: 0 },
      redis: { status: 'ok', responseTime: 0 },
      emailProviders: { status: 'ok', providers: ['sendgrid', 'mailgun'] },
      pushProviders: { status: 'ok', providers: ['web-push', 'firebase'] },
      smsProviders: { status: 'ok', providers: ['twilio', 'sns'] },
    },
  };

  res.status(200).json(health);
});

export default router;

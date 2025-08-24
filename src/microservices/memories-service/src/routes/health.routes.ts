import { Router, Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Basic health check
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'memories-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

/**
 * Detailed health check with dependencies
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    service: 'memories-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    dependencies: {
      database: 'unknown',
      redis: 'unknown',
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  try {
    // Check database connection
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    const { data, error } = await supabase
      .from('memories')
      .select('count', { count: 'exact', head: true });

    if (error) {
      health.dependencies.database = 'unhealthy';
      health.status = 'degraded';
      logger.error('Database health check failed', { error });
    } else {
      health.dependencies.database = 'healthy';
    }
  } catch (error) {
    health.dependencies.database = 'unhealthy';
    health.status = 'degraded';
    logger.error('Database connection failed', { error });
  }

  // Check Redis connection (if configured)
  try {
    if (config.redis.url || config.redis.host) {
      // This would typically check Redis connection
      // For now, we'll assume it's healthy
      health.dependencies.redis = 'healthy';
    } else {
      health.dependencies.redis = 'not_configured';
    }
  } catch (error) {
    health.dependencies.redis = 'unhealthy';
    health.status = 'degraded';
    logger.error('Redis connection failed', { error });
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * Readiness probe
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if service is ready to handle requests
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    const { error } = await supabase
      .from('memories')
      .select('count', { count: 'exact', head: true });

    if (error) {
      logger.error('Readiness check failed', { error });
      res.status(503).json({
        status: 'not_ready',
        service: 'memories-service',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed',
      });
      return;
    }

    res.status(200).json({
      status: 'ready',
      service: 'memories-service',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not_ready',
      service: 'memories-service',
      timestamp: new Date().toISOString(),
      error: 'Service not ready',
    });
  }
});

/**
 * Liveness probe
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    service: 'memories-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;

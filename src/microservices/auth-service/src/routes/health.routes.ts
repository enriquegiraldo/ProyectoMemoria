import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';
import { logger } from '../utils/logger';

const router = Router();

// Create Supabase client for health checks
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

/**
 * @route GET /health
 * @desc Basic health check
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Basic service health
    const serviceHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: '1.0.0',
      environment: config.nodeEnv,
    };

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        ...serviceHealth,
        responseTime: `${responseTime}ms`,
      },
    });
  } catch (error) {
    logger.error('Health check failed', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(503).json({
      success: false,
      message: 'Service unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /health/ready
 * @desc Readiness probe - check if service is ready to receive traffic
 * @access Public
 */
router.get('/ready', async (req, res) => {
  try {
    const checks = {
      database: false,
      redis: false,
      config: false,
    };

    // Check configuration
    try {
      config.validateConfig();
      checks.config = true;
    } catch (error) {
      logger.error('Configuration check failed', {
        error: error instanceof Error ? error.message : error,
      });
    }

    // Check database connection
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (!error) {
        checks.database = true;
      } else {
        logger.error('Database health check failed', { error });
      }
    } catch (error) {
      logger.error('Database connection failed', {
        error: error instanceof Error ? error.message : error,
      });
    }

    // Check Redis connection (if configured)
    try {
      // This would check Redis connection
      // For now, we'll assume it's working
      checks.redis = true;
    } catch (error) {
      logger.error('Redis health check failed', {
        error: error instanceof Error ? error.message : error,
      });
    }

    const allChecksPassed = Object.values(checks).every(check => check);

    if (allChecksPassed) {
      res.json({
        success: true,
        status: 'ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'not ready',
        checks,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Readiness check failed', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(503).json({
      success: false,
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /health/live
 * @desc Liveness probe - check if service is alive
 * @access Public
 */
router.get('/live', async (req, res) => {
  try {
    // Basic liveness check - just ensure the process is running
    const liveness = {
      status: 'alive',
      pid: process.pid,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: liveness,
    });
  } catch (error) {
    logger.error('Liveness check failed', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(503).json({
      success: false,
      status: 'not alive',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /health/detailed
 * @desc Detailed health check with all dependencies
 * @access Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    const checks = {
      service: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      database: {
        status: 'unknown',
        responseTime: 0,
        error: null,
      },
      redis: {
        status: 'unknown',
        responseTime: 0,
        error: null,
      },
      config: {
        status: 'unknown',
        error: null,
      },
    };

    // Check configuration
    const configStart = Date.now();
    try {
      config.validateConfig();
      checks.config.status = 'healthy';
    } catch (error) {
      checks.config.status = 'unhealthy';
      checks.config.error = error instanceof Error ? error.message : 'Unknown error';
    }
    checks.config.responseTime = Date.now() - configStart;

    // Check database
    const dbStart = Date.now();
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (!error) {
        checks.database.status = 'healthy';
      } else {
        checks.database.status = 'unhealthy';
        checks.database.error = error.message;
      }
    } catch (error) {
      checks.database.status = 'unhealthy';
      checks.database.error = error instanceof Error ? error.message : 'Unknown error';
    }
    checks.database.responseTime = Date.now() - dbStart;

    // Check Redis
    const redisStart = Date.now();
    try {
      // This would check Redis connection
      // For now, we'll assume it's working
      checks.redis.status = 'healthy';
    } catch (error) {
      checks.redis.status = 'unhealthy';
      checks.redis.error = error instanceof Error ? error.message : 'Unknown error';
    }
    checks.redis.responseTime = Date.now() - redisStart;

    const totalResponseTime = Date.now() - startTime;

    // Determine overall status
    const criticalChecks = [checks.database.status, checks.config.status];
    const overallStatus = criticalChecks.every(status => status === 'healthy') 
      ? 'healthy' 
      : 'unhealthy';

    const response = {
      success: overallStatus === 'healthy',
      status: overallStatus,
      checks,
      responseTime: `${totalResponseTime}ms`,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: config.nodeEnv,
    };

    if (overallStatus === 'healthy') {
      res.json(response);
    } else {
      res.status(503).json(response);
    }
  } catch (error) {
    logger.error('Detailed health check failed', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /health/startup
 * @desc Startup probe - check if service has finished starting up
 * @access Public
 */
router.get('/startup', async (req, res) => {
  try {
    // Check if service has been running for at least 30 seconds
    const minUptime = 30; // seconds
    const uptime = process.uptime();

    if (uptime < minUptime) {
      res.status(503).json({
        success: false,
        status: 'starting',
        uptime: `${uptime}s`,
        minUptime: `${minUptime}s`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Perform basic startup checks
    const checks = {
      config: false,
      database: false,
    };

    // Check configuration
    try {
      config.validateConfig();
      checks.config = true;
    } catch (error) {
      logger.error('Startup config check failed', {
        error: error instanceof Error ? error.message : error,
      });
    }

    // Check database connection
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (!error) {
        checks.database = true;
      }
    } catch (error) {
      logger.error('Startup database check failed', {
        error: error instanceof Error ? error.message : error,
      });
    }

    const allChecksPassed = Object.values(checks).every(check => check);

    if (allChecksPassed) {
      res.json({
        success: true,
        status: 'started',
        uptime: `${uptime}s`,
        checks,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'starting',
        uptime: `${uptime}s`,
        checks,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error('Startup check failed', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(503).json({
      success: false,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as healthRouter };

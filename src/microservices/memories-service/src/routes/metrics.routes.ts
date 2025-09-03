import { Router, Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/config';
import { logger } from '@/utils/logger';

const router = Router();

/**
 * Basic metrics endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    
    // Get basic statistics
    const metrics = {
      service: 'memories-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      statistics: {
        totalMemories: 0,
        totalUsers: 0,
        totalMedia: 0,
        recentActivity: {
          last24h: 0,
          last7d: 0,
          last30d: 0,
        },
      },
    };

    // Get memory count
    try {
      const { count: memoryCount, error: memoryError } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true });

      if (!memoryError) {
        metrics.statistics.totalMemories = memoryCount || 0;
      }
    } catch (error) {
      logger.error('Failed to get memory count', { error });
    }

    // Get user count
    try {
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (!userError) {
        metrics.statistics.totalUsers = userCount || 0;
      }
    } catch (error) {
      logger.error('Failed to get user count', { error });
    }

    // Get media count
    try {
      const { count: mediaCount, error: mediaError } = await supabase
        .from('memory_media')
        .select('*', { count: 'exact', head: true });

      if (!mediaError) {
        metrics.statistics.totalMedia = mediaCount || 0;
      }
    } catch (error) {
      logger.error('Failed to get media count', { error });
    }

    // Get recent activity
    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const { count: last24h, error: error24h } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayAgo.toISOString());

      const { count: last7d, error: error7d } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      const { count: last30d, error: error30d } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());

      if (!error24h) metrics.statistics.recentActivity.last24h = last24h || 0;
      if (!error7d) metrics.statistics.recentActivity.last7d = last7d || 0;
      if (!error30d) metrics.statistics.recentActivity.last30d = last30d || 0;
    } catch (error) {
      logger.error('Failed to get recent activity', { error });
    }

    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Metrics endpoint error', { error });
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Prometheus metrics endpoint
 */
router.get('/prometheus', (req: Request, res: Response) => {
  try {
    const metrics = [
      '# HELP memoria_eterna_memories_total Total number of memories',
      '# TYPE memoria_eterna_memories_total counter',
      `memoria_eterna_memories_total{service="memories-service"} 0`,
      '',
      '# HELP memoria_eterna_users_total Total number of users',
      '# TYPE memoria_eterna_users_total counter',
      `memoria_eterna_users_total{service="memories-service"} 0`,
      '',
      '# HELP memoria_eterna_media_total Total number of media files',
      '# TYPE memoria_eterna_media_total counter',
      `memoria_eterna_media_total{service="memories-service"} 0`,
      '',
      '# HELP memoria_eterna_service_uptime_seconds Service uptime in seconds',
      '# TYPE memoria_eterna_service_uptime_seconds gauge',
      `memoria_eterna_service_uptime_seconds{service="memories-service"} ${process.uptime()}`,
      '',
      '# HELP memoria_eterna_memory_usage_bytes Memory usage in bytes',
      '# TYPE memoria_eterna_memory_usage_bytes gauge',
      `memoria_eterna_memory_usage_bytes{service="memories-service",type="heap_used"} ${process.memoryUsage().heapUsed}`,
      `memoria_eterna_memory_usage_bytes{service="memories-service",type="heap_total"} ${process.memoryUsage().heapTotal}`,
      `memoria_eterna_memory_usage_bytes{service="memories-service",type="external"} ${process.memoryUsage().external}`,
      `memoria_eterna_memory_usage_bytes{service="memories-service",type="rss"} ${process.memoryUsage().rss}`,
    ].join('\n');

    res.set('Content-Type', 'text/plain');
    res.status(200).send(metrics);
  } catch (error) {
    logger.error('Prometheus metrics error', { error });
    res.status(500).send('# Error generating metrics\n');
  }
});

/**
 * Health check for metrics endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'memories-service-metrics',
    timestamp: new Date().toISOString(),
  });
});

export default router;

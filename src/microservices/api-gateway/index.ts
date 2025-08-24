import { NextApiRequest, NextApiResponse } from 'next';
import { gatewayConfig, findRoute } from './config/gateway.config';
import { authMiddleware } from './middleware/auth.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { proxyService } from './services/proxy.service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startTime = Date.now();

  try {
    // Add CORS headers
    if (gatewayConfig.security.enableCors) {
      res.setHeader('Access-Control-Allow-Origin', Array.isArray(gatewayConfig.cors.origin) 
        ? gatewayConfig.cors.origin.join(',') 
        : gatewayConfig.cors.origin);
      res.setHeader('Access-Control-Allow-Methods', gatewayConfig.cors.methods.join(','));
      res.setHeader('Access-Control-Allow-Headers', gatewayConfig.cors.allowedHeaders.join(','));
      res.setHeader('Access-Control-Allow-Credentials', gatewayConfig.cors.credentials.toString());
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Add security headers
    if (gatewayConfig.security.enableHelmet) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    }

    // Add request ID
    const requestId = req.headers['x-request-id'] as string || generateRequestId();
    res.setHeader('X-Request-ID', requestId);

    // Find route configuration
    const route = findRoute(req.url || '', req.method || 'GET');
    if (!route) {
      res.status(404).json({ 
        error: 'Route not found',
        requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Apply rate limiting
    if (gatewayConfig.security.enableRateLimit) {
      await rateLimitMiddleware.rateLimitMiddleware(req, res, () => {});
      if (res.writableEnded) return;
    }

    // Apply circuit breaker
    const circuitBreakerMiddleware = await rateLimitMiddleware.circuitBreakerMiddleware(route.service);
    await circuitBreakerMiddleware(req, res, () => {});
    if (res.writableEnded) return;

    // Apply authentication if required
    if (route.auth && gatewayConfig.security.enableAuth) {
      await authMiddleware.requireAuth(req, res, () => {});
      if (res.writableEnded) return;
    }

    // Proxy the request to the appropriate service
    await proxyService.proxyRequest(req, res);

    // Add response time header
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);

  } catch (error) {
    console.error('Gateway error:', error);
    
    const responseTime = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    res.status(500).json({
      error: 'Internal gateway error',
      requestId: req.headers['x-request-id'] as string || generateRequestId(),
      timestamp: new Date().toISOString()
    });
  }
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Health check endpoint
export async function healthCheck(req: NextApiRequest, res: NextApiResponse) {
  try {
    const serviceHealth = proxyService.getServiceHealth();
    const rateLimitStats = rateLimitMiddleware.getRateLimitStats();
    const circuitBreakerStats = rateLimitMiddleware.getCircuitBreakerStats();
    const authCacheStats = authMiddleware.getCacheStats();

    const overallHealth = Object.values(serviceHealth).every(instances => 
      instances.some(instance => instance.healthy)
    );

    res.status(overallHealth ? 200 : 503).json({
      status: overallHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: serviceHealth,
      rateLimits: rateLimitStats,
      circuitBreakers: circuitBreakerStats,
      authCache: authCacheStats
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
}

// Metrics endpoint
export async function metrics(req: NextApiRequest, res: NextApiResponse) {
  try {
    const serviceHealth = proxyService.getServiceHealth();
    const rateLimitStats = rateLimitMiddleware.getRateLimitStats();
    const circuitBreakerStats = rateLimitMiddleware.getCircuitBreakerStats();

    // Calculate metrics
    const totalServices = Object.keys(serviceHealth).length;
    const healthyServices = Object.values(serviceHealth).filter(instances => 
      instances.some(instance => instance.healthy)
    ).length;

    const totalRequests = Object.values(rateLimitStats).reduce((sum, stat) => sum + stat.count, 0);
    const openCircuitBreakers = Object.values(circuitBreakerStats).filter(cb => cb.state === 'open').length;

    res.status(200).json({
      timestamp: new Date().toISOString(),
      metrics: {
        serviceHealth: {
          total: totalServices,
          healthy: healthyServices,
          unhealthy: totalServices - healthyServices,
          healthPercentage: (healthyServices / totalServices) * 100
        },
        requests: {
          total: totalRequests,
          rateLimited: Object.values(rateLimitStats).filter(stat => stat.count >= gatewayConfig.rateLimit.maxRequests).length
        },
        circuitBreakers: {
          total: Object.keys(circuitBreakerStats).length,
          open: openCircuitBreakers,
          closed: Object.keys(circuitBreakerStats).length - openCircuitBreakers
        }
      },
      details: {
        services: serviceHealth,
        rateLimits: rateLimitStats,
        circuitBreakers: circuitBreakerStats
      }
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      error: 'Metrics collection failed',
      timestamp: new Date().toISOString()
    });
  }
}

// Admin endpoints
export async function adminStats(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check admin permissions
    const authResult = await authMiddleware.authenticate(req);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const stats = {
      gateway: {
        version: '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      },
      services: proxyService.getServiceHealth(),
      rateLimits: rateLimitMiddleware.getRateLimitStats(),
      circuitBreakers: rateLimitMiddleware.getCircuitBreakerStats(),
      authCache: authMiddleware.getCacheStats()
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin stats' });
  }
}

export async function adminReset(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check admin permissions
    const authResult = await authMiddleware.authenticate(req);
    if (!authResult.success || authResult.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // Reset all caches and stats
    rateLimitMiddleware.resetAll();
    authMiddleware.clearCache();

    res.status(200).json({ 
      message: 'All caches and stats reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Admin reset error:', error);
    res.status(500).json({ error: 'Failed to reset caches and stats' });
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  proxyService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  proxyService.stop();
  process.exit(0);
});

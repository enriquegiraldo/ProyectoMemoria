import { Router } from 'express';
import { logger } from '@/utils/logger';

const router = Router();

// In-memory metrics store (in production, use Redis or a proper metrics system)
interface Metrics {
  requests: {
    total: number;
    byMethod: Record<string, number>;
    byStatus: Record<number, number>;
    byEndpoint: Record<string, number>;
  };
  responseTime: {
    total: number;
    count: number;
    min: number;
    max: number;
    avg: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
  authentication: {
    logins: number;
    logouts: number;
    registrations: number;
    failedLogins: number;
    passwordResets: number;
  };
  users: {
    active: number;
    total: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
}

// Initialize metrics
let metrics: Metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byStatus: {},
    byEndpoint: {},
  },
  responseTime: {
    total: 0,
    count: 0,
    min: Infinity,
    max: 0,
    avg: 0,
  },
  errors: {
    total: 0,
    byType: {},
  },
  authentication: {
    logins: 0,
    logouts: 0,
    registrations: 0,
    failedLogins: 0,
    passwordResets: 0,
  },
  users: {
    active: 0,
    total: 0,
    newToday: 0,
    newThisWeek: 0,
    newThisMonth: 0,
  },
  system: {
    memoryUsage: 0,
    cpuUsage: 0,
    uptime: 0,
  },
};

// Metrics update functions
export const updateRequestMetrics = (method: string, status: number, endpoint: string, responseTime: number) => {
  metrics.requests.total++;
  
  // Update method metrics
  metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;
  
  // Update status metrics
  metrics.requests.byStatus[status] = (metrics.requests.byStatus[status] || 0) + 1;
  
  // Update endpoint metrics
  metrics.requests.byEndpoint[endpoint] = (metrics.requests.byEndpoint[endpoint] || 0) + 1;
  
  // Update response time metrics
  metrics.responseTime.total += responseTime;
  metrics.responseTime.count++;
  metrics.responseTime.min = Math.min(metrics.responseTime.min, responseTime);
  metrics.responseTime.max = Math.max(metrics.responseTime.max, responseTime);
  metrics.responseTime.avg = metrics.responseTime.total / metrics.responseTime.count;
  
  // Update system metrics
  const memUsage = process.memoryUsage();
  metrics.system.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;
  metrics.system.uptime = process.uptime();
};

export const updateErrorMetrics = (errorType: string) => {
  metrics.errors.total++;
  metrics.errors.byType[errorType] = (metrics.errors.byType[errorType] || 0) + 1;
};

export const updateAuthMetrics = (event: keyof Metrics['authentication']) => {
  metrics.authentication[event]++;
};

export const updateUserMetrics = (updates: Partial<Metrics['users']>) => {
  Object.assign(metrics.users, updates);
};

/**
 * @route GET /metrics
 * @desc Get all metrics in Prometheus format
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Update system metrics
    const memUsage = process.memoryUsage();
    metrics.system.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;
    metrics.system.uptime = process.uptime();

    // Generate Prometheus format metrics
    const prometheusMetrics = [
      // Request metrics
      `# HELP http_requests_total Total number of HTTP requests`,
      `# TYPE http_requests_total counter`,
      `http_requests_total{service="auth-service"} ${metrics.requests.total}`,
      '',
      
      // Method metrics
      `# HELP http_requests_by_method_total Total number of HTTP requests by method`,
      `# TYPE http_requests_by_method_total counter`,
      ...Object.entries(metrics.requests.byMethod).map(([method, count]) => 
        `http_requests_by_method_total{method="${method}",service="auth-service"} ${count}`
      ),
      '',
      
      // Status metrics
      `# HELP http_requests_by_status_total Total number of HTTP requests by status`,
      `# TYPE http_requests_by_status_total counter`,
      ...Object.entries(metrics.requests.byStatus).map(([status, count]) => 
        `http_requests_by_status_total{status="${status}",service="auth-service"} ${count}`
      ),
      '',
      
      // Response time metrics
      `# HELP http_response_time_seconds Response time in seconds`,
      `# TYPE http_response_time_seconds histogram`,
      `http_response_time_seconds{service="auth-service",quantile="0.5"} ${metrics.responseTime.avg / 1000}`,
      `http_response_time_seconds{service="auth-service",quantile="0.9"} ${metrics.responseTime.max / 1000}`,
      `http_response_time_seconds{service="auth-service",quantile="0.99"} ${metrics.responseTime.max / 1000}`,
      `http_response_time_seconds_sum{service="auth-service"} ${metrics.responseTime.total / 1000}`,
      `http_response_time_seconds_count{service="auth-service"} ${metrics.responseTime.count}`,
      '',
      
      // Error metrics
      `# HELP http_errors_total Total number of HTTP errors`,
      `# TYPE http_errors_total counter`,
      `http_errors_total{service="auth-service"} ${metrics.errors.total}`,
      '',
      
      // Authentication metrics
      `# HELP auth_logins_total Total number of successful logins`,
      `# TYPE auth_logins_total counter`,
      `auth_logins_total{service="auth-service"} ${metrics.authentication.logins}`,
      '',
      
      `# HELP auth_logouts_total Total number of logouts`,
      `# TYPE auth_logouts_total counter`,
      `auth_logouts_total{service="auth-service"} ${metrics.authentication.logouts}`,
      '',
      
      `# HELP auth_registrations_total Total number of user registrations`,
      `# TYPE auth_registrations_total counter`,
      `auth_registrations_total{service="auth-service"} ${metrics.authentication.registrations}`,
      '',
      
      `# HELP auth_failed_logins_total Total number of failed login attempts`,
      `# TYPE auth_failed_logins_total counter`,
      `auth_failed_logins_total{service="auth-service"} ${metrics.authentication.failedLogins}`,
      '',
      
      `# HELP auth_password_resets_total Total number of password resets`,
      `# TYPE auth_password_resets_total counter`,
      `auth_password_resets_total{service="auth-service"} ${metrics.authentication.passwordResets}`,
      '',
      
      // User metrics
      `# HELP users_total Total number of users`,
      `# TYPE users_total gauge`,
      `users_total{service="auth-service"} ${metrics.users.total}`,
      '',
      
      `# HELP users_active Total number of active users`,
      `# TYPE users_active gauge`,
      `users_active{service="auth-service"} ${metrics.users.active}`,
      '',
      
      `# HELP users_new_today Total number of new users today`,
      `# TYPE users_new_today counter`,
      `users_new_today{service="auth-service"} ${metrics.users.newToday}`,
      '',
      
      `# HELP users_new_this_week Total number of new users this week`,
      `# TYPE users_new_this_week counter`,
      `users_new_this_week{service="auth-service"} ${metrics.users.newThisWeek}`,
      '',
      
      `# HELP users_new_this_month Total number of new users this month`,
      `# TYPE users_new_this_month counter`,
      `users_new_this_month{service="auth-service"} ${metrics.users.newThisMonth}`,
      '',
      
      // System metrics
      `# HELP process_memory_usage_ratio Memory usage ratio`,
      `# TYPE process_memory_usage_ratio gauge`,
      `process_memory_usage_ratio{service="auth-service"} ${metrics.system.memoryUsage}`,
      '',
      
      `# HELP process_uptime_seconds Process uptime in seconds`,
      `# TYPE process_uptime_seconds gauge`,
      `process_uptime_seconds{service="auth-service"} ${metrics.system.uptime}`,
      '',
      
      `# HELP process_cpu_usage_seconds CPU usage in seconds`,
      `# TYPE process_cpu_usage_seconds gauge`,
      `process_cpu_usage_seconds{service="auth-service"} ${metrics.system.cpuUsage}`,
    ].join('\n');

    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    logger.error('Metrics generation failed', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /metrics/json
 * @desc Get metrics in JSON format
 * @access Public
 */
router.get('/json', async (req, res) => {
  try {
    // Update system metrics
    const memUsage = process.memoryUsage();
    metrics.system.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;
    metrics.system.uptime = process.uptime();

    res.json({
      success: true,
      data: {
        ...metrics,
        timestamp: new Date().toISOString(),
        service: 'auth-service',
        version: '1.0.0',
      },
    });
  } catch (error) {
    logger.error('JSON metrics generation failed', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route GET /metrics/summary
 * @desc Get metrics summary for dashboards
 * @access Public
 */
router.get('/summary', async (req, res) => {
  try {
    // Update system metrics
    const memUsage = process.memoryUsage();
    metrics.system.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;
    metrics.system.uptime = process.uptime();

    const summary = {
      requests: {
        total: metrics.requests.total,
        successRate: metrics.responseTime.count > 0 
          ? ((metrics.responseTime.count - metrics.errors.total) / metrics.responseTime.count * 100).toFixed(2)
          : '0.00',
        avgResponseTime: metrics.responseTime.avg.toFixed(2),
        topEndpoints: Object.entries(metrics.requests.byEndpoint)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([endpoint, count]) => ({ endpoint, count })),
      },
      authentication: {
        logins: metrics.authentication.logins,
        logouts: metrics.authentication.logouts,
        registrations: metrics.authentication.registrations,
        failedLogins: metrics.authentication.failedLogins,
        passwordResets: metrics.authentication.passwordResets,
        successRate: metrics.authentication.logins > 0 
          ? ((metrics.authentication.logins - metrics.authentication.failedLogins) / metrics.authentication.logins * 100).toFixed(2)
          : '0.00',
      },
      users: {
        total: metrics.users.total,
        active: metrics.users.active,
        newToday: metrics.users.newToday,
        newThisWeek: metrics.users.newThisWeek,
        newThisMonth: metrics.users.newThisMonth,
        growthRate: metrics.users.total > 0 
          ? ((metrics.users.newThisMonth / metrics.users.total) * 100).toFixed(2)
          : '0.00',
      },
      system: {
        memoryUsage: (metrics.system.memoryUsage * 100).toFixed(2),
        uptime: Math.floor(metrics.system.uptime / 3600), // hours
        errors: metrics.errors.total,
        errorRate: metrics.responseTime.count > 0 
          ? (metrics.errors.total / metrics.responseTime.count * 100).toFixed(2)
          : '0.00',
      },
      timestamp: new Date().toISOString(),
      service: 'auth-service',
      version: '1.0.0',
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Metrics summary generation failed', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to generate metrics summary',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @route POST /metrics/reset
 * @desc Reset all metrics (for testing purposes)
 * @access Public
 */
router.post('/reset', async (req, res) => {
  try {
    // Reset metrics
    metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byStatus: {},
        byEndpoint: {},
      },
      responseTime: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0,
        avg: 0,
      },
      errors: {
        total: 0,
        byType: {},
      },
      authentication: {
        logins: 0,
        logouts: 0,
        registrations: 0,
        failedLogins: 0,
        passwordResets: 0,
      },
      users: {
        active: 0,
        total: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0,
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0,
      },
    };

    logger.info('Metrics reset successfully');

    res.json({
      success: true,
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Metrics reset failed', {
      error: error instanceof Error ? error.message : error,
    });

    res.status(500).json({
      success: false,
      message: 'Failed to reset metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as metricsRouter };

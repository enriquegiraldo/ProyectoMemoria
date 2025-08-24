import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { audit } from '../utils/logger';
import { RateLimitError } from '../utils/errors';
import { getRateLimits, ROLES } from '../utils/auth.utils';

// Rate limit configurations
const RATE_LIMIT_CONFIGS = {
  // General API rate limits
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 uploads per hour
    message: 'Upload limit exceeded, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // File processing endpoints
  processing: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 processing jobs per hour
    message: 'Processing limit exceeded, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Admin endpoints
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: 'Admin API limit exceeded, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Public endpoints (health checks, etc.)
  public: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per minute
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },
};

// Speed limit configurations
const SPEED_LIMIT_CONFIGS = {
  // General API speed limits
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: 50, // allow 50 requests per 15 minutes, then...
    delayMs: 500, // begin adding 500ms of delay per request
    maxDelayMs: 20000, // max delay of 20 seconds
  },
  
  // File upload speed limits
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    delayAfter: 5, // allow 5 uploads per hour, then...
    delayMs: 1000, // begin adding 1 second of delay per upload
    maxDelayMs: 30000, // max delay of 30 seconds
  },
  
  // Processing speed limits
  processing: {
    windowMs: 60 * 60 * 1000, // 1 hour
    delayAfter: 10, // allow 10 processing jobs per hour, then...
    delayMs: 2000, // begin adding 2 seconds of delay per job
    maxDelayMs: 60000, // max delay of 1 minute
  },
};

/**
 * Create rate limiter with custom key generator
 */
function createRateLimiter(config: any, keyGenerator?: (req: Request) => string) {
  return rateLimit({
    ...config,
    keyGenerator: keyGenerator || ((req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.userId || req.ip;
    }),
    handler: (req: Request, res: Response) => {
      const userId = req.user?.userId || 'anonymous';
      const ip = req.ip;
      
      // Log rate limit violation
      logger.warn('Rate limit exceeded', {
        userId,
        ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });
      
      // Record metrics
      metrics.recordRateLimitExceeded(userId, req.path, 'rate_limit');
      
      // Audit log
      audit.securityEvent(
        userId,
        'rate_limit_exceeded',
        'medium',
        ip,
        { path: req.path, method: req.method }
      );
      
      res.status(429).json({
        success: false,
        error: {
          message: config.message,
          code: 'RATE_LIMIT_EXCEEDED',
          statusCode: 429,
          timestamp: new Date().toISOString(),
          retryAfter: Math.ceil(config.windowMs / 1000),
        },
      });
    },
    skip: (req: Request) => {
      // Skip rate limiting for system users
      return req.user?.role === ROLES.SYSTEM;
    },
  });
}

/**
 * Create speed limiter
 */
function createSpeedLimiter(config: any, keyGenerator?: (req: Request) => string) {
  return slowDown({
    ...config,
    keyGenerator: keyGenerator || ((req: Request) => {
      return req.user?.userId || req.ip;
    }),
    skip: (req: Request) => {
      // Skip speed limiting for system users
      return req.user?.role === ROLES.SYSTEM;
    },
  });
}

/**
 * Role-based rate limiter
 * Applies different limits based on user role
 */
export const roleBasedRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId || 'anonymous';
  const role = req.user?.role || 'anonymous';
  const path = req.path;
  
  // Get rate limits for user role
  const rateLimits = getRateLimits(role as any);
  
  // Determine endpoint type
  let endpointType = 'general';
  if (path.includes('/upload')) {
    endpointType = 'upload';
  } else if (path.includes('/process')) {
    endpointType = 'processing';
  } else if (path.includes('/admin')) {
    endpointType = 'admin';
  } else if (path.includes('/auth')) {
    endpointType = 'auth';
  } else if (path.includes('/health') || path.includes('/metrics')) {
    endpointType = 'public';
  }
  
  // Apply appropriate rate limit
  const limiter = createRateLimiter(RATE_LIMIT_CONFIGS[endpointType]);
  return limiter(req, res, next);
};

/**
 * User-based rate limiter
 * Applies limits based on authenticated user
 */
export const userBasedRateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    // For unauthenticated requests, use IP-based limiting
    const limiter = createRateLimiter(RATE_LIMIT_CONFIGS.general);
    return limiter(req, res, next);
  }
  
  const userId = req.user.userId;
  const role = req.user.role;
  const rateLimits = getRateLimits(role);
  
  // Create custom rate limiter for user
  const limiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: rateLimits.uploadsPerHour, // Use role-based limits
    message: `Upload limit exceeded for role ${role}, please try again later.`,
    standardHeaders: true,
    legacyHeaders: false,
  }, (req: Request) => userId);
  
  return limiter(req, res, next);
};

/**
 * Upload-specific rate limiter
 */
export const uploadRateLimit = createRateLimiter(RATE_LIMIT_CONFIGS.upload);

/**
 * Processing-specific rate limiter
 */
export const processingRateLimit = createRateLimiter(RATE_LIMIT_CONFIGS.processing);

/**
 * Authentication rate limiter
 */
export const authRateLimit = createRateLimiter(RATE_LIMIT_CONFIGS.auth);

/**
 * Admin rate limiter
 */
export const adminRateLimit = createRateLimiter(RATE_LIMIT_CONFIGS.admin);

/**
 * Public endpoint rate limiter
 */
export const publicRateLimit = createRateLimiter(RATE_LIMIT_CONFIGS.public);

/**
 * General API rate limiter
 */
export const generalRateLimit = createRateLimiter(RATE_LIMIT_CONFIGS.general);

/**
 * Upload speed limiter
 */
export const uploadSpeedLimit = createSpeedLimiter(SPEED_LIMIT_CONFIGS.upload);

/**
 * Processing speed limiter
 */
export const processingSpeedLimit = createSpeedLimiter(SPEED_LIMIT_CONFIGS.processing);

/**
 * General speed limiter
 */
export const generalSpeedLimit = createSpeedLimiter(SPEED_LIMIT_CONFIGS.general);

/**
 * Dynamic rate limiter based on user role and endpoint
 */
export const dynamicRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId || 'anonymous';
  const role = req.user?.role || 'anonymous';
  const path = req.path;
  const method = req.method;
  
  // Skip for system users
  if (role === ROLES.SYSTEM) {
    return next();
  }
  
  // Get rate limits for role
  const rateLimits = getRateLimits(role as any);
  
  // Determine limits based on endpoint and method
  let maxRequests: number;
  let windowMs: number;
  
  if (path.includes('/upload') && method === 'POST') {
    maxRequests = rateLimits.uploadsPerHour;
    windowMs = 60 * 60 * 1000; // 1 hour
  } else if (path.includes('/process') && method === 'POST') {
    maxRequests = rateLimits.processingPerHour;
    windowMs = 60 * 60 * 1000; // 1 hour
  } else if (path.includes('/admin')) {
    maxRequests = 100; // Admin endpoints have higher limits
    windowMs = 15 * 60 * 1000; // 15 minutes
  } else {
    maxRequests = 100; // General API limit
    windowMs = 15 * 60 * 1000; // 15 minutes
  }
  
  // Create dynamic rate limiter
  const limiter = createRateLimiter({
    windowMs,
    max: maxRequests,
    message: `Rate limit exceeded for ${role} role, please try again later.`,
    standardHeaders: true,
    legacyHeaders: false,
  }, (req: Request) => userId);
  
  return limiter(req, res, next);
};

/**
 * Burst rate limiter for high-traffic periods
 */
export const burstRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 requests per minute
  message: 'Too many requests in a short time, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => req.user?.role === ROLES.SYSTEM,
  handler: (req: Request, res: Response) => {
    const userId = req.user?.userId || 'anonymous';
    const ip = req.ip;
    
    logger.warn('Burst rate limit exceeded', {
      userId,
      ip,
      path: req.path,
      method: req.method,
    });
    
    metrics.recordRateLimitExceeded(userId, req.path, 'burst_limit');
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests in a short time, please slow down.',
        code: 'BURST_RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        timestamp: new Date().toISOString(),
        retryAfter: 60,
      },
    });
  },
});

/**
 * File size-based rate limiter
 * Limits based on total file size uploaded
 */
export const fileSizeRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId || 'anonymous';
  const role = req.user?.role || 'anonymous';
  
  // Skip for system users
  if (role === ROLES.SYSTEM) {
    return next();
  }
  
  // Get file size from request
  const fileSize = req.headers['content-length'] ? parseInt(req.headers['content-length']) : 0;
  
  // Define size-based limits
  const sizeLimits = {
    [ROLES.USER]: 50 * 1024 * 1024, // 50MB per hour
    [ROLES.PREMIUM]: 200 * 1024 * 1024, // 200MB per hour
    [ROLES.ADMIN]: 1024 * 1024 * 1024, // 1GB per hour
    anonymous: 10 * 1024 * 1024, // 10MB per hour
  };
  
  const maxSize = sizeLimits[role] || sizeLimits.anonymous;
  
  // This would typically be implemented with Redis to track cumulative file sizes
  // For now, we'll just check individual file size
  if (fileSize > maxSize) {
    logger.warn('File size rate limit exceeded', {
      userId,
      role,
      fileSize,
      maxSize,
    });
    
    metrics.recordRateLimitExceeded(userId, req.path, 'file_size_limit');
    
    res.status(413).json({
      success: false,
      error: {
        message: `File size exceeds limit for role ${role}`,
        code: 'FILE_SIZE_LIMIT_EXCEEDED',
        statusCode: 413,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  
  next();
};

/**
 * Rate limit headers middleware
 * Adds rate limit information to response headers
 */
export const rateLimitHeaders = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId || 'anonymous';
  const role = req.user?.role || 'anonymous';
  
  // Add rate limit info to headers
  res.set({
    'X-RateLimit-User': userId,
    'X-RateLimit-Role': role,
    'X-RateLimit-Path': req.path,
  });
  
  next();
};

/**
 * Rate limit monitoring middleware
 * Logs rate limit usage for monitoring
 */
export const rateLimitMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user?.userId || 'anonymous';
  const role = req.user?.role || 'anonymous';
  const path = req.path;
  
  // Log rate limit usage
  logger.debug('Rate limit usage', {
    userId,
    role,
    path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  
  // Record metrics
  metrics.setRateLimitRemaining(userId, path, 'general', 100); // This would be dynamic
  
  next();
};

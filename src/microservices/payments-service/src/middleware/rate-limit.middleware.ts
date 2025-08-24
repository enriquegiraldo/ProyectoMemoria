import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { logger } from '../utils';

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: '15 minutes',
    });
  },
};

// Speed limiting configuration
const speedLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // begin adding 500ms of delay per request above 50
  maxDelayMs: 20000, // max delay of 20 seconds
};

// Create rate limiters
export const rateLimiter = rateLimit(rateLimitConfig);
export const speedLimiter = slowDown(speedLimitConfig);

// Specific rate limiters for different endpoints
export const paymentRateLimiter = rateLimit({
  ...rateLimitConfig,
  max: 50, // More restrictive for payment endpoints
  windowMs: 5 * 60 * 1000, // 5 minutes
  message: {
    error: 'Too many payment requests, please try again later.',
    retryAfter: '5 minutes',
  },
});

export const subscriptionRateLimiter = rateLimit({
  ...rateLimitConfig,
  max: 30, // Even more restrictive for subscription endpoints
  windowMs: 10 * 60 * 1000, // 10 minutes
  message: {
    error: 'Too many subscription requests, please try again later.',
    retryAfter: '10 minutes',
  },
});

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Allow more webhook requests
  message: {
    error: 'Too many webhook requests, please try again later.',
    retryAfter: '1 minute',
  },
});

// Dynamic rate limiting based on user role
export const dynamicRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user;
  let maxRequests = 100; // Default limit

  if (user) {
    switch (user.role) {
      case 'admin':
        maxRequests = 1000;
        break;
      case 'premium':
        maxRequests = 500;
        break;
      case 'service':
        maxRequests = 2000;
        break;
      default:
        maxRequests = 100;
    }
  }

  const limiter = rateLimit({
    ...rateLimitConfig,
    max: maxRequests,
    keyGenerator: (req) => {
      return user ? `${user.id}-${req.ip}` : req.ip;
    },
  });

  return limiter(req, res, next);
};

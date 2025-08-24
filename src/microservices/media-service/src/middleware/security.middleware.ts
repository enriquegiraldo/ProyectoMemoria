import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../utils/logger';
import { audit } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { config } from '../config';

/**
 * Security headers middleware using Helmet
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: "cross-origin" },
  
  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: "same-origin" },
  
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  
  // Expect CT
  expectCt: { enforce: true, maxAge: 30 },
  
  // Frameguard
  frameguard: { action: "deny" },
  
  // Hide Powered-By
  hidePoweredBy: true,
  
  // HSTS
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  
  // IE No Open
  ieNoOpen: true,
  
  // NoSniff
  noSniff: true,
  
  // Origin Agent Cluster
  originAgentCluster: true,
  
  // Permissions Policy
  permissionsPolicy: {
    directives: {
      geolocation: ["'self'"],
      microphone: ["'none'"],
      camera: ["'none'"],
      payment: ["'none'"],
      usb: ["'none'"],
      magnetometer: ["'none'"],
      gyroscope: ["'none'"],
      accelerometer: ["'none'"],
    },
  },
  
  // Referrer Policy
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  
  // XSS Protection
  xssFilter: true,
});

/**
 * CORS configuration middleware
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Allow specific origins
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://memoria-eterna.com',
    'https://www.memoria-eterna.com',
  ];
  
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

/**
 * Request ID middleware
 * Adds unique request ID for tracing
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  // Add request ID to logger context
  req.requestId = requestId;
  
  next();
};

/**
 * IP address validation middleware
 */
export const ipValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Validate IP format
  if (!isValidIP(clientIp)) {
    logger.warn('Invalid IP address detected', {
      ip: clientIp,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    
    audit.securityEvent(
      'anonymous',
      'invalid_ip_address',
      'low',
      clientIp,
      { userAgent: req.get('User-Agent'), path: req.path }
    );
    
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid IP address',
        code: 'INVALID_IP_ADDRESS',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  
  // Check for suspicious IP patterns
  if (isSuspiciousIP(clientIp)) {
    logger.warn('Suspicious IP address detected', {
      ip: clientIp,
      userAgent: req.get('User-Agent'),
      path: req.path,
    });
    
    audit.securityEvent(
      'anonymous',
      'suspicious_ip_address',
      'medium',
      clientIp,
      { userAgent: req.get('User-Agent'), path: req.path }
    );
    
    metrics.recordError('security', 'SUSPICIOUS_IP', 'media-service');
  }
  
  next();
};

/**
 * User agent validation middleware
 */
export const userAgentValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const userAgent = req.get('User-Agent');
  
  if (!userAgent) {
    logger.warn('Missing User-Agent header', {
      ip: req.ip,
      path: req.path,
    });
    
    audit.securityEvent(
      req.user?.userId || 'anonymous',
      'missing_user_agent',
      'low',
      req.ip,
      { path: req.path }
    );
  } else if (isSuspiciousUserAgent(userAgent)) {
    logger.warn('Suspicious User-Agent detected', {
      userAgent,
      ip: req.ip,
      path: req.path,
    });
    
    audit.securityEvent(
      req.user?.userId || 'anonymous',
      'suspicious_user_agent',
      'medium',
      req.ip,
      { userAgent, path: req.path }
    );
    
    metrics.recordError('security', 'SUSPICIOUS_USER_AGENT', 'media-service');
  }
  
  next();
};

/**
 * Content type validation middleware
 */
export const contentTypeValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentType = req.get('Content-Type');
  
  // For POST/PUT requests, require Content-Type
  if ((req.method === 'POST' || req.method === 'PUT') && !contentType) {
    logger.warn('Missing Content-Type header', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.user?.userId,
    });
    
    res.status(400).json({
      success: false,
      error: {
        message: 'Content-Type header is required',
        code: 'MISSING_CONTENT_TYPE',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  
  // Validate Content-Type for specific endpoints
  if (contentType && !isValidContentType(contentType, req.path)) {
    logger.warn('Invalid Content-Type', {
      contentType,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.user?.userId,
    });
    
    res.status(400).json({
      success: false,
      error: {
        message: 'Invalid Content-Type',
        code: 'INVALID_CONTENT_TYPE',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  
  next();
};

/**
 * Request size validation middleware
 */
export const requestSizeValidationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = 100 * 1024 * 1024; // 100MB
  
  if (contentLength > maxSize) {
    logger.warn('Request too large', {
      contentLength,
      maxSize,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userId: req.user?.userId,
    });
    
    res.status(413).json({
      success: false,
      error: {
        message: 'Request entity too large',
        code: 'REQUEST_TOO_LARGE',
        statusCode: 413,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  
  next();
};

/**
 * SQL injection protection middleware
 */
export const sqlInjectionProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
    /(\b(OR|AND)\b\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+\s*--)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+\s*#)/i,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+\s*\/\*)/i,
  ];
  
  const requestData = {
    query: req.query,
    body: req.body,
    params: req.params,
    headers: req.headers,
  };
  
  const requestString = JSON.stringify(requestData);
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(requestString)) {
      logger.warn('SQL injection attempt detected', {
        pattern: pattern.source,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.userId,
      });
      
      audit.securityEvent(
        req.user?.userId || 'anonymous',
        'sql_injection_attempt',
        'high',
        req.ip,
        { pattern: pattern.source, path: req.path, method: req.method }
      );
      
      metrics.recordError('security', 'SQL_INJECTION_ATTEMPT', 'media-service');
      
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request data',
          code: 'INVALID_REQUEST_DATA',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
  }
  
  next();
};

/**
 * XSS protection middleware
 */
export const xssProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
    /<link[^>]*>/gi,
    /<meta[^>]*>/gi,
  ];
  
  const requestData = {
    query: req.query,
    body: req.body,
    params: req.params,
  };
  
  const requestString = JSON.stringify(requestData);
  
  for (const pattern of xssPatterns) {
    if (pattern.test(requestString)) {
      logger.warn('XSS attempt detected', {
        pattern: pattern.source,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userId: req.user?.userId,
      });
      
      audit.securityEvent(
        req.user?.userId || 'anonymous',
        'xss_attempt',
        'high',
        req.ip,
        { pattern: pattern.source, path: req.path, method: req.method }
      );
      
      metrics.recordError('security', 'XSS_ATTEMPT', 'media-service');
      
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request data',
          code: 'INVALID_REQUEST_DATA',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
  }
  
  next();
};

/**
 * Path traversal protection middleware
 */
export const pathTraversalProtectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const pathTraversalPatterns = [
    /\.\./,
    /\/\.\.\//,
    /\.\.\/\.\./,
    /%2e%2e/,
    /%2E%2E/,
    /\.\.%2f/,
    /%2f\.\./,
  ];
  
  const requestPath = req.path + JSON.stringify(req.query) + JSON.stringify(req.params);
  
  for (const pattern of pathTraversalPatterns) {
    if (pattern.test(requestPath)) {
      logger.warn('Path traversal attempt detected', {
        pattern: pattern.source,
        path: req.path,
        ip: req.ip,
        userId: req.user?.userId,
      });
      
      audit.securityEvent(
        req.user?.userId || 'anonymous',
        'path_traversal_attempt',
        'high',
        req.ip,
        { pattern: pattern.source, path: req.path }
      );
      
      metrics.recordError('security', 'PATH_TRAVERSAL_ATTEMPT', 'media-service');
      
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request path',
          code: 'INVALID_REQUEST_PATH',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
  }
  
  next();
};

/**
 * Request logging middleware
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
    requestId: req.requestId,
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk: any, encoding: any) {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.userId,
      requestId: req.requestId,
    });
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Utility functions

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function isSuspiciousIP(ip: string): boolean {
  // Check for private IP ranges
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^::1$/,
  ];
  
  return privateRanges.some(range => range.test(ip));
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i,
    /ruby/i,
    /php/i,
    /go-http-client/i,
    /okhttp/i,
    /axios/i,
    /fetch/i,
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent));
}

function isValidContentType(contentType: string, path: string): boolean {
  const allowedTypes = [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
    'text/plain',
  ];
  
  // For file upload endpoints, allow multipart/form-data
  if (path.includes('/upload')) {
    return contentType.startsWith('multipart/form-data');
  }
  
  // For API endpoints, allow JSON
  if (path.startsWith('/api/')) {
    return contentType.startsWith('application/json');
  }
  
  return allowedTypes.some(type => contentType.startsWith(type));
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

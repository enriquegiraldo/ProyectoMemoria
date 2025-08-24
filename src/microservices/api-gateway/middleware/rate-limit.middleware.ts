import { NextApiRequest, NextApiResponse } from 'next';
import { gatewayConfig, ServiceConfig } from '../config/gateway.config';

export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}

export interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
  nextAttempt: number;
}

export class RateLimitMiddleware {
  private static instance: RateLimitMiddleware;
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();

  static getInstance(): RateLimitMiddleware {
    if (!RateLimitMiddleware.instance) {
      RateLimitMiddleware.instance = new RateLimitMiddleware();
    }
    return RateLimitMiddleware.instance;
  }

  private getClientIdentifier(req: NextApiRequest): string {
    const apiKey = req.headers[gatewayConfig.security.apiKeyHeader] as string;
    const authHeader = req.headers.authorization as string;
    const ip = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    
    if (apiKey) {
      return `api:${apiKey.substring(0, 10)}`;
    }
    
    if (authHeader) {
      return `jwt:${authHeader.substring(0, 10)}`;
    }
    
    return `ip:${ip}`;
  }

  async checkRateLimit(req: NextApiRequest): Promise<{ allowed: boolean; info?: RateLimitInfo; error?: string }> {
    const clientId = this.getClientIdentifier(req);
    const now = Date.now();
    const windowMs = gatewayConfig.rateLimit.windowMs;
    
    // Get or create rate limit info for this client
    let rateLimitInfo = this.requestCounts.get(clientId);
    
    if (!rateLimitInfo || now > rateLimitInfo.resetTime) {
      rateLimitInfo = {
        count: 0,
        resetTime: now + windowMs
      };
    }
    
    // Check if limit exceeded
    if (rateLimitInfo.count >= gatewayConfig.rateLimit.maxRequests) {
      return {
        allowed: false,
        error: 'Rate limit exceeded',
        info: {
          remaining: 0,
          reset: rateLimitInfo.resetTime,
          limit: gatewayConfig.rateLimit.maxRequests
        }
      };
    }
    
    // Increment count
    rateLimitInfo.count++;
    this.requestCounts.set(clientId, rateLimitInfo);
    
    return {
      allowed: true,
      info: {
        remaining: gatewayConfig.rateLimit.maxRequests - rateLimitInfo.count,
        reset: rateLimitInfo.resetTime,
        limit: gatewayConfig.rateLimit.maxRequests
      }
    };
  }

  async checkCircuitBreaker(serviceName: string): Promise<{ allowed: boolean; state: CircuitBreakerState }> {
    const service = gatewayConfig.services.find(s => s.name === serviceName);
    if (!service) {
      return { allowed: false, state: { failures: 0, lastFailure: 0, state: 'open', nextAttempt: 0 } };
    }

    let circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      circuitBreaker = {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
        nextAttempt: 0
      };
      this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    const now = Date.now();

    // Check if circuit breaker is open and recovery time has passed
    if (circuitBreaker.state === 'open' && now >= circuitBreaker.nextAttempt) {
      circuitBreaker.state = 'half-open';
      circuitBreaker.failures = 0;
    }

    // Allow request if circuit breaker is closed or half-open
    if (circuitBreaker.state === 'closed' || circuitBreaker.state === 'half-open') {
      return { allowed: true, state: circuitBreaker };
    }

    return { allowed: false, state: circuitBreaker };
  }

  recordSuccess(serviceName: string): void {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.failures = 0;
      circuitBreaker.state = 'closed';
      circuitBreaker.lastFailure = 0;
    }
  }

  recordFailure(serviceName: string): void {
    const service = gatewayConfig.services.find(s => s.name === serviceName);
    if (!service) return;

    let circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      circuitBreaker = {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
        nextAttempt: 0
      };
    }

    circuitBreaker.failures++;
    circuitBreaker.lastFailure = Date.now();

    // Check if failure threshold exceeded
    if (circuitBreaker.failures >= service.circuitBreaker.failureThreshold) {
      circuitBreaker.state = 'open';
      circuitBreaker.nextAttempt = Date.now() + service.circuitBreaker.recoveryTimeout;
    }

    this.circuitBreakers.set(serviceName, circuitBreaker);
  }

  async rateLimitMiddleware(req: NextApiRequest, res: NextApiResponse, next: () => void): Promise<void> {
    const rateLimitResult = await this.checkRateLimit(req);
    
    if (!rateLimitResult.allowed) {
      res.setHeader('X-RateLimit-Limit', rateLimitResult.info?.limit.toString() || '0');
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.info?.remaining.toString() || '0');
      res.setHeader('X-RateLimit-Reset', rateLimitResult.info?.reset.toString() || '0');
      res.setHeader('Retry-After', Math.ceil((rateLimitResult.info?.reset || 0) / 1000).toString());
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.info?.reset || 0) / 1000)
      });
      return;
    }

    // Add rate limit headers
    if (rateLimitResult.info) {
      res.setHeader('X-RateLimit-Limit', rateLimitResult.info.limit.toString());
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.info.remaining.toString());
      res.setHeader('X-RateLimit-Reset', rateLimitResult.info.reset.toString());
    }

    next();
  }

  async circuitBreakerMiddleware(serviceName: string): Promise<(req: NextApiRequest, res: NextApiResponse, next: () => void) => Promise<void>> {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const circuitBreakerResult = await this.checkCircuitBreaker(serviceName);
      
      if (!circuitBreakerResult.allowed) {
        res.status(503).json({
          error: 'Service temporarily unavailable',
          retryAfter: Math.ceil((circuitBreakerResult.state.nextAttempt - Date.now()) / 1000)
        });
        return;
      }

      // Add circuit breaker headers
      res.setHeader('X-Circuit-Breaker-State', circuitBreakerResult.state.state);
      res.setHeader('X-Circuit-Breaker-Failures', circuitBreakerResult.state.failures.toString());

      next();
    };
  }

  getRateLimitStats(): Record<string, { count: number; resetTime: number }> {
    const stats: Record<string, { count: number; resetTime: number }> = {};
    this.requestCounts.forEach((value, key) => {
      stats[key] = { ...value };
    });
    return stats;
  }

  getCircuitBreakerStats(): Record<string, CircuitBreakerState> {
    const stats: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((value, key) => {
      stats[key] = { ...value };
    });
    return stats;
  }

  resetRateLimits(): void {
    this.requestCounts.clear();
  }

  resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
  }

  resetAll(): void {
    this.resetRateLimits();
    this.resetCircuitBreakers();
  }
}

export const rateLimitMiddleware = RateLimitMiddleware.getInstance();

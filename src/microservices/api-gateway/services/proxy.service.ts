import { NextApiRequest, NextApiResponse } from 'next';
import { gatewayConfig, findRoute, getServiceByName } from '../config/gateway.config';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export interface ProxyRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
}

export interface ServiceInstance {
  url: string;
  healthy: boolean;
  lastCheck: number;
  responseTime: number;
  load: number;
}

export class ProxyService {
  private static instance: ProxyService;
  private serviceInstances: Map<string, ServiceInstance[]> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): ProxyService {
    if (!ProxyService.instance) {
      ProxyService.instance = new ProxyService();
    }
    return ProxyService.instance;
  }

  constructor() {
    this.initializeServiceInstances();
    this.startHealthChecks();
  }

  private initializeServiceInstances(): void {
    gatewayConfig.services.forEach(service => {
      this.serviceInstances.set(service.name, [{
        url: service.url,
        healthy: true,
        lastCheck: Date.now(),
        responseTime: 0,
        load: 0
      }]);
    });
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }

  private async performHealthChecks(): Promise<void> {
    const healthChecks = gatewayConfig.services.map(async (service) => {
      const instances = this.serviceInstances.get(service.name) || [];
      
      for (const instance of instances) {
        try {
          const startTime = Date.now();
          const response = await fetch(`${instance.url}${service.healthCheck}`, {
            method: 'GET',
            timeout: service.timeout
          });
          
          const responseTime = Date.now() - startTime;
          
          instance.healthy = response.ok;
          instance.lastCheck = Date.now();
          instance.responseTime = responseTime;
          
          if (response.ok) {
            rateLimitMiddleware.recordSuccess(service.name);
          } else {
            rateLimitMiddleware.recordFailure(service.name);
          }
        } catch (error) {
          console.error(`Health check failed for ${service.name}:`, error);
          instance.healthy = false;
          instance.lastCheck = Date.now();
          rateLimitMiddleware.recordFailure(service.name);
        }
      }
    });

    await Promise.all(healthChecks);
  }

  private selectServiceInstance(serviceName: string): ServiceInstance | null {
    const instances = this.serviceInstances.get(serviceName) || [];
    const healthyInstances = instances.filter(instance => instance.healthy);
    
    if (healthyInstances.length === 0) {
      return null;
    }

    // Simple round-robin load balancing
    // In a real implementation, you might use more sophisticated algorithms
    const selectedIndex = Math.floor(Math.random() * healthyInstances.length);
    return healthyInstances[selectedIndex];
  }

  async proxyRequest(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Find the route configuration
      const route = findRoute(req.url || '', req.method || 'GET');
      if (!route) {
        res.status(404).json({ error: 'Route not found' });
        return;
      }

      // Get service configuration
      const service = getServiceByName(route.service);
      if (!service) {
        res.status(500).json({ error: 'Service not configured' });
        return;
      }

      // Select service instance
      const instance = this.selectServiceInstance(route.service);
      if (!instance) {
        res.status(503).json({ error: 'Service unavailable' });
        return;
      }

      // Prepare request
      const proxyRequest: ProxyRequest = {
        method: req.method || 'GET',
        url: `${instance.url}${req.url}`,
        headers: this.prepareHeaders(req),
        body: req.body,
        timeout: service.timeout
      };

      // Make the request
      const proxyResponse = await this.makeRequest(proxyRequest);
      
      // Record success
      rateLimitMiddleware.recordSuccess(route.service);
      
      // Send response
      this.sendResponse(res, proxyResponse);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(route.service, responseTime, true);
      
    } catch (error) {
      console.error('Proxy request failed:', error);
      
      // Record failure
      const route = findRoute(req.url || '', req.method || 'GET');
      if (route) {
        rateLimitMiddleware.recordFailure(route.service);
        this.updateMetrics(route.service, Date.now() - startTime, false);
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private prepareHeaders(req: NextApiRequest): Record<string, string> {
    const headers: Record<string, string> = {};
    
    // Copy relevant headers
    const allowedHeaders = [
      'content-type',
      'authorization',
      'x-api-key',
      'x-tenant-id',
      'x-request-id',
      'user-agent',
      'accept',
      'accept-language'
    ];

    allowedHeaders.forEach(header => {
      const value = req.headers[header];
      if (value) {
        headers[header] = Array.isArray(value) ? value[0] : value;
      }
    });

    // Add gateway headers
    headers['x-gateway-version'] = '1.0.0';
    headers['x-forwarded-for'] = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
    headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] as string || 'http';
    headers['x-forwarded-host'] = req.headers['x-forwarded-host'] as string || req.headers.host || '';

    // Add user context if authenticated
    const authenticatedReq = req as AuthenticatedRequest;
    if (authenticatedReq.user) {
      headers['x-user-id'] = authenticatedReq.user.id;
      headers['x-user-role'] = authenticatedReq.user.role;
      headers['x-user-permissions'] = authenticatedReq.user.permissions.join(',');
    }

    if (authenticatedReq.tenantId) {
      headers['x-tenant-id'] = authenticatedReq.tenantId;
    }

    return headers;
  }

  private async makeRequest(proxyRequest: ProxyRequest): Promise<ProxyResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), proxyRequest.timeout || 10000);

    try {
      const response = await fetch(proxyRequest.url, {
        method: proxyRequest.method,
        headers: proxyRequest.headers,
        body: proxyRequest.body ? JSON.stringify(proxyRequest.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let body;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }

      return {
        status: response.status,
        headers: responseHeaders,
        body,
        responseTime: Date.now()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private sendResponse(res: NextApiResponse, proxyResponse: ProxyResponse): void {
    // Set status
    res.status(proxyResponse.status);

    // Set headers
    Object.entries(proxyResponse.headers).forEach(([key, value]) => {
      if (!key.startsWith('x-gateway-')) { // Don't forward gateway headers
        res.setHeader(key, value);
      }
    });

    // Send body
    if (typeof proxyResponse.body === 'string') {
      res.send(proxyResponse.body);
    } else {
      res.json(proxyResponse.body);
    }
  }

  private updateMetrics(serviceName: string, responseTime: number, success: boolean): void {
    const instances = this.serviceInstances.get(serviceName) || [];
    const instance = instances[0]; // Update the first instance for now
    
    if (instance) {
      instance.responseTime = responseTime;
      instance.load = success ? Math.max(0, instance.load - 1) : instance.load + 1;
    }
  }

  getServiceHealth(): Record<string, ServiceInstance[]> {
    const health: Record<string, ServiceInstance[]> = {};
    this.serviceInstances.forEach((instances, serviceName) => {
      health[serviceName] = instances.map(instance => ({ ...instance }));
    });
    return health;
  }

  addServiceInstance(serviceName: string, url: string): void {
    const instances = this.serviceInstances.get(serviceName) || [];
    instances.push({
      url,
      healthy: true,
      lastCheck: Date.now(),
      responseTime: 0,
      load: 0
    });
    this.serviceInstances.set(serviceName, instances);
  }

  removeServiceInstance(serviceName: string, url: string): void {
    const instances = this.serviceInstances.get(serviceName) || [];
    const filteredInstances = instances.filter(instance => instance.url !== url);
    this.serviceInstances.set(serviceName, filteredInstances);
  }

  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const proxyService = ProxyService.getInstance();

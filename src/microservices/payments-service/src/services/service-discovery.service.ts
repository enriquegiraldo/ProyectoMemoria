import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils';
import config from '../config';

export interface ServiceInfo {
  name: string;
  version: string;
  url: string;
  healthCheck: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastHeartbeat: Date;
  metadata: Record<string, any>;
}

export interface ServiceRegistryConfig {
  registryUrl: string;
  serviceName: string;
  serviceVersion: string;
  serviceUrl: string;
  healthCheckPath: string;
  heartbeatInterval: number;
  timeout: number;
}

export class ServiceDiscoveryService {
  private registryClient: AxiosInstance;
  private config: ServiceRegistryConfig;
  private heartbeatInterval?: NodeJS.Timeout;
  private isRegistered: boolean = false;

  constructor() {
    this.config = {
      registryUrl: process.env.SERVICE_REGISTRY_URL || 'http://localhost:8080',
      serviceName: 'payments-service',
      serviceVersion: process.env.npm_package_version || '1.0.0',
      serviceUrl: process.env.SERVICE_URL || `http://localhost:${config.server.port}`,
      healthCheckPath: '/health',
      heartbeatInterval: 30000, // 30 seconds
      timeout: 5000
    };

    this.registryClient = axios.create({
      baseURL: this.config.registryUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `${this.config.serviceName}/${this.config.serviceVersion}`
      }
    });

    // Add request interceptor for logging
    this.registryClient.interceptors.request.use(
      (config) => {
        logger.debug('Service Registry Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          service: 'service-discovery'
        });
        return config;
      },
      (error) => {
        logger.error('Service Registry Request Error', {
          error: error.message,
          service: 'service-discovery'
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Register the service with the service registry
   */
  async register(): Promise<boolean> {
    try {
      const serviceInfo: ServiceInfo = {
        name: this.config.serviceName,
        version: this.config.serviceVersion,
        url: this.config.serviceUrl,
        healthCheck: `${this.config.serviceUrl}${this.config.healthCheckPath}`,
        status: 'healthy',
        lastHeartbeat: new Date(),
        metadata: {
          port: config.server.port,
          environment: config.server.environment,
          capabilities: ['payments', 'subscriptions', 'webhooks'],
          providers: ['stripe', 'paypal', 'mercadopago', 'crypto'],
          endpoints: [
            '/api/v1/payments',
            '/api/v1/subscriptions',
            '/api/v1/webhooks'
          ]
        }
      };

      const response = await this.registryClient.post('/api/services/register', serviceInfo);
      
      if (response.status === 200 || response.status === 201) {
        this.isRegistered = true;
        logger.info('Service registered successfully', {
          service: this.config.serviceName,
          url: this.config.serviceUrl,
          registry: this.config.registryUrl
        });

        // Start heartbeat
        this.startHeartbeat();
        
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Failed to register service', {
        error: error.message,
        service: this.config.serviceName,
        registry: this.config.registryUrl
      });

      return false;
    }
  }

  /**
   * Deregister the service from the service registry
   */
  async deregister(): Promise<boolean> {
    try {
      if (!this.isRegistered) {
        return true;
      }

      // Stop heartbeat
      this.stopHeartbeat();

      const response = await this.registryClient.delete(
        `/api/services/${this.config.serviceName}`
      );

      if (response.status === 200 || response.status === 204) {
        this.isRegistered = false;
        logger.info('Service deregistered successfully', {
          service: this.config.serviceName
        });
        return true;
      }

      return false;
    } catch (error: any) {
      logger.error('Failed to deregister service', {
        error: error.message,
        service: this.config.serviceName
      });

      return false;
    }
  }

  /**
   * Send heartbeat to service registry
   */
  async sendHeartbeat(): Promise<boolean> {
    try {
      if (!this.isRegistered) {
        return false;
      }

      const heartbeatData = {
        name: this.config.serviceName,
        status: 'healthy',
        lastHeartbeat: new Date(),
        metadata: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage()
        }
      };

      const response = await this.registryClient.post(
        `/api/services/${this.config.serviceName}/heartbeat`,
        heartbeatData
      );

      return response.status === 200;
    } catch (error: any) {
      logger.error('Failed to send heartbeat', {
        error: error.message,
        service: this.config.serviceName
      });

      return false;
    }
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, this.config.heartbeatInterval);

    logger.info('Heartbeat started', {
      service: this.config.serviceName,
      interval: this.config.heartbeatInterval
    });
  }

  /**
   * Stop heartbeat interval
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
      logger.info('Heartbeat stopped', {
        service: this.config.serviceName
      });
    }
  }

  /**
   * Get service information
   */
  getServiceInfo(): ServiceInfo {
    return {
      name: this.config.serviceName,
      version: this.config.serviceVersion,
      url: this.config.serviceUrl,
      healthCheck: `${this.config.serviceUrl}${this.config.healthCheckPath}`,
      status: 'healthy',
      lastHeartbeat: new Date(),
      metadata: {
        port: config.server.port,
        environment: config.server.environment,
        capabilities: ['payments', 'subscriptions', 'webhooks'],
        providers: ['stripe', 'paypal', 'mercadopago', 'crypto']
      }
    };
  }

  /**
   * Check if service is registered
   */
  isServiceRegistered(): boolean {
    return this.isRegistered;
  }

  /**
   * Get service configuration
   */
  getConfig(): ServiceRegistryConfig {
    return this.config;
  }

  /**
   * Health check for service registry
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.registryClient.get('/health', {
        timeout: 3000
      });

      return response.status === 200;
    } catch (error: any) {
      logger.error('Service registry health check failed', {
        error: error.message,
        registry: this.config.registryUrl
      });

      return false;
    }
  }
}

// Export singleton instance
export const serviceDiscoveryService = new ServiceDiscoveryService();

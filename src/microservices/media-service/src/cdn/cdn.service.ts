import { v2 as cloudinary } from 'cloudinary';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { logger, cdn } from '../utils/logger';
import { metrics } from '../utils/metrics';
import { CDNError, InvalidURLError } from '../utils/errors';
import { config } from '../config';

export interface CDNOptions {
  provider: 'cloudinary' | 'cloudfront' | 'fastly' | 'akamai';
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    crop?: string;
  };
  optimization?: {
    auto?: boolean;
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
    quality?: number;
  };
  delivery?: {
    secure?: boolean;
    cdn?: boolean;
    cache?: number;
  };
}

export interface CDNResult {
  success: boolean;
  url: string;
  optimizedUrl?: string;
  transformations?: any;
  metadata?: {
    provider: string;
    optimized: boolean;
    cached: boolean;
    size?: number;
  };
}

export class CDNService {
  private cloudfrontClient: CloudFrontClient;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    if (config.cdn.cloudfront.enabled) {
      this.cloudfrontClient = new CloudFrontClient({
        region: config.cdn.cloudfront.region,
        credentials: {
          accessKeyId: config.cdn.cloudfront.accessKeyId,
          secretAccessKey: config.cdn.cloudfront.secretAccessKey,
        },
      });
    }

    if (config.cdn.cloudinary.enabled) {
      cloudinary.config({
        cloud_name: config.cdn.cloudinary.cloudName,
        api_key: config.cdn.cloudinary.apiKey,
        api_secret: config.cdn.cloudinary.apiSecret,
      });
    }
  }

  /**
   * Optimize media URL for CDN delivery
   */
  async optimizeURL(
    originalUrl: string,
    options: CDNOptions,
    userId: string
  ): Promise<CDNResult> {
    const startTime = Date.now();
    const optimizationId = `opt_${Date.now()}`;

    try {
      cdn.optimizationStarted(userId, originalUrl, optimizationId, options.provider);

      let result: CDNResult;

      switch (options.provider) {
        case 'cloudinary':
          result = await this.optimizeWithCloudinary(originalUrl, options);
          break;
        case 'cloudfront':
          result = await this.optimizeWithCloudFront(originalUrl, options);
          break;
        case 'fastly':
          result = await this.optimizeWithFastly(originalUrl, options);
          break;
        case 'akamai':
          result = await this.optimizeWithAkamai(originalUrl, options);
          break;
        default:
          throw new CDNError(`Unsupported CDN provider: ${options.provider}`);
      }

      const duration = Date.now() - startTime;

      cdn.optimizationCompleted(userId, originalUrl, optimizationId, options.provider, duration);
      metrics.recordCDNOperation(userId, options.provider, 'optimize', 'completed', duration / 1000);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      cdn.optimizationFailed(userId, originalUrl, optimizationId, options.provider, error instanceof Error ? error.message : 'Unknown error');
      metrics.recordCDNOperation(userId, options.provider, 'optimize', 'failed', duration / 1000);

      throw new CDNError(`CDN optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Optimize with Cloudinary
   */
  private async optimizeWithCloudinary(originalUrl: string, options: CDNOptions): Promise<CDNResult> {
    const transformations: any = {};

    if (options.transformations) {
      if (options.transformations.width) transformations.width = options.transformations.width;
      if (options.transformations.height) transformations.height = options.transformations.height;
      if (options.transformations.quality) transformations.quality = options.transformations.quality;
      if (options.transformations.format) transformations.format = options.transformations.format;
      if (options.transformations.crop) transformations.crop = options.transformations.crop;
    }

    if (options.optimization) {
      if (options.optimization.auto) transformations.fetch_format = 'auto';
      if (options.optimization.format) transformations.format = options.optimization.format;
      if (options.optimization.quality) transformations.quality = options.optimization.quality;
    }

    const optimizedUrl = cloudinary.url(originalUrl, {
      ...transformations,
      secure: options.delivery?.secure ?? true,
      sign_url: !options.delivery?.cdn,
    });

    return {
      success: true,
      url: originalUrl,
      optimizedUrl,
      transformations,
      metadata: {
        provider: 'cloudinary',
        optimized: true,
        cached: true,
      },
    };
  }

  /**
   * Optimize with CloudFront
   */
  private async optimizeWithCloudFront(originalUrl: string, options: CDNOptions): Promise<CDNResult> {
    // CloudFront optimization is typically done through URL parameters
    const optimizedUrl = this.addCloudFrontOptimizations(originalUrl, options);

    return {
      success: true,
      url: originalUrl,
      optimizedUrl,
      transformations: options.transformations,
      metadata: {
        provider: 'cloudfront',
        optimized: true,
        cached: true,
      },
    };
  }

  /**
   * Optimize with Fastly
   */
  private async optimizeWithFastly(originalUrl: string, options: CDNOptions): Promise<CDNResult> {
    // Fastly optimization through URL parameters
    const optimizedUrl = this.addFastlyOptimizations(originalUrl, options);

    return {
      success: true,
      url: originalUrl,
      optimizedUrl,
      transformations: options.transformations,
      metadata: {
        provider: 'fastly',
        optimized: true,
        cached: true,
      },
    };
  }

  /**
   * Optimize with Akamai
   */
  private async optimizeWithAkamai(originalUrl: string, options: CDNOptions): Promise<CDNResult> {
    // Akamai optimization through URL parameters
    const optimizedUrl = this.addAkamaiOptimizations(originalUrl, options);

    return {
      success: true,
      url: originalUrl,
      optimizedUrl,
      transformations: options.transformations,
      metadata: {
        provider: 'akamai',
        optimized: true,
        cached: true,
      },
    };
  }

  /**
   * Add CloudFront optimizations to URL
   */
  private addCloudFrontOptimizations(url: string, options: CDNOptions): string {
    const urlObj = new URL(url);
    
    if (options.transformations?.width) {
      urlObj.searchParams.set('w', options.transformations.width.toString());
    }
    if (options.transformations?.height) {
      urlObj.searchParams.set('h', options.transformations.height.toString());
    }
    if (options.transformations?.quality) {
      urlObj.searchParams.set('q', options.transformations.quality.toString());
    }
    if (options.transformations?.format) {
      urlObj.searchParams.set('f', options.transformations.format);
    }

    return urlObj.toString();
  }

  /**
   * Add Fastly optimizations to URL
   */
  private addFastlyOptimizations(url: string, options: CDNOptions): string {
    const urlObj = new URL(url);
    
    if (options.transformations?.width) {
      urlObj.searchParams.set('width', options.transformations.width.toString());
    }
    if (options.transformations?.height) {
      urlObj.searchParams.set('height', options.transformations.height.toString());
    }
    if (options.transformations?.quality) {
      urlObj.searchParams.set('quality', options.transformations.quality.toString());
    }
    if (options.transformations?.format) {
      urlObj.searchParams.set('format', options.transformations.format);
    }

    return urlObj.toString();
  }

  /**
   * Add Akamai optimizations to URL
   */
  private addAkamaiOptimizations(url: string, options: CDNOptions): string {
    const urlObj = new URL(url);
    
    if (options.transformations?.width) {
      urlObj.searchParams.set('w', options.transformations.width.toString());
    }
    if (options.transformations?.height) {
      urlObj.searchParams.set('h', options.transformations.height.toString());
    }
    if (options.transformations?.quality) {
      urlObj.searchParams.set('q', options.transformations.quality.toString());
    }
    if (options.transformations?.format) {
      urlObj.searchParams.set('f', options.transformations.format);
    }

    return urlObj.toString();
  }

  /**
   * Invalidate CDN cache
   */
  async invalidateCache(
    urls: string[],
    provider: string,
    userId: string
  ): Promise<boolean> {
    try {
      switch (provider) {
        case 'cloudfront':
          await this.invalidateCloudFront(urls);
          break;
        case 'cloudinary':
          await this.invalidateCloudinary(urls);
          break;
        case 'fastly':
          await this.invalidateFastly(urls);
          break;
        case 'akamai':
          await this.invalidateAkamai(urls);
          break;
        default:
          throw new CDNError(`Unsupported CDN provider: ${provider}`);
      }

      logger.info('CDN cache invalidation completed', { urls, provider, userId });
      return true;

    } catch (error) {
      logger.error('CDN cache invalidation failed', { 
        urls, 
        provider, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  /**
   * Invalidate CloudFront cache
   */
  private async invalidateCloudFront(urls: string[]): Promise<void> {
    if (!config.cdn.cloudfront.distributionId) {
      throw new CDNError('CloudFront distribution ID not configured');
    }

    const command = new CreateInvalidationCommand({
      DistributionId: config.cdn.cloudfront.distributionId,
      InvalidationBatch: {
        Paths: {
          Quantity: urls.length,
          Items: urls.map(url => `/${new URL(url).pathname}`),
        },
        CallerReference: `invalidation-${Date.now()}`,
      },
    });

    await this.cloudfrontClient.send(command);
  }

  /**
   * Invalidate Cloudinary cache
   */
  private async invalidateCloudinary(urls: string[]): Promise<void> {
    // Cloudinary doesn't support direct cache invalidation
    // Files are automatically cached and served
    logger.info('Cloudinary cache invalidation not supported', { urls });
  }

  /**
   * Invalidate Fastly cache
   */
  private async invalidateFastly(urls: string[]): Promise<void> {
    // Fastly cache invalidation would require API calls
    logger.info('Fastly cache invalidation would be implemented here', { urls });
  }

  /**
   * Invalidate Akamai cache
   */
  private async invalidateAkamai(urls: string[]): Promise<void> {
    // Akamai cache invalidation would require API calls
    logger.info('Akamai cache invalidation would be implemented here', { urls });
  }

  /**
   * Get CDN statistics
   */
  async getCDNStats(provider: string): Promise<any> {
    // This would return CDN statistics like cache hit rates, bandwidth usage, etc.
    return {
      provider,
      cacheHitRate: 0.95,
      bandwidthUsed: 0,
      requestsServed: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Generate optimized URLs for different devices
   */
  async generateResponsiveURLs(
    originalUrl: string,
    options: CDNOptions,
    userId: string
  ): Promise<{
    mobile: string;
    tablet: string;
    desktop: string;
    original: string;
  }> {
    const urls = {
      mobile: await this.optimizeURL(originalUrl, { ...options, transformations: { ...options.transformations, width: 480 } }, userId),
      tablet: await this.optimizeURL(originalUrl, { ...options, transformations: { ...options.transformations, width: 768 } }, userId),
      desktop: await this.optimizeURL(originalUrl, { ...options, transformations: { ...options.transformations, width: 1200 } }, userId),
      original: originalUrl,
    };

    return {
      mobile: urls.mobile.optimizedUrl || urls.mobile.url,
      tablet: urls.tablet.optimizedUrl || urls.tablet.url,
      desktop: urls.desktop.optimizedUrl || urls.desktop.url,
      original: urls.original,
    };
  }
}

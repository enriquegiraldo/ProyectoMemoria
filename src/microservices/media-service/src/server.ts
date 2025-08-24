import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { register } from 'prom-client';
import mediaRoutes from './routes/media.routes';
import { 
  errorHandler, 
  notFoundHandler,
  asyncHandler 
} from './middleware/error.middleware';
import { 
  securityHeaders, 
  corsMiddleware, 
  requestIdMiddleware,
  requestLoggingMiddleware 
} from './middleware/security.middleware';
import { metricsMiddleware } from './utils/metrics';
import { logger } from './utils/logger';
import { config } from './config';

class MediaService {
  private app: express.Application;
  private server: any;
  private io: Server;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: config.cors.allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupWebSockets();
    this.setupGracefulShutdown();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(securityHeaders);
    this.app.use(corsMiddleware);
    this.app.use(requestIdMiddleware);

    // Request parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(requestLoggingMiddleware);

    // Metrics
    this.app.use(metricsMiddleware);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        service: 'media-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: config.app.version,
      });
    });

    // Metrics endpoint for Prometheus
    this.app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        res.status(500).end(error);
      }
    });

    // API routes
    this.app.use('/api/v1/media', mediaRoutes);

    // 404 handler
    this.app.use(notFoundHandler);
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use(errorHandler);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', { promise, reason });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  private setupWebSockets(): void {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Handle processing progress updates
      socket.on('subscribe-processing', (data) => {
        const { userId, fileId } = data;
        socket.join(`processing-${userId}-${fileId}`);
        logger.info('Client subscribed to processing updates', { userId, fileId, socketId: socket.id });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });
    });
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      this.server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  public start(): void {
    const port = config.server.port;
    const host = config.server.host;

    this.server.listen(port, host, () => {
      logger.info(`Media Service started successfully`, {
        host,
        port,
        environment: config.app.environment,
        version: config.app.version,
        nodeVersion: process.version,
        pid: process.pid,
      });

      // Log configuration summary
      logger.info('Configuration summary', {
        upload: {
          maxFileSize: `${config.upload.maxFileSize / 1024 / 1024}MB`,
          maxFiles: config.upload.maxFiles,
          tempDir: config.upload.tempDir,
        },
        processing: {
          enableThumbnails: config.processing.enableThumbnails,
          maxConcurrentJobs: config.processing.maxConcurrentJobs,
        },
        storage: {
          s3: config.storage.s3.enabled,
          azure: config.storage.azure.enabled,
          cloudinary: config.storage.cloudinary.enabled,
        },
        cdn: {
          cloudfront: config.cdn.cloudfront.enabled,
          cloudinary: config.cdn.cloudinary.enabled,
        },
      });
    });
  }

  public getIO(): Server {
    return this.io;
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const mediaService = new MediaService();
  mediaService.start();
}

export default MediaService;

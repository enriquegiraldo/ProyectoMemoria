import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { logger } from './utils';
import { 
  errorMiddleware, 
  notFoundMiddleware, 
  requestIdMiddleware, 
  responseTimeMiddleware 
} from './middleware';
import { 
  notificationRoutes, 
  templateRoutes, 
  subscriptionRoutes, 
  schedulerRoutes, 
  healthRoutes, 
  metricsRoutes 
} from './routes';
import { 
  NotificationService, 
  TemplateService, 
  SubscriptionService, 
  SchedulerService 
} from './services';

class NotificationsServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
      },
    });

    this.initializeServices();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeSocketIO();
    this.initializeErrorHandling();
  }

  /**
   * Initialize all services
   */
  private initializeServices(): void {
    try {
      // Initialize services
      const templateService = new TemplateService();
      const subscriptionService = new SubscriptionService();
      const notificationService = new NotificationService();
      const schedulerService = new SchedulerService(notificationService);

      // Make services available to routes
      this.app.locals.templateService = templateService;
      this.app.locals.subscriptionService = subscriptionService;
      this.app.locals.notificationService = notificationService;
      this.app.locals.schedulerService = schedulerService;

      logger.info('Services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize middleware
   */
  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // Compression middleware
    this.app.use(compression());

    // Request parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom middleware
    this.app.use(requestIdMiddleware);
    this.app.use(responseTimeMiddleware);

    logger.info('Middleware initialized successfully');
  }

  /**
   * Initialize routes
   */
  private initializeRoutes(): void {
    // Health check routes (no authentication required)
    this.app.use('/health', healthRoutes);
    this.app.use('/metrics', metricsRoutes);

    // API routes (authentication required)
    this.app.use('/api/notifications', notificationRoutes);
    this.app.use('/api/templates', templateRoutes);
    this.app.use('/api/subscriptions', subscriptionRoutes);
    this.app.use('/api/scheduler', schedulerRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        service: 'notifications-service',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/health',
          metrics: '/metrics',
          notifications: '/api/notifications',
          templates: '/api/templates',
          subscriptions: '/api/subscriptions',
          scheduler: '/api/scheduler',
        },
      });
    });

    // 404 handler
    this.app.use(notFoundMiddleware);

    logger.info('Routes initialized successfully');
  }

  /**
   * Initialize Socket.IO for real-time notifications
   */
  private initializeSocketIO(): void {
    this.io.on('connection', (socket) => {
      logger.info('Client connected', { socketId: socket.id });

      // Handle user authentication
      socket.on('authenticate', (data) => {
        try {
          // TODO: Validate JWT token
          const { userId } = data;
          socket.data.userId = userId;
          socket.join(`user:${userId}`);
          
          logger.info('User authenticated via Socket.IO', { 
            socketId: socket.id, 
            userId 
          });
        } catch (error) {
          logger.error('Socket.IO authentication failed', { 
            socketId: socket.id, 
            error: error.message 
          });
        }
      });

      // Handle subscription to notification types
      socket.on('subscribe', (data) => {
        try {
          const { userId, types } = data;
          types.forEach((type: string) => {
            socket.join(`notification:${type}:${userId}`);
          });
          
          logger.info('User subscribed to notification types', { 
            socketId: socket.id, 
            userId, 
            types 
          });
        } catch (error) {
          logger.error('Socket.IO subscription failed', { 
            socketId: socket.id, 
            error: error.message 
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info('Client disconnected', { socketId: socket.id });
      });
    });

    logger.info('Socket.IO initialized successfully');
  }

  /**
   * Initialize error handling
   */
  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(errorMiddleware);

    logger.info('Error handling initialized successfully');
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      await new Promise<void>((resolve, reject) => {
        this.server.listen(config.server.port, () => {
          logger.info('Notifications service started successfully', {
            port: config.server.port,
            environment: config.server.environment,
            version: process.env.npm_package_version || '1.0.0',
          });
          resolve();
        });

        this.server.on('error', (error: any) => {
          logger.error('Failed to start server', { error: error.message });
          reject(error);
        });
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start notifications service', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);

      try {
        // Close HTTP server
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            logger.info('HTTP server closed');
            resolve();
          });
        });

        // Close Socket.IO server
        this.io.close(() => {
          logger.info('Socket.IO server closed');
        });

        // Cleanup services
        if (this.app.locals.schedulerService) {
          await this.app.locals.schedulerService.cleanup();
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown', { error: error.message });
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });
  }

  /**
   * Get the Express app instance
   */
  public getApp(): express.Application {
    return this.app;
  }

  /**
   * Get the Socket.IO instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new NotificationsServer();
  server.start().catch((error) => {
    logger.error('Failed to start notifications service', { error: error.message });
    process.exit(1);
  });
}

export default NotificationsServer;

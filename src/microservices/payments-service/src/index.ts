import app from './app';
import { initializeDatabase } from './database/connection';
import { logger } from './utils';
import { serviceDiscoveryService } from './services/service-discovery.service';
import config from './config';

const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Register service with service discovery
    await serviceDiscoveryService.register();
    logger.info('Service registered with service discovery');

    // Start the server
    const server = app.listen(config.server.port, () => {
      logger.info(`Payments Service started successfully`, {
        port: config.server.port,
        environment: config.server.environment,
        timestamp: new Date().toISOString(),
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Deregister service from service discovery
          await serviceDiscoveryService.deregister();
          logger.info('Service deregistered from service discovery');
          
          // Close database connections
          await initializeDatabase();
          logger.info('Database connections closed');
          
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start Payments Service:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

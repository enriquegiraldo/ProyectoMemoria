// src/microservices/analytics-service/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createConnection } from 'typeorm';
import logger  from '../../../../src/utils/logger';
import config from './config';
import { Event } from './models/Event';
import { Metric, KPI } from './models/Analytics';
import { AnalyticsController } from './controllers/analytics.controller';
import { errorHandler } from '';
//import { requestLogger } from './middleware/logger.middleware';
import { requestLogger } from '@/microservices/auth-service/utils/logger';

const app = express();
const analyticsController = new AnalyticsController();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors(config.server.cors));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'analytics-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', (req, res) => {
  res.json({
    service: 'analytics-service',
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  });
});

// API Routes
app.use('/api/analytics', (req, res, next) => {
  // Analytics API routes
  if (req.method === 'POST' && req.path === '/events') {
    return analyticsController.trackEvent(req, res);
  }
  
  if (req.method === 'POST' && req.path === '/events/batch') {
    return analyticsController.trackEventsBatch(req, res);
  }
  
  if (req.method === 'GET' && req.path.startsWith('/events/type/')) {
    return analyticsController.getEventsByType(req, res);
  }
  
  if (req.method === 'GET' && req.path.startsWith('/events/user/')) {
    return analyticsController.getEventsByUser(req, res);
  }
  
  if (req.method === 'GET' && req.path === '/events/stats') {
    return analyticsController.getEventStats(req, res);
  }
  
  if (req.method === 'GET' && req.path.startsWith('/metrics/')) {
    if (req.path.includes('/aggregated')) {
      return analyticsController.getAggregatedMetrics(req, res);
    }
    return analyticsController.getMetrics(req, res);
  }
  
  if (req.method === 'GET' && req.path === '/dashboard') {
    return analyticsController.getDashboard(req, res);
  }
  
  if (req.method === 'POST' && req.path === '/process') {
    return analyticsController.processEvents(req, res);
  }
  
  if (req.method === 'POST' && req.path === '/kpis/generate') {
    return analyticsController.generateKPIs(req, res);
  }
  
  next();
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection
const initializeDatabase = async () => {
  try {
    await createConnection({
      type: 'postgres',
      url: config.database.url,
      ssl: config.database.ssl,
      entities: [Event, Metric, KPI],
      synchronize: config.server.environment === 'development',
      logging: config.server.environment === 'development',
      extra: {
        max: config.database.maxConnections,
        idleTimeoutMillis: config.database.idleTimeoutMillis
      }
    });
    
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
};

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start Express server
    const server = app.listen(config.server.port, () => {
      logger.info(`Analytics Service started successfully`, {
        port: config.server.port,
        environment: config.server.environment,
        timestamp: new Date().toISOString()
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          // Close database connections
          const connection = await createConnection();
          await connection.close();
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
    logger.error('Failed to start Analytics Service:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

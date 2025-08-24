import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config';
import { logger } from './utils/logger';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';

// Import routes
import memoriesRoutes from './routes/memories.routes';
import healthRoutes from './routes/health.routes';
import metricsRoutes from './routes/metrics.routes';

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: config.cors.origins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Add request ID
  req.headers['x-request-id'] = req.headers['x-request-id'] || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'],
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      requestId: req.headers['x-request-id'],
    });
  });

  next();
});

// API routes
app.use('/api/v1/memories', memoriesRoutes);
app.use('/health', healthRoutes);
app.use('/metrics', metricsRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Memories Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    documentation: '/api/v1/docs',
    health: '/health',
    metrics: '/metrics',
  });
});

// API documentation endpoint
app.get('/api/v1/docs', (req, res) => {
  res.json({
    service: 'Memories Service API',
    version: '1.0.0',
    endpoints: {
      memories: {
        base: '/api/v1/memories',
        operations: {
          'POST /': 'Create a new memory',
          'GET /:id': 'Get memory by ID',
          'PUT /:id': 'Update memory',
          'DELETE /:id': 'Delete memory',
          'GET /search': 'Search memories',
          'GET /user/memories': 'Get user memories',
        },
      },
      health: {
        base: '/health',
        operations: {
          'GET /': 'Basic health check',
          'GET /detailed': 'Detailed health check',
          'GET /ready': 'Readiness probe',
          'GET /live': 'Liveness probe',
        },
      },
      metrics: {
        base: '/metrics',
        operations: {
          'GET /': 'Service metrics',
          'GET /prometheus': 'Prometheus metrics',
          'GET /health': 'Metrics health check',
        },
      },
    },
  });
});

// 404 handler
app.use(notFoundMiddleware);

// Error handling middleware
app.use(errorMiddleware);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason,
  });
  process.exit(1);
});

// Uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Start server
const PORT = config.port;
const HOST = config.host;

app.listen(PORT, HOST, () => {
  logger.info('Memories Service started', {
    port: PORT,
    host: HOST,
    environment: config.nodeEnv,
    version: '1.0.0',
  });

  // Log configuration summary
  logger.info('Configuration loaded', {
    database: 'Supabase',
    cors: config.cors.origins,
    rateLimit: {
      windowMs: config.rateLimit.windowMs,
      maxRequests: config.rateLimit.maxRequests,
    },
    upload: {
      maxFileSize: config.upload.maxFileSize,
      storageProvider: config.upload.storageProvider,
    },
  });
});

export default app;

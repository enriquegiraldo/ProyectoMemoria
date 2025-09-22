import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import { register } from 'prom-client';
import { paymentRoutes, subscriptionRoutes } from './routes';
import { initializeDatabase } from './database/connection';
import { logger, metrics } from './utils';
import config from './config';

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
  origin: config.server.cors.origin,
  credentials: config.server.cors.credentials,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    // Record metrics
    metrics.httpRequestDuration.observe({ method: req.method, endpoint: req.path }, duration / 1000);
  });

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'payments-service',
    version: process.env["npm_package_version"] || '1.0.0',
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// API routes
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

// Webhook routes (no authentication required)
app.post('/webhooks/stripe', (req, res) => {
  // TODO: Implement Stripe webhook handler
  res.status(200).json({ received: true });
});

app.post('/webhooks/paypal', (req, res) => {
  // TODO: Implement PayPal webhook handler
  res.status(200).json({ received: true });
});

app.post('/webhooks/mercadopago', (req, res) => {
  // TODO: Implement MercadoPago webhook handler
  res.status(200).json({ received: true });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);

  // Record error metrics
  metrics.httpErrors.inc({ 
    method: req.method, 
    endpoint: req.path, 
    status: res.statusCode || 500 
  });

  // Don't leak error details in production
  const isDevelopment = config.server.environment === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    error: error.name || 'Internal Server Error',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Close database connections
  try {
    await initializeDatabase();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Close database connections
  try {
    await initializeDatabase();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
  
  process.exit(0);
});

export default app;

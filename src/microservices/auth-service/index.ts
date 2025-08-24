import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { ssoRouter } from './routes/sso.routes';
import { twoFactorRouter } from './routes/2fa.routes';
import { auditRouter } from './routes/audit.routes';
import { healthRouter } from './routes/health.routes';
import { metricsRouter } from './routes/metrics.routes';
import { errorHandler } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { logger } from './utils/logger';
import { config } from './config';

const app = express();
const PORT = process.env.PORT || 3001;

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
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });
  next();
});

// Health check endpoint (no auth required)
app.use('/health', healthRouter);

// Metrics endpoint (no auth required)
app.use('/metrics', metricsRouter);

// API routes with authentication
app.use('/api/auth', authRouter);
app.use('/api/users', authMiddleware, userRouter);
app.use('/api/sso', ssoRouter);
app.use('/api/2fa', authMiddleware, twoFactorRouter);
app.use('/api/audit', authMiddleware, auditRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Auth Service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      auth: '/api/auth',
      users: '/api/users',
      sso: '/api/sso',
      '2fa': '/api/2fa',
      audit: '/api/audit',
    },
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`Auth Service started on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default app;

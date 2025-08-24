import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import config from './config';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests' }
});
app.use(limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Memoria Eterna API Gateway',
    version: '1.0.0',
    services: Object.keys(config.services)
  });
});

// Service proxies
app.use('/api/auth', createProxyMiddleware({
  target: config.services.auth.url,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' }
}));

app.use('/api/memories', createProxyMiddleware({
  target: config.services.memories.url,
  changeOrigin: true,
  pathRewrite: { '^/api/memories': '/api/memories' }
}));

app.use('/api/media', createProxyMiddleware({
  target: config.services.media.url,
  changeOrigin: true,
  pathRewrite: { '^/api/media': '/api/media' }
}));

app.use('/api/notifications', createProxyMiddleware({
  target: config.services.notifications.url,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/api/notifications' }
}));

app.use('/api/payments', createProxyMiddleware({
  target: config.services.payments.url,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '/api/payments' }
}));

app.use('/api/analytics', createProxyMiddleware({
  target: config.services.analytics.url,
  changeOrigin: true,
  pathRewrite: { '^/api/analytics': '/api/analytics' }
}));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = config.server.port;
app.listen(port, () => {
  console.log(`🚀 API Gateway started on port ${port}`);
});

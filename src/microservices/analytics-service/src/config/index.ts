import dotenv from 'dotenv';

dotenv.config();

export interface ServerConfig {
  port: number;
  environment: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
}

export interface DatabaseConfig {
  url: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeoutMillis: number;
}

export interface RedisConfig {
  url: string;
  password?: string;
  db: number;
}

export interface ElasticsearchConfig {
  url: string;
  username?: string;
  password?: string;
  index: string;
}

export interface InfluxConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

export interface JWTConfig {
  secret: string;
  expiresIn: string;
}

export interface SecurityConfig {
  encryptionKey: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export interface AnalyticsConfig {
  batchSize: number;
  flushInterval: number;
  retentionDays: number;
  realTimeEnabled: boolean;
}

export interface MLConfig {
  enabled: boolean;
  modelPath: string;
  predictionThreshold: number;
  retrainInterval: number;
}

export interface ReportingConfig {
  schedule: string;
  timezone: string;
  emailRecipients: string[];
  storagePath: string;
}

export interface ServiceConfig {
  authServiceUrl: string;
  paymentsServiceUrl: string;
  notificationsServiceUrl: string;
  userServiceUrl: string;
  memoryServiceUrl: string;
  mediaServiceUrl: string;
}

const config = {
  server: {
    port: parseInt(process.env.PORT || '3007'),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true
    }
  } as ServerConfig,

  database: {
    url: process.env.DATABASE_URL || 'postgresql://analytics:password@localhost:5432/analytics_db',
    ssl: process.env.NODE_ENV === 'production',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000')
  } as DatabaseConfig,

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '1')
  } as RedisConfig,

  elasticsearch: {
    url: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
    index: process.env.ELASTICSEARCH_INDEX || 'analytics-events'
  } as ElasticsearchConfig,

  influx: {
    url: process.env.INFLUX_URL || 'http://localhost:8086',
    token: process.env.INFLUX_TOKEN || '',
    org: process.env.INFLUX_ORG || 'memoria-eterna',
    bucket: process.env.INFLUX_BUCKET || 'analytics'
  } as InfluxConfig,

  jwt: {
    secret: process.env.JWT_SECRET || 'analytics-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  } as JWTConfig,

  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || 'analytics-encryption-key',
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  } as SecurityConfig,

  analytics: {
    batchSize: parseInt(process.env.ANALYTICS_BATCH_SIZE || '1000'),
    flushInterval: parseInt(process.env.ANALYTICS_FLUSH_INTERVAL || '5000'), // 5 seconds
    retentionDays: parseInt(process.env.ANALYTICS_RETENTION_DAYS || '365'),
    realTimeEnabled: process.env.ANALYTICS_REALTIME_ENABLED === 'true'
  } as AnalyticsConfig,

  ml: {
    enabled: process.env.ML_ENABLED === 'true',
    modelPath: process.env.ML_MODEL_PATH || './models',
    predictionThreshold: parseFloat(process.env.ML_PREDICTION_THRESHOLD || '0.8'),
    retrainInterval: parseInt(process.env.ML_RETRAIN_INTERVAL || '86400000') // 24 hours
  } as MLConfig,

  reporting: {
    schedule: process.env.REPORTING_SCHEDULE || '0 9 * * *', // Daily at 9 AM
    timezone: process.env.REPORTING_TIMEZONE || 'UTC',
    emailRecipients: process.env.REPORTING_EMAIL_RECIPIENTS?.split(',') || [],
    storagePath: process.env.REPORTING_STORAGE_PATH || './reports'
  } as ReportingConfig,

  services: {
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    paymentsServiceUrl: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3006',
    notificationsServiceUrl: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004',
    userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3003',
    memoryServiceUrl: process.env.MEMORY_SERVICE_URL || 'http://localhost:3002',
    mediaServiceUrl: process.env.MEDIA_SERVICE_URL || 'http://localhost:3005'
  } as ServiceConfig
};

export default config;

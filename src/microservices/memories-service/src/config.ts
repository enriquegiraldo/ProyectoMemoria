import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schema
const configSchema = z.object({
  // Server configuration
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.string().transform(Number).default('3002'),
  host: z.string().default('0.0.0.0'),

  // Supabase configuration
  supabase: z.object({
    url: z.string().url(),
    serviceRoleKey: z.string().min(1),
    anonKey: z.string().min(1),
  }),

  // JWT configuration
  jwt: z.object({
    secret: z.string().min(32),
    expiresIn: z.string().default('24h'),
    refreshExpiresIn: z.string().default('7d'),
  }),

  // Security configuration
  security: z.object({
    encryptionKey: z.string().length(32),
    sessionSecret: z.string().min(32),
    bcryptRounds: z.number().default(12),
  }),

  // Rate limiting
  rateLimit: z.object({
    windowMs: z.string().transform(Number).default('900000'), // 15 minutes
    maxRequests: z.string().transform(Number).default('100'),
  }),

  // CORS configuration
  cors: z.object({
    origins: z.string().transform(val => val.split(',')).default('http://localhost:3000'),
  }),

  // File upload configuration
  upload: z.object({
    maxFileSize: z.string().transform(Number).default('10485760'), // 10MB
    allowedMimeTypes: z.string().transform(val => val.split(',')).default('image/*,video/*,audio/*,application/pdf'),
    tempDir: z.string().default('/tmp'),
    storageProvider: z.enum(['local', 's3', 'cloudinary']).default('local'),
  }),

  // AWS S3 configuration (optional)
  s3: z.object({
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    region: z.string().default('us-east-1'),
    bucket: z.string().optional(),
  }).optional(),

  // Cloudinary configuration (optional)
  cloudinary: z.object({
    cloudName: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
  }).optional(),

  // Redis configuration
  redis: z.object({
    url: z.string().url().optional(),
    host: z.string().default('localhost'),
    port: z.string().transform(Number).default('6379'),
    password: z.string().optional(),
    db: z.string().transform(Number).default('0'),
  }),

  // Database configuration
  database: z.object({
    url: z.string().url().optional(),
  }),

  // Monitoring configuration
  monitoring: z.object({
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    metricsPort: z.string().transform(Number).default('9090'),
    enableMetrics: z.string().transform(val => val === 'true').default('true'),
  }),

  // Media processing configuration
  media: z.object({
    imageQuality: z.string().transform(Number).default('80'),
    maxImageWidth: z.string().transform(Number).default('1920'),
    maxImageHeight: z.string().transform(Number).default('1080'),
    videoCodec: z.string().default('h264'),
    audioCodec: z.string().default('aac'),
    enableThumbnails: z.string().transform(val => val === 'true').default('true'),
  }),

  // Cache configuration
  cache: z.object({
    ttl: z.string().transform(Number).default('3600'), // 1 hour
    maxSize: z.string().transform(Number).default('1000'),
  }),

  // External services
  services: z.object({
    authServiceUrl: z.string().url().default('http://localhost:3001'),
    mediaServiceUrl: z.string().url().default('http://localhost:3003'),
    notificationServiceUrl: z.string().url().default('http://localhost:3004'),
  }),
});

// Create configuration object
const config = configSchema.parse({
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  host: process.env.HOST,
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY,
    sessionSecret: process.env.SESSION_SECRET,
    bcryptRounds: process.env.BCRYPT_ROUNDS,
  },
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS,
    maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  },
  cors: {
    origins: process.env.CORS_ORIGINS,
  },
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE,
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES,
    tempDir: process.env.TEMP_DIR,
    storageProvider: process.env.STORAGE_PROVIDER,
  },
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  monitoring: {
    logLevel: process.env.LOG_LEVEL,
    metricsPort: process.env.METRICS_PORT,
    enableMetrics: process.env.ENABLE_METRICS,
  },
  media: {
    imageQuality: process.env.IMAGE_QUALITY,
    maxImageWidth: process.env.MAX_IMAGE_WIDTH,
    maxImageHeight: process.env.MAX_IMAGE_HEIGHT,
    videoCodec: process.env.VIDEO_CODEC,
    audioCodec: process.env.AUDIO_CODEC,
    enableThumbnails: process.env.ENABLE_THUMBNAILS,
  },
  cache: {
    ttl: process.env.CACHE_TTL,
    maxSize: process.env.CACHE_MAX_SIZE,
  },
  services: {
    authServiceUrl: process.env.AUTH_SERVICE_URL,
    mediaServiceUrl: process.env.MEDIA_SERVICE_URL,
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL,
  },
});

export default config;

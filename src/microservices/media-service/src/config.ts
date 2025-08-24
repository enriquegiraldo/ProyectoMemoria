import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  server: z.object({
    port: z.number().default(3003),
    host: z.string().default('0.0.0.0'),
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  }),
  jwt: z.object({
    secret: z.string().min(32),
    expiresIn: z.string().default('24h'),
  }),
  upload: z.object({
    maxFileSize: z.number().default(100 * 1024 * 1024), // 100MB
    maxFiles: z.number().default(10),
    allowedMimeTypes: z.array(z.string()).default(['image/*', 'video/*', 'audio/*', 'application/pdf']),
    tempDir: z.string().default('/tmp'),
    uploadDir: z.string().default('./uploads'),
  }),
  s3: z.object({
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    region: z.string().default('us-east-1'),
    bucket: z.string().optional(),
  }),
  cloudinary: z.object({
    cloudName: z.string().optional(),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
  }),
  redis: z.object({
    url: z.string().optional(),
    host: z.string().default('localhost'),
    port: z.number().default(6379),
  }),
  processing: z.object({
    imageQuality: z.number().default(80),
    maxImageWidth: z.number().default(1920),
    maxImageHeight: z.number().default(1080),
    enableThumbnails: z.boolean().default(true),
  }),
  monitoring: z.object({
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    enableMetrics: z.boolean().default(true),
  }),
});

const config = configSchema.parse({
  server: {
    port: parseInt(process.env.PORT || '3003'),
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_at_least_32_characters_long',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600'),
    maxFiles: parseInt(process.env.MAX_FILES || '10'),
    allowedMimeTypes: process.env.ALLOWED_MIME_TYPES?.split(',') || ['image/*', 'video/*', 'audio/*', 'application/pdf'],
    tempDir: process.env.TEMP_DIR || '/tmp',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET,
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  redis: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  processing: {
    imageQuality: parseInt(process.env.IMAGE_QUALITY || '80'),
    maxImageWidth: parseInt(process.env.MAX_IMAGE_WIDTH || '1920'),
    maxImageHeight: parseInt(process.env.MAX_IMAGE_HEIGHT || '1080'),
    enableThumbnails: process.env.ENABLE_THUMBNAILS !== 'false',
  },
  monitoring: {
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    enableMetrics: process.env.ENABLE_METRICS !== 'false',
  },
});

export { config };
export type Config = typeof config;

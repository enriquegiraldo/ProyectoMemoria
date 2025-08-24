import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const serverSchema = z.object({
  port: z.number().default(3003),
  host: z.string().default('0.0.0.0'),
  environment: z.enum(['development', 'production', 'test']).default('development'),
});

const jwtSchema = z.object({
  secret: z.string().min(32),
  expiresIn: z.string().default('24h'),
});

const redisSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().default(6379),
  password: z.string().optional(),
  db: z.number().default(0),
});

const emailSchema = z.object({
  sendgrid: z.object({
    enabled: z.boolean().default(false),
    apiKey: z.string().optional(),
    fromEmail: z.string().email().optional(),
  }),
  mailgun: z.object({
    enabled: z.boolean().default(false),
    apiKey: z.string().optional(),
    domain: z.string().optional(),
  }),
  ses: z.object({
    enabled: z.boolean().default(false),
    region: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
  }),
});

const pushSchema = z.object({
  webPush: z.object({
    enabled: z.boolean().default(false),
    vapidPublicKey: z.string().optional(),
    vapidPrivateKey: z.string().optional(),
  }),
  firebase: z.object({
    enabled: z.boolean().default(false),
    projectId: z.string().optional(),
    privateKey: z.string().optional(),
    clientEmail: z.string().optional(),
  }),
});

const smsSchema = z.object({
  twilio: z.object({
    enabled: z.boolean().default(false),
    accountSid: z.string().optional(),
    authToken: z.string().optional(),
    fromNumber: z.string().optional(),
  }),
  sns: z.object({
    enabled: z.boolean().default(false),
    region: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
  }),
});

const configSchema = z.object({
  app: z.object({
    name: z.string().default('notifications-service'),
    version: z.string().default('1.0.0'),
    environment: serverSchema.shape.environment,
  }),
  server: serverSchema,
  jwt: jwtSchema,
  redis: redisSchema,
  email: emailSchema,
  push: pushSchema,
  sms: smsSchema,
  cors: z.object({
    allowedOrigins: z.array(z.string()).default(['http://localhost:3000']),
  }),
});

const config = configSchema.parse({
  app: {
    name: process.env.APP_NAME || 'notifications-service',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  server: {
    port: parseInt(process.env.PORT || '3003'),
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-min-32-chars-long',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  email: {
    sendgrid: {
      enabled: process.env.SENDGRID_ENABLED === 'true',
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
    },
    mailgun: {
      enabled: process.env.MAILGUN_ENABLED === 'true',
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
    },
    ses: {
      enabled: process.env.SES_ENABLED === 'true',
      region: process.env.SES_REGION,
      accessKeyId: process.env.SES_ACCESS_KEY_ID,
      secretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
    },
  },
  push: {
    webPush: {
      enabled: process.env.WEB_PUSH_ENABLED === 'true',
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
    },
    firebase: {
      enabled: process.env.FIREBASE_ENABLED === 'true',
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    },
  },
  sms: {
    twilio: {
      enabled: process.env.TWILIO_ENABLED === 'true',
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    },
    sns: {
      enabled: process.env.SNS_ENABLED === 'true',
      region: process.env.SNS_REGION,
      accessKeyId: process.env.SNS_ACCESS_KEY_ID,
      secretAccessKey: process.env.SNS_SECRET_ACCESS_KEY,
    },
  },
  cors: {
    allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
});

export default config;

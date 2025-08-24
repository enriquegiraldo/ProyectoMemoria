import { z } from 'zod';

// Environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Supabase Configuration
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Security Configuration
  ENCRYPTION_KEY: z.string().length(32),
  SESSION_SECRET: z.string().min(32),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // CORS Configuration
  CORS_ORIGINS: z.string().default('http://localhost:3000,https://memoriaeterna.com'),
  
  // 2FA Configuration
  TOTP_SECRET: z.string().min(32),
  SMS_PROVIDER_API_KEY: z.string().optional(),
  SMS_PROVIDER_SECRET: z.string().optional(),
  
  // Email Configuration
  SENDGRID_API_KEY: z.string().optional(),
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  
  // SSO Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
  
  // SAML Configuration
  SAML_ENTRY_POINT: z.string().optional(),
  SAML_ISSUER: z.string().optional(),
  SAML_CERT: z.string().optional(),
  
  // Database Configuration
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  
  // Monitoring Configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  METRICS_PORT: z.string().transform(Number).default('9090'),
  
  // Multi-tenancy
  MULTI_TENANT_ENABLED: z.string().transform(val => val === 'true').default('false'),
  TENANT_ISOLATION_MODE: z.enum(['database', 'schema', 'row']).default('database'),
  
  // Compliance
  GDPR_DATA_RETENTION_DAYS: z.string().transform(Number).default('2555'),
  GDPR_CONSENT_REQUIRED: z.string().transform(val => val === 'true').default('true'),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Configuration object
export const config = {
  // Server Configuration
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  
  // Supabase Configuration
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: env.SUPABASE_ANON_KEY,
  },
  
  // JWT Configuration
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  // Security Configuration
  security: {
    encryptionKey: env.ENCRYPTION_KEY,
    sessionSecret: env.SESSION_SECRET,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  // CORS Configuration
  corsOrigins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  
  // 2FA Configuration
  twoFactor: {
    totpSecret: env.TOTP_SECRET,
    sms: {
      apiKey: env.SMS_PROVIDER_API_KEY,
      secret: env.SMS_PROVIDER_SECRET,
    },
  },
  
  // Email Configuration
  email: {
    sendgrid: {
      apiKey: env.SENDGRID_API_KEY,
    },
    mailgun: {
      apiKey: env.MAILGUN_API_KEY,
      domain: env.MAILGUN_DOMAIN,
    },
  },
  
  // SSO Configuration
  sso: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      appId: env.FACEBOOK_APP_ID,
      appSecret: env.FACEBOOK_APP_SECRET,
    },
    linkedin: {
      clientId: env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
    },
    saml: {
      entryPoint: env.SAML_ENTRY_POINT,
      issuer: env.SAML_ISSUER,
      cert: env.SAML_CERT,
    },
  },
  
  // Database Configuration
  database: {
    url: env.DATABASE_URL,
  },
  
  // Redis Configuration
  redis: {
    url: env.REDIS_URL,
  },
  
  // Monitoring Configuration
  monitoring: {
    logLevel: env.LOG_LEVEL,
    metricsPort: env.METRICS_PORT,
  },
  
  // Multi-tenancy Configuration
  multiTenancy: {
    enabled: env.MULTI_TENANT_ENABLED,
    isolationMode: env.TENANT_ISOLATION_MODE,
  },
  
  // Compliance Configuration
  compliance: {
    gdpr: {
      dataRetentionDays: env.GDPR_DATA_RETENTION_DAYS,
      consentRequired: env.GDPR_CONSENT_REQUIRED,
    },
  },
  
  // Feature Flags
  features: {
    sso: {
      google: !!env.GOOGLE_CLIENT_ID,
      facebook: !!env.FACEBOOK_APP_ID,
      linkedin: !!env.LINKEDIN_CLIENT_ID,
      saml: !!env.SAML_ENTRY_POINT,
    },
    twoFactor: {
      totp: true,
      sms: !!env.SMS_PROVIDER_API_KEY,
      email: !!(env.SENDGRID_API_KEY || env.MAILGUN_API_KEY),
    },
    email: {
      sendgrid: !!env.SENDGRID_API_KEY,
      mailgun: !!env.MAILGUN_API_KEY,
    },
  },
} as const;

// Type for the config object
export type Config = typeof config;

// Validate configuration on startup
export function validateConfig(): void {
  const requiredFields = [
    'supabase.url',
    'supabase.serviceRoleKey',
    'supabase.anonKey',
    'jwt.secret',
    'security.encryptionKey',
    'security.sessionSecret',
    'twoFactor.totpSecret',
    'database.url',
    'redis.url',
  ];

  for (const field of requiredFields) {
    const value = field.split('.').reduce((obj, key) => obj?.[key], config);
    if (!value) {
      throw new Error(`Missing required configuration: ${field}`);
    }
  }

  // Validate JWT secret length
  if (config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate encryption key length
  if (config.security.encryptionKey.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
  }

  console.log('✅ Configuration validated successfully');
}

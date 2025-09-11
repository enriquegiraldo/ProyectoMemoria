// src/microservices/payments-service/src/config.ts
import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration schemas
const serverSchema = z.object({
  port: z.number().default(3004),
  environment: z.enum(['development', 'staging', 'production']).default('development'),
  cors: z.object({
    origin: z.string().default('*'),
    credentials: z.boolean().default(true),
  }),
});

const jwtSchema = z.object({
  secret: z.string(),
  expiresIn: z.string().default('24h'),
});

const databaseSchema = z.object({
  url: z.string(),
  ssl: z.boolean().default(false),
});

const redisSchema = z.object({
  url: z.string().default('redis://localhost:6379'),
  password: z.string().optional(),
  db: z.number().default(0),
});

const stripeSchema = z.object({
  secretKey: z.string(),
  publishableKey: z.string(),
  webhookSecret: z.string(),
  apiVersion: z.string().default('2023-10-16'),
});

const paypalSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  mode: z.enum(['sandbox', 'live']).default('sandbox'),
  webhookId: z.string().optional(),
});

const mercadopagoSchema = z.object({
  accessToken: z.string(),
  publicKey: z.string(),
  webhookUrl: z.string().optional(),
});

const cryptoSchema = z.object({
  bitcoin: z.object({
    network: z.enum(['mainnet', 'testnet']).default('testnet'),
    rpcUrl: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
  }),
  ethereum: z.object({
    network: z.enum(['mainnet', 'goerli', 'sepolia']).default('goerli'),
    providerUrl: z.string(),
    privateKey: z.string().optional(),
  }),
  usdt: z.object({
    contractAddress: z.string().optional(),
    decimals: z.number().default(6),
  }),
});

const securitySchema = z.object({
  encryptionKey: z.string(),
  webhookSecret: z.string(),
  rateLimit: z.object({
    windowMs: z.number().default(15 * 60 * 1000), // 15 minutes
    max: z.number().default(100), // limit each IP to 100 requests per windowMs
  }),
});

const configSchema = z.object({
  server: serverSchema,
  jwt: jwtSchema,
  database: databaseSchema,
  redis: redisSchema,
  stripe: stripeSchema,
  paypal: paypalSchema,
  mercadopago: mercadopagoSchema,
  crypto: cryptoSchema,
  security: securitySchema,
});

// Parse and validate configuration
const config = configSchema.parse({
  server: {
    port: parseInt(process.env["PORT"] || '3004'),
    environment: process.env["NODE_ENV"] || 'development',
    cors: {
      origin: process.env["CORS_ORIGIN"] || '*',
      credentials: process.env["CORS_CREDENTIALS"] === 'true',
    },
  },
  jwt: {
    secret: process.env["JWT_SECRET"] || 'your-jwt-secret',
    expiresIn: process.env["JWT_EXPIRES_IN"] || '24h',
  },
  database: {
    url: process.env["DATABASE_URL"] || 'postgresql://user:password@localhost:5432/payments_db',
    ssl: process.env["DATABASE_SSL"] === 'true',
  },
  redis: {
    url: process.env["REDIS_URL"] || 'redis://localhost:6379',
    password: process.env["REDIS_PASSWORD"],
    db: parseInt(process.env["REDIS_DB"] || '0'),
  },
  stripe: {
    secretKey: process.env["STRIPE_SECRET_KEY"] || 'sk_test_...',
    publishableKey: process.env["STRIPE_PUBLISHABLE_KEY"] || 'pk_test_...',
    webhookSecret: process.env["STRIPE_WEBHOOK_SECRET"] || 'whsec_...',
    apiVersion: process.env["STRIPE_API_VERSION"] || '2023-10-16',
  },
  paypal: {
    clientId: process.env["PAYPAL_CLIENT_ID"] || 'your-paypal-client-id',
    clientSecret: process.env["PAYPAL_CLIENT_SECRET"] || 'your-paypal-client-secret',
    mode: (process.env["PAYPAL_MODE"] as 'sandbox' | 'live') || 'sandbox',
    webhookId: process.env["PAYPAL_WEBHOOK_ID"],
  },
  mercadopago: {
    accessToken: process.env["MERCADOPAGO_ACCESS_TOKEN"] || 'your-mercadopago-access-token',
    publicKey: process.env["MERCADOPAGO_PUBLIC_KEY"] || 'your-mercadopago-public-key',
    webhookUrl: process.env["MERCADOPAGO_WEBHOOK_URL"],
  },
  crypto: {
    bitcoin: {
      network: (process.env["BITCOIN_NETWORK"] as 'mainnet' | 'testnet') || 'testnet',
      rpcUrl: process.env["BITCOIN_RPC_URL"],
      username: process.env["BITCOIN_RPC_USERNAME"],
      password: process.env["BITCOIN_RPC_PASSWORD"],
    },
    ethereum: {
      network: (process.env["ETHEREUM_NETWORK"] as 'mainnet' | 'goerli' | 'sepolia') || 'goerli',
      providerUrl: process.env["WEB3_PROVIDER_URL"] || 'https://goerli.infura.io/v3/your-project-id',
      privateKey: process.env["ETHEREUM_PRIVATE_KEY"],
    },
    usdt: {
      contractAddress: process.env["USDT_CONTRACT_ADDRESS"],
      decimals: parseInt(process.env["USDT_DECIMALS"] || '6'),
    },
  },
  security: {
    encryptionKey: process.env["ENCRYPTION_KEY"] || 'your-encryption-key',
    webhookSecret: process.env["WEBHOOK_SECRET"] || 'your-webhook-secret',
    rateLimit: {
      windowMs: parseInt(process.env["RATE_LIMIT_WINDOW_MS"] || '900000'),
      max: parseInt(process.env["RATE_LIMIT_MAX"] || '100'),
    },
  },
});

export default config;
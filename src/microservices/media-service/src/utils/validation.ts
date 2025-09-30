// src/microservices/media-service/src/utils/validation.ts
import { z } from 'zod';
import { MediaType, ProcessingStatus } from '../types'; // Mantengo el import, pero no lo uso en nativeEnum para evitar errores

// Definiciones de valores para enums (asumiendo que son uniones de strings en ../types)
const mediaTypeValues = ['image', 'video', 'audio', 'document'] as const;
const processingStatusValues = ['pending', 'processing', 'completed', 'failed'] as const; // Ajusta si hay más estados como 'cancelled'

// Base schemas
export const userIdSchema = z.string().uuid({ message: 'Invalid user ID format' });
export const fileIdSchema = z.string().uuid({ message: 'Invalid file ID format' });
export const jobIdSchema = z.string().uuid({ message: 'Invalid job ID format' });

// Pagination schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// File upload schemas
export const uploadRequestSchema = z.object({
  userId: userIdSchema,
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  tags: z.array(z.string()).optional(),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
  allowProcessing: z.boolean().default(true),
});

export const uploadResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    fileId: fileIdSchema,
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
    uploadUrl: z.string().url(),
    expiresAt: z.string().datetime(),
  }),
  message: z.string(),
});

// File processing schemas
export const processingOptionsSchema = z.object({
  resize: z.object({
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    maintainAspectRatio: z.boolean().default(true),
  }).optional(),
  crop: z.object({
    x: z.number().int().min(0),
    y: z.number().int().min(0),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).optional(),
  compress: z.object({
    quality: z.number().int().min(1).max(100).default(80),
    format: z.string().optional(),
  }).optional(),
  convert: z.object({
    format: z.string(),
    quality: z.number().int().min(1).max(100).optional(),
  }).optional(),
  watermark: z.object({
    text: z.string().optional(),
    imageUrl: z.string().url().optional(),
    position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).default('bottom-right'),
    opacity: z.number().min(0).max(1).default(0.5),
  }).optional(),
  filter: z.object({
    brightness: z.number().min(-100).max(100).optional(),
    contrast: z.number().min(-100).max(100).optional(),
    saturation: z.number().min(-100).max(100).optional(),
    blur: z.number().min(0).max(100).optional(),
    sharpen: z.number().min(0).max(100).optional(),
  }).optional(),
  enhance: z.object({
    autoEnhance: z.boolean().default(true),
    removeNoise: z.boolean().default(false),
    faceEnhancement: z.boolean().default(false),
  }).optional(),
});

export const processingRequestSchema = z.object({
  userId: userIdSchema,
  fileId: fileIdSchema,
  operation: z.string().min(1),
  options: processingOptionsSchema.optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  callbackUrl: z.string().url().optional(),
});

export const processingResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    jobId: jobIdSchema,
    status: z.enum(processingStatusValues),
    estimatedDuration: z.number().optional(),
    progress: z.number().min(0).max(100).default(0),
  }),
  message: z.string(),
});

// File management schemas
export const fileQuerySchema = z.object({
  userId: userIdSchema,
  fileType: z.enum(mediaTypeValues).optional(),
  status: z.enum(processingStatusValues).optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});

export const fileUpdateSchema = z.object({
  fileName: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export const fileDeleteSchema = z.object({
  userId: userIdSchema,
  fileId: fileIdSchema,
  permanent: z.boolean().default(false),
});

// Job management schemas
export const jobQuerySchema = z.object({
  userId: userIdSchema,
  fileId: fileIdSchema.optional(),
  status: z.enum(processingStatusValues).optional(),
  operation: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  ...paginationSchema.shape,
});

export const jobCancelSchema = z.object({
  userId: userIdSchema,
  jobId: jobIdSchema,
});

// Storage schemas
export const storageConfigSchema = z.object({
  provider: z.enum(['local', 's3', 'cloudinary', 'azure']),
  bucket: z.string().optional(),
  region: z.string().optional(),
  accessKey: z.string().optional(),
  secretKey: z.string().optional(),
  endpoint: z.string().url().optional(),
  useSSL: z.boolean().default(true),
});

export const cdnConfigSchema = z.object({
  provider: z.enum(['cloudflare', 'aws-cloudfront', 'azure-cdn', 'google-cloud-cdn']),
  domain: z.string().url(),
  apiKey: z.string().optional(),
  zoneId: z.string().optional(),
});

// Batch operations schemas
export const batchUploadSchema = z.object({
  userId: userIdSchema,
  files: z.array(z.object({
    fileName: z.string().min(1).max(255),
    fileSize: z.number().int().positive(),
    mimeType: z.string().min(1),
    tags: z.array(z.string()).optional(),
    description: z.string().max(1000).optional(),
  })).min(1).max(100),
  options: z.object({
    parallelUploads: z.number().int().min(1).max(10).default(3),
    retryAttempts: z.number().int().min(0).max(5).default(3),
    autoProcess: z.boolean().default(false),
  }).optional(),
});

export const batchProcessingSchema = z.object({
  userId: userIdSchema,
  fileIds: z.array(fileIdSchema).min(1).max(50),
  operation: z.string().min(1),
  options: processingOptionsSchema.optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

// Webhook schemas
export const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['upload.completed', 'upload.failed', 'processing.completed', 'processing.failed', 'file.deleted'])),
  secret: z.string().min(32).optional(),
  retryAttempts: z.number().int().min(0).max(5).default(3),
  timeout: z.number().int().min(1000).max(30000).default(5000),
});

// API key schemas
export const apiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum(['upload', 'download', 'process', 'delete', 'admin'])),
  expiresAt: z.string().datetime().optional(),
  rateLimit: z.number().int().positive().optional(),
});

// Search schemas
export const searchSchema = z.object({
  userId: userIdSchema,
  query: z.string().min(1).max(500),
  fileTypes: z.array(z.enum(mediaTypeValues)).optional(),
  tags: z.array(z.string()).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  includeContent: z.boolean().default(false),
  ...paginationSchema.shape,
});

// Analytics schemas
export const analyticsQuerySchema = z.object({
  userId: userIdSchema,
  metric: z.enum(['storage_usage', 'upload_count', 'processing_time', 'bandwidth_usage', 'file_types']),
  period: z.enum(['hour', 'day', 'week', 'month', 'year']).default('day'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  groupBy: z.enum(['file_type', 'status', 'operation']).optional(),
});

// Health check schemas
export const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: z.string().datetime(),
  uptime: z.number(),
  version: z.string(),
  services: z.record(z.object({
    status: z.enum(['healthy', 'unhealthy', 'degraded']),
    responseTime: z.number().optional(),
    error: z.string().optional(),
  })),
});

// Error response schema
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    message: z.string(),
    code: z.string(),
    statusCode: z.number(),
    timestamp: z.string().datetime(),
    path: z.string().optional(),
    details: z.any().optional(),
  }),
});

// Success response schema
export const successResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

// Generic response schema
export const apiResponseSchema = z.union([successResponseSchema, errorResponseSchema]);

// Validation functions
export const validateUploadRequest = (data: unknown) => uploadRequestSchema.parse(data);
export const validateProcessingRequest = (data: unknown) => processingRequestSchema.parse(data);
export const validateFileQuery = (data: unknown) => fileQuerySchema.parse(data);
export const validateFileUpdate = (data: unknown) => fileUpdateSchema.parse(data);
export const validateJobQuery = (data: unknown) => jobQuerySchema.parse(data);
export const validateBatchUpload = (data: unknown) => batchUploadSchema.parse(data);
export const validateBatchProcessing = (data: unknown) => batchProcessingSchema.parse(data);
export const validateSearch = (data: unknown) => searchSchema.parse(data);
export const validateAnalyticsQuery = (data: unknown) => analyticsQuerySchema.parse(data);

// Partial validation for updates
export const validatePartialFileUpdate = (data: unknown) => fileUpdateSchema.partial().parse(data);
export const validatePartialProcessingOptions = (data: unknown) => processingOptionsSchema.partial().parse(data);

// Custom validation functions
export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size > 0 && size <= maxSize;
};

export const validateMimeType = (mimeType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const baseType = type.replace('/*', '');
      return mimeType.startsWith(baseType);
    }
    return mimeType === type;
  });
};

export const validateFileName = (fileName: string): boolean => {
  // Check for dangerous characters and patterns
  const dangerousPatterns = [
    /\.\./, // Path traversal
    /[<>:"|?*]/, // Invalid characters for file systems
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, // Reserved names on Windows
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(fileName));
};

export const validateTags = (tags: string[]): boolean => {
  if (!Array.isArray(tags)) return false;
  
  return tags.every(tag => {
    return typeof tag === 'string' && 
           tag.length > 0 && 
           tag.length <= 50 && 
           /^[a-zA-Z0-9\s\-_]+$/.test(tag);
  });
};

export const validateCallbackUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Export all schemas
export const schemas = {
  userIdSchema,
  fileIdSchema,
  jobIdSchema,
  paginationSchema,
  uploadRequestSchema,
  uploadResponseSchema,
  processingOptionsSchema,
  processingRequestSchema,
  processingResponseSchema,
  fileQuerySchema,
  fileUpdateSchema,
  fileDeleteSchema,
  jobQuerySchema,
  jobCancelSchema,
  storageConfigSchema,
  cdnConfigSchema,
  batchUploadSchema,
  batchProcessingSchema,
  webhookSchema,
  apiKeySchema,
  searchSchema,
  analyticsQuerySchema,
  healthCheckSchema,
  errorResponseSchema,
  successResponseSchema,
  apiResponseSchema,
};

export const providerSchema = z.enum(['stripe', 'paypal', 'mercadopago', 'crypto']);
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ValidationError } from '../utils/errors';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request data
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated data
      req.body = validatedData.body || req.body;
      req.query = validatedData.query || req.query;
      req.params = validatedData.params || req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation failed', {
          errors: error.errors,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });

        res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        logger.error('Validation middleware error', {
          error: error instanceof Error ? error.message : error,
          ip: req.ip,
        });

        res.status(500).json({
          success: false,
          error: {
            message: 'Internal validation error',
            code: 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
          },
        });
      }
    }
  };
};

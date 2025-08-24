import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';
import {
  uuidSchema,
  emailSchema,
  amountSchema,
  currencySchema,
  paymentMethodSchema,
  providerSchema,
} from '../utils/validation';

// Validation schemas for different endpoints
const validationSchemas = {
  createPaymentIntent: {
    body: {
      userId: uuidSchema.optional(),
      customerId: uuidSchema.optional(),
      subscriptionId: uuidSchema.optional(),
      invoiceId: uuidSchema.optional(),
      amount: amountSchema,
      currency: currencySchema.optional(),
      paymentMethod: paymentMethodSchema,
      provider: providerSchema,
      description: 'string'.optional(),
      metadata: 'object'.optional(),
      isTest: 'boolean'.optional(),
    },
  },
  confirmPayment: {
    params: {
      paymentId: uuidSchema,
    },
    body: {
      provider: providerSchema,
      paymentMethodData: 'object',
    },
  },
  getPayment: {
    params: {
      paymentId: uuidSchema,
    },
  },
  getPayments: {
    query: {
      userId: uuidSchema.optional(),
      status: 'string'.optional(),
      provider: providerSchema.optional(),
      paymentMethod: paymentMethodSchema.optional(),
      startDate: 'string'.optional(),
      endDate: 'string'.optional(),
      limit: 'number'.optional(),
      offset: 'number'.optional(),
    },
  },
  refundPayment: {
    params: {
      paymentId: uuidSchema,
    },
    body: {
      amount: amountSchema,
      reason: 'string'.optional(),
    },
  },
  getPaymentAnalytics: {
    query: {
      userId: uuidSchema.optional(),
      startDate: 'string'.optional(),
      endDate: 'string'.optional(),
    },
  },
  createSubscription: {
    body: {
      userId: uuidSchema.optional(),
      customerId: uuidSchema.optional(),
      planId: uuidSchema,
      amount: amountSchema,
      currency: currencySchema.optional(),
      interval: 'string',
      intervalCount: 'number',
      trialDays: 'number'.optional(),
      quantity: 'number'.optional(),
      metadata: 'object'.optional(),
      provider: providerSchema,
      isTest: 'boolean'.optional(),
    },
  },
  getSubscription: {
    params: {
      subscriptionId: uuidSchema,
    },
  },
  getUserSubscription: {
    params: {
      userId: uuidSchema.optional(),
    },
  },
  updateSubscription: {
    params: {
      subscriptionId: uuidSchema,
    },
    body: {
      quantity: 'number',
      amount: amountSchema.optional(),
      metadata: 'object'.optional(),
    },
  },
  cancelSubscription: {
    params: {
      subscriptionId: uuidSchema,
    },
    body: {
      cancelAtPeriodEnd: 'boolean'.optional(),
      reason: 'string'.optional(),
    },
  },
  getSubscriptionAnalytics: {
    query: {
      userId: uuidSchema.optional(),
      startDate: 'string'.optional(),
      endDate: 'string'.optional(),
    },
  },
};

export const validateRequest = (schemaName: keyof typeof validationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const schema = validationSchemas[schemaName];
      if (!schema) {
        throw new ValidationError(`Validation schema '${schemaName}' not found`);
      }

      // Validate params
      if (schema.params) {
        for (const [key, validator] of Object.entries(schema.params)) {
          if (req.params[key] !== undefined) {
            try {
              if (typeof validator === 'string') {
                // Simple type validation
                if (validator === 'string' && typeof req.params[key] !== 'string') {
                  throw new Error(`${key} must be a string`);
                }
                if (validator === 'number' && isNaN(Number(req.params[key]))) {
                  throw new Error(`${key} must be a number`);
                }
                if (validator === 'boolean' && !['true', 'false', '0', '1'].includes(req.params[key])) {
                  throw new Error(`${key} must be a boolean`);
                }
              } else {
                // Zod schema validation
                validator.parse(req.params[key]);
              }
            } catch (error) {
              throw new ValidationError(`Invalid parameter ${key}: ${error.message}`);
            }
          }
        }
      }

      // Validate query
      if (schema.query) {
        for (const [key, validator] of Object.entries(schema.query)) {
          if (req.query[key] !== undefined) {
            try {
              if (typeof validator === 'string') {
                // Simple type validation
                if (validator === 'string' && typeof req.query[key] !== 'string') {
                  throw new Error(`${key} must be a string`);
                }
                if (validator === 'number' && isNaN(Number(req.query[key]))) {
                  throw new Error(`${key} must be a number`);
                }
                if (validator === 'boolean' && !['true', 'false', '0', '1'].includes(req.query[key] as string)) {
                  throw new Error(`${key} must be a boolean`);
                }
              } else {
                // Zod schema validation
                validator.parse(req.query[key]);
              }
            } catch (error) {
              throw new ValidationError(`Invalid query parameter ${key}: ${error.message}`);
            }
          }
        }
      }

      // Validate body
      if (schema.body) {
        for (const [key, validator] of Object.entries(schema.body)) {
          if (req.body[key] !== undefined) {
            try {
              if (typeof validator === 'string') {
                // Simple type validation
                if (validator === 'string' && typeof req.body[key] !== 'string') {
                  throw new Error(`${key} must be a string`);
                }
                if (validator === 'number' && typeof req.body[key] !== 'number') {
                  throw new Error(`${key} must be a number`);
                }
                if (validator === 'boolean' && typeof req.body[key] !== 'boolean') {
                  throw new Error(`${key} must be a boolean`);
                }
                if (validator === 'object' && typeof req.body[key] !== 'object') {
                  throw new Error(`${key} must be an object`);
                }
              } else {
                // Zod schema validation
                validator.parse(req.body[key]);
              }
            } catch (error) {
              throw new ValidationError(`Invalid body parameter ${key}: ${error.message}`);
            }
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

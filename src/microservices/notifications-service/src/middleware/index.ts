// Authentication middleware
export { 
  authMiddleware, 
  apiKeyMiddleware, 
  optionalAuthMiddleware,
  requireRole,
  requirePermission,
  requireOwnership,
  AuthenticatedRequest 
} from './auth.middleware';

// Error handling middleware
export { 
  errorMiddleware, 
  notFoundMiddleware, 
  asyncHandler,
  validateRequest,
  requestIdMiddleware,
  responseTimeMiddleware,
  corsMiddleware,
  securityHeadersMiddleware,
  rateLimitMiddleware,
  securityMiddleware 
} from './error.middleware';

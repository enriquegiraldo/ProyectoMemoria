import jwt from 'jsonwebtoken';
import { config } from '../config';
import { 
  AuthenticationError, 
  TokenError, 
  TokenExpiredError, 
  TokenInvalidError,
  AuthorizationError 
} from './errors';

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

// User permissions
export const PERMISSIONS = {
  // File permissions
  FILE_UPLOAD: 'file:upload',
  FILE_DOWNLOAD: 'file:download',
  FILE_DELETE: 'file:delete',
  FILE_UPDATE: 'file:update',
  FILE_LIST: 'file:list',
  
  // Processing permissions
  PROCESSING_CREATE: 'processing:create',
  PROCESSING_CANCEL: 'processing:cancel',
  PROCESSING_LIST: 'processing:list',
  
  // Storage permissions
  STORAGE_ACCESS: 'storage:access',
  STORAGE_MANAGE: 'storage:manage',
  
  // Admin permissions
  ADMIN_USERS: 'admin:users',
  ADMIN_SYSTEM: 'admin:system',
  ADMIN_ANALYTICS: 'admin:analytics',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// User roles
export const ROLES = {
  USER: 'user',
  PREMIUM: 'premium',
  ADMIN: 'admin',
  SYSTEM: 'system',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.USER]: [
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,
    PERMISSIONS.FILE_UPDATE,
    PERMISSIONS.FILE_LIST,
    PERMISSIONS.PROCESSING_CREATE,
    PERMISSIONS.PROCESSING_CANCEL,
    PERMISSIONS.PROCESSING_LIST,
  ],
  [ROLES.PREMIUM]: [
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,
    PERMISSIONS.FILE_UPDATE,
    PERMISSIONS.FILE_LIST,
    PERMISSIONS.PROCESSING_CREATE,
    PERMISSIONS.PROCESSING_CANCEL,
    PERMISSIONS.PROCESSING_LIST,
    PERMISSIONS.STORAGE_ACCESS,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,
    PERMISSIONS.FILE_UPDATE,
    PERMISSIONS.FILE_LIST,
    PERMISSIONS.PROCESSING_CREATE,
    PERMISSIONS.PROCESSING_CANCEL,
    PERMISSIONS.PROCESSING_LIST,
    PERMISSIONS.STORAGE_ACCESS,
    PERMISSIONS.STORAGE_MANAGE,
    PERMISSIONS.ADMIN_USERS,
    PERMISSIONS.ADMIN_SYSTEM,
    PERMISSIONS.ADMIN_ANALYTICS,
  ],
  [ROLES.SYSTEM]: [
    PERMISSIONS.FILE_UPLOAD,
    PERMISSIONS.FILE_DOWNLOAD,
    PERMISSIONS.FILE_DELETE,
    PERMISSIONS.FILE_UPDATE,
    PERMISSIONS.FILE_LIST,
    PERMISSIONS.PROCESSING_CREATE,
    PERMISSIONS.PROCESSING_CANCEL,
    PERMISSIONS.PROCESSING_LIST,
    PERMISSIONS.STORAGE_ACCESS,
    PERMISSIONS.STORAGE_MANAGE,
    PERMISSIONS.ADMIN_USERS,
    PERMISSIONS.ADMIN_SYSTEM,
    PERMISSIONS.ADMIN_ANALYTICS,
  ],
};

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: 'media-service',
      audience: 'memoria-eterna',
    });
  } catch (error) {
    throw new TokenError('Failed to generate token');
  }
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: 'media-service',
      audience: 'memoria-eterna',
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenExpiredError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenInvalidError('Invalid token format');
    }
    throw new TokenError('Token verification failed');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string {
  if (!authHeader) {
    throw new AuthenticationError('Authorization header is required');
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new TokenInvalidError('Invalid authorization header format');
  }
  
  return parts[1];
}

/**
 * Check if user has permission
 */
export function hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}

/**
 * Check if user can access resource
 */
export function canAccessResource(userId: string, resourceUserId: string, userRole: Role): boolean {
  // Users can always access their own resources
  if (userId === resourceUserId) {
    return true;
  }
  
  // Admins and system users can access any resource
  if (userRole === ROLES.ADMIN || userRole === ROLES.SYSTEM) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can modify resource
 */
export function canModifyResource(userId: string, resourceUserId: string, userRole: Role): boolean {
  // Users can always modify their own resources
  if (userId === resourceUserId) {
    return true;
  }
  
  // Only admins and system users can modify other users' resources
  if (userRole === ROLES.ADMIN || userRole === ROLES.SYSTEM) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can delete resource
 */
export function canDeleteResource(userId: string, resourceUserId: string, userRole: Role): boolean {
  // Users can always delete their own resources
  if (userId === resourceUserId) {
    return true;
  }
  
  // Only admins and system users can delete other users' resources
  if (userRole === ROLES.ADMIN || userRole === ROLES.SYSTEM) {
    return true;
  }
  
  return false;
}

/**
 * Validate API key
 */
export function validateApiKey(apiKey: string): boolean {
  // Basic validation - in production, this would check against a database
  if (!apiKey || apiKey.length < 32) {
    return false;
  }
  
  // Check if it's a valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(apiKey);
}

/**
 * Get user permissions from role
 */
export function getPermissionsFromRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role has permission
 */
export function roleHasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = getPermissionsFromRole(role);
  return rolePermissions.includes(permission);
}

/**
 * Validate user access to file
 */
export function validateFileAccess(
  userId: string, 
  fileUserId: string, 
  isPublic: boolean, 
  userRole: Role,
  userPermissions: Permission[]
): boolean {
  // Public files can be accessed by anyone
  if (isPublic) {
    return true;
  }
  
  // Users can always access their own files
  if (userId === fileUserId) {
    return true;
  }
  
  // Admins and system users can access any file
  if (userRole === ROLES.ADMIN || userRole === ROLES.SYSTEM) {
    return true;
  }
  
  // Check if user has storage access permission
  if (hasPermission(userPermissions, PERMISSIONS.STORAGE_ACCESS)) {
    return true;
  }
  
  return false;
}

/**
 * Validate user can upload file
 */
export function validateUploadPermission(
  userId: string,
  userRole: Role,
  userPermissions: Permission[],
  fileSize: number,
  maxFileSize: number
): void {
  // Check upload permission
  if (!hasPermission(userPermissions, PERMISSIONS.FILE_UPLOAD)) {
    throw new AuthorizationError('Upload permission required');
  }
  
  // Check file size limits based on role
  const roleLimits = {
    [ROLES.USER]: 50 * 1024 * 1024, // 50MB
    [ROLES.PREMIUM]: 200 * 1024 * 1024, // 200MB
    [ROLES.ADMIN]: 1024 * 1024 * 1024, // 1GB
    [ROLES.SYSTEM]: 1024 * 1024 * 1024, // 1GB
  };
  
  const roleLimit = roleLimits[userRole] || roleLimits[ROLES.USER];
  const effectiveLimit = Math.min(roleLimit, maxFileSize);
  
  if (fileSize > effectiveLimit) {
    throw new AuthorizationError(`File size exceeds limit for role ${userRole}`);
  }
}

/**
 * Validate user can process file
 */
export function validateProcessingPermission(
  userId: string,
  fileUserId: string,
  userRole: Role,
  userPermissions: Permission[]
): void {
  // Check processing permission
  if (!hasPermission(userPermissions, PERMISSIONS.PROCESSING_CREATE)) {
    throw new AuthorizationError('Processing permission required');
  }
  
  // Users can only process their own files (unless admin/system)
  if (userId !== fileUserId && userRole !== ROLES.ADMIN && userRole !== ROLES.SYSTEM) {
    throw new AuthorizationError('Can only process own files');
  }
}

/**
 * Create authentication context
 */
export function createAuthContext(token: string): {
  userId: string;
  email: string;
  role: Role;
  permissions: Permission[];
  payload: JWTPayload;
} {
  const payload = verifyToken(token);
  
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role as Role,
    permissions: payload.permissions as Permission[],
    payload,
  };
}

/**
 * Validate authentication context
 */
export function validateAuthContext(authContext: ReturnType<typeof createAuthContext>): void {
  if (!authContext.userId || !authContext.email || !authContext.role) {
    throw new AuthenticationError('Invalid authentication context');
  }
  
  if (!Object.values(ROLES).includes(authContext.role)) {
    throw new AuthenticationError('Invalid user role');
  }
  
  if (!Array.isArray(authContext.permissions)) {
    throw new AuthenticationError('Invalid permissions format');
  }
}

/**
 * Get user storage quota based on role
 */
export function getUserStorageQuota(role: Role): number {
  const quotas = {
    [ROLES.USER]: 5 * 1024 * 1024 * 1024, // 5GB
    [ROLES.PREMIUM]: 50 * 1024 * 1024 * 1024, // 50GB
    [ROLES.ADMIN]: 1024 * 1024 * 1024 * 1024, // 1TB
    [ROLES.SYSTEM]: 1024 * 1024 * 1024 * 1024, // 1TB
  };
  
  return quotas[role] || quotas[ROLES.USER];
}

/**
 * Check if user has exceeded storage quota
 */
export function hasExceededStorageQuota(
  role: Role,
  currentUsage: number,
  additionalSize: number = 0
): boolean {
  const quota = getUserStorageQuota(role);
  return (currentUsage + additionalSize) > quota;
}

/**
 * Get rate limits based on role
 */
export function getRateLimits(role: Role): {
  uploadsPerHour: number;
  uploadsPerDay: number;
  processingPerHour: number;
  processingPerDay: number;
} {
  const limits = {
    [ROLES.USER]: {
      uploadsPerHour: 10,
      uploadsPerDay: 100,
      processingPerHour: 20,
      processingPerDay: 200,
    },
    [ROLES.PREMIUM]: {
      uploadsPerHour: 50,
      uploadsPerDay: 500,
      processingPerHour: 100,
      processingPerDay: 1000,
    },
    [ROLES.ADMIN]: {
      uploadsPerHour: 1000,
      uploadsPerDay: 10000,
      processingPerHour: 2000,
      processingPerDay: 20000,
    },
    [ROLES.SYSTEM]: {
      uploadsPerHour: 10000,
      uploadsPerDay: 100000,
      processingPerHour: 20000,
      processingPerDay: 200000,
    },
  };
  
  return limits[role] || limits[ROLES.USER];
}

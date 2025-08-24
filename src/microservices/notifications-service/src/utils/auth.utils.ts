import jwt from 'jsonwebtoken';
import { config } from '../config';

// User roles
export enum UserRole {
  USER = 'user',
  PREMIUM = 'premium',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

// Permissions
export enum Permission {
  // Notification permissions
  NOTIFICATION_SEND = 'notification:send',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_UPDATE = 'notification:update',
  NOTIFICATION_DELETE = 'notification:delete',
  
  // Subscription permissions
  SUBSCRIPTION_CREATE = 'subscription:create',
  SUBSCRIPTION_READ = 'subscription:read',
  SUBSCRIPTION_UPDATE = 'subscription:update',
  SUBSCRIPTION_DELETE = 'subscription:delete',
  
  // Template permissions
  TEMPLATE_CREATE = 'template:create',
  TEMPLATE_READ = 'template:read',
  TEMPLATE_UPDATE = 'template:update',
  TEMPLATE_DELETE = 'template:delete',
  
  // Schedule permissions
  SCHEDULE_CREATE = 'schedule:create',
  SCHEDULE_READ = 'schedule:read',
  SCHEDULE_UPDATE = 'schedule:update',
  SCHEDULE_DELETE = 'schedule:delete',
  
  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_SYSTEM = 'admin:system',
  ADMIN_ANALYTICS = 'admin:analytics',
  ADMIN_CONFIG = 'admin:config',
}

// Role to permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.NOTIFICATION_SEND,
    Permission.NOTIFICATION_READ,
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_UPDATE,
    Permission.SUBSCRIPTION_DELETE,
  ],
  [UserRole.PREMIUM]: [
    Permission.NOTIFICATION_SEND,
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_UPDATE,
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_UPDATE,
    Permission.SUBSCRIPTION_DELETE,
    Permission.TEMPLATE_READ,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_DELETE,
  ],
  [UserRole.ADMIN]: [
    Permission.NOTIFICATION_SEND,
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_UPDATE,
    Permission.NOTIFICATION_DELETE,
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_UPDATE,
    Permission.SUBSCRIPTION_DELETE,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_DELETE,
    Permission.ADMIN_USERS,
    Permission.ADMIN_SYSTEM,
    Permission.ADMIN_ANALYTICS,
    Permission.ADMIN_CONFIG,
  ],
  [UserRole.SYSTEM]: [
    Permission.NOTIFICATION_SEND,
    Permission.NOTIFICATION_READ,
    Permission.NOTIFICATION_UPDATE,
    Permission.NOTIFICATION_DELETE,
    Permission.SUBSCRIPTION_CREATE,
    Permission.SUBSCRIPTION_READ,
    Permission.SUBSCRIPTION_UPDATE,
    Permission.SUBSCRIPTION_DELETE,
    Permission.TEMPLATE_CREATE,
    Permission.TEMPLATE_READ,
    Permission.TEMPLATE_UPDATE,
    Permission.TEMPLATE_DELETE,
    Permission.SCHEDULE_CREATE,
    Permission.SCHEDULE_READ,
    Permission.SCHEDULE_UPDATE,
    Permission.SCHEDULE_DELETE,
    Permission.ADMIN_USERS,
    Permission.ADMIN_SYSTEM,
    Permission.ADMIN_ANALYTICS,
    Permission.ADMIN_CONFIG,
  ],
};

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}

// API Key payload interface
export interface APIKeyPayload {
  keyId: string;
  userId: string;
  role: UserRole;
  permissions: Permission[];
  iat?: number;
  exp?: number;
}

// Generate JWT token
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
  });
};

// Generate API key token
export const generateAPIKeyToken = (payload: Omit<APIKeyPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '1y', // API keys last longer
    issuer: config.jwt.issuer,
    audience: 'api',
  });
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Verify API key token
export const verifyAPIKeyToken = (token: string): APIKeyPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: 'api',
    }) as APIKeyPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid API key');
  }
};

// Extract token from request
export const extractToken = (req: any): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

// Extract API key from request
export const extractAPIKey = (req: any): string | null => {
  const apiKeyHeader = req.headers['x-api-key'];
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
};

// Check if user has permission
export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission);
};

// Check if user has any of the required permissions
export const hasAnyPermission = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// Check if user has all required permissions
export const hasAllPermissions = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

// Check if user can access resource
export const canAccessResource = (userId: string, resourceUserId: string, userRole: UserRole): boolean => {
  // System and admin can access any resource
  if (userRole === UserRole.SYSTEM || userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Users can only access their own resources
  return userId === resourceUserId;
};

// Check if user can modify resource
export const canModifyResource = (userId: string, resourceUserId: string, userRole: UserRole): boolean => {
  // System and admin can modify any resource
  if (userRole === UserRole.SYSTEM || userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Users can only modify their own resources
  return userId === resourceUserId;
};

// Check if user can delete resource
export const canDeleteResource = (userId: string, resourceUserId: string, userRole: UserRole): boolean => {
  // Only system and admin can delete resources
  if (userRole === UserRole.SYSTEM || userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Users can only delete their own resources
  return userId === resourceUserId;
};

// Get user permissions from role
export const getPermissionsFromRole = (role: UserRole): Permission[] => {
  return rolePermissions[role] || [];
};

// Rate limits by role
export const rateLimitsByRole: Record<UserRole, { windowMs: number; max: number }> = {
  [UserRole.USER]: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  [UserRole.PREMIUM]: { windowMs: 15 * 60 * 1000, max: 500 }, // 500 requests per 15 minutes
  [UserRole.ADMIN]: { windowMs: 15 * 60 * 1000, max: 1000 }, // 1000 requests per 15 minutes
  [UserRole.SYSTEM]: { windowMs: 15 * 60 * 1000, max: 10000 }, // 10000 requests per 15 minutes
};

// Notification quotas by role
export const notificationQuotasByRole: Record<UserRole, { daily: number; monthly: number }> = {
  [UserRole.USER]: { daily: 100, monthly: 1000 },
  [UserRole.PREMIUM]: { daily: 1000, monthly: 10000 },
  [UserRole.ADMIN]: { daily: 10000, monthly: 100000 },
  [UserRole.SYSTEM]: { daily: 100000, monthly: 1000000 },
};

// Get rate limit for role
export const getRateLimitForRole = (role: UserRole) => {
  return rateLimitsByRole[role] || rateLimitsByRole[UserRole.USER];
};

// Get notification quota for role
export const getNotificationQuotaForRole = (role: UserRole) => {
  return notificationQuotasByRole[role] || notificationQuotasByRole[UserRole.USER];
};

// Validate user role
export const isValidRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};

// Validate permission
export const isValidPermission = (permission: string): permission is Permission => {
  return Object.values(Permission).includes(permission as Permission);
};

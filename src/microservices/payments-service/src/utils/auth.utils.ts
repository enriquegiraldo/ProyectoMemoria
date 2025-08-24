import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from '../config';

// User roles
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MERCHANT = 'merchant',
  SUPPORT = 'support',
}

// Permissions
export enum Permission {
  // Payment permissions
  CREATE_PAYMENT = 'create_payment',
  VIEW_PAYMENT = 'view_payment',
  UPDATE_PAYMENT = 'update_payment',
  DELETE_PAYMENT = 'delete_payment',
  REFUND_PAYMENT = 'refund_payment',
  
  // Subscription permissions
  CREATE_SUBSCRIPTION = 'create_subscription',
  VIEW_SUBSCRIPTION = 'view_subscription',
  UPDATE_SUBSCRIPTION = 'update_subscription',
  CANCEL_SUBSCRIPTION = 'cancel_subscription',
  
  // Customer permissions
  CREATE_CUSTOMER = 'create_customer',
  VIEW_CUSTOMER = 'view_customer',
  UPDATE_CUSTOMER = 'update_customer',
  DELETE_CUSTOMER = 'delete_customer',
  
  // Billing permissions
  CREATE_INVOICE = 'create_invoice',
  VIEW_INVOICE = 'view_invoice',
  UPDATE_INVOICE = 'update_invoice',
  DELETE_INVOICE = 'delete_invoice',
  
  // Webhook permissions
  VIEW_WEBHOOK = 'view_webhook',
  RETRY_WEBHOOK = 'retry_webhook',
  
  // Analytics permissions
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',
  
  // System permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  VIEW_LOGS = 'view_logs',
  SYSTEM_CONFIG = 'system_config',
}

// Role to permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.CREATE_PAYMENT,
    Permission.VIEW_PAYMENT,
    Permission.CREATE_SUBSCRIPTION,
    Permission.VIEW_SUBSCRIPTION,
    Permission.CANCEL_SUBSCRIPTION,
    Permission.VIEW_INVOICE,
  ],
  [UserRole.MERCHANT]: [
    Permission.CREATE_PAYMENT,
    Permission.VIEW_PAYMENT,
    Permission.UPDATE_PAYMENT,
    Permission.REFUND_PAYMENT,
    Permission.CREATE_SUBSCRIPTION,
    Permission.VIEW_SUBSCRIPTION,
    Permission.UPDATE_SUBSCRIPTION,
    Permission.CANCEL_SUBSCRIPTION,
    Permission.CREATE_CUSTOMER,
    Permission.VIEW_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.CREATE_INVOICE,
    Permission.VIEW_INVOICE,
    Permission.UPDATE_INVOICE,
    Permission.VIEW_WEBHOOK,
    Permission.RETRY_WEBHOOK,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
  ],
  [UserRole.SUPPORT]: [
    Permission.VIEW_PAYMENT,
    Permission.REFUND_PAYMENT,
    Permission.VIEW_SUBSCRIPTION,
    Permission.UPDATE_SUBSCRIPTION,
    Permission.CANCEL_SUBSCRIPTION,
    Permission.VIEW_CUSTOMER,
    Permission.UPDATE_CUSTOMER,
    Permission.VIEW_INVOICE,
    Permission.UPDATE_INVOICE,
    Permission.VIEW_WEBHOOK,
    Permission.RETRY_WEBHOOK,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.ADMIN]: Object.values(Permission),
};

// JWT token generation
export const generateToken = (payload: any, expiresIn: string = config.jwt.expiresIn): string => {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
};

// JWT token verification
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Password hashing
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Password verification
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Permission checking
export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission);
};

// Role checking
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.USER]: 1,
    [UserRole.MERCHANT]: 2,
    [UserRole.SUPPORT]: 3,
    [UserRole.ADMIN]: 4,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Resource ownership checking
export const canAccessResource = (
  userRole: UserRole,
  userPermissions: Permission[],
  resourceOwnerId: string,
  userId: string,
  requiredPermission: Permission
): boolean => {
  // Admins can access everything
  if (userRole === UserRole.ADMIN) {
    return true;
  }
  
  // Check if user has the required permission
  if (!hasPermission(userPermissions, requiredPermission)) {
    return false;
  }
  
  // Users can only access their own resources
  if (userRole === UserRole.USER) {
    return resourceOwnerId === userId;
  }
  
  // Merchants and support can access resources they have permission for
  return true;
};

// Rate limiting based on user role
export const getRateLimits = (userRole: UserRole): { windowMs: number; max: number } => {
  const limits = {
    [UserRole.USER]: { windowMs: 15 * 60 * 1000, max: 100 }, // 15 minutes, 100 requests
    [UserRole.MERCHANT]: { windowMs: 15 * 60 * 1000, max: 1000 }, // 15 minutes, 1000 requests
    [UserRole.SUPPORT]: { windowMs: 15 * 60 * 1000, max: 500 }, // 15 minutes, 500 requests
    [UserRole.ADMIN]: { windowMs: 15 * 60 * 1000, max: 10000 }, // 15 minutes, 10000 requests
  };
  
  return limits[userRole] || limits[UserRole.USER];
};

// API key generation
export const generateApiKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// API key validation
export const validateApiKey = (apiKey: string): boolean => {
  // Basic validation - API key should be 32 characters long
  return apiKey.length === 32 && /^[A-Za-z0-9]+$/.test(apiKey);
};

// Extract user info from token
export const extractUserFromToken = (token: string): any => {
  try {
    const decoded = verifyToken(token);
    return {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Check if user can perform action on payment
export const canPerformPaymentAction = (
  userRole: UserRole,
  userPermissions: Permission[],
  paymentOwnerId: string,
  userId: string,
  action: 'view' | 'update' | 'delete' | 'refund'
): boolean => {
  const permissionMap = {
    view: Permission.VIEW_PAYMENT,
    update: Permission.UPDATE_PAYMENT,
    delete: Permission.DELETE_PAYMENT,
    refund: Permission.REFUND_PAYMENT,
  };
  
  return canAccessResource(
    userRole,
    userPermissions,
    paymentOwnerId,
    userId,
    permissionMap[action]
  );
};

// Check if user can perform action on subscription
export const canPerformSubscriptionAction = (
  userRole: UserRole,
  userPermissions: Permission[],
  subscriptionOwnerId: string,
  userId: string,
  action: 'view' | 'update' | 'cancel'
): boolean => {
  const permissionMap = {
    view: Permission.VIEW_SUBSCRIPTION,
    update: Permission.UPDATE_SUBSCRIPTION,
    cancel: Permission.CANCEL_SUBSCRIPTION,
  };
  
  return canAccessResource(
    userRole,
    userPermissions,
    subscriptionOwnerId,
    userId,
    permissionMap[action]
  );
};

// Check if user can perform action on customer
export const canPerformCustomerAction = (
  userRole: UserRole,
  userPermissions: Permission[],
  customerOwnerId: string,
  userId: string,
  action: 'view' | 'update' | 'delete'
): boolean => {
  const permissionMap = {
    view: Permission.VIEW_CUSTOMER,
    update: Permission.UPDATE_CUSTOMER,
    delete: Permission.DELETE_CUSTOMER,
  };
  
  return canAccessResource(
    userRole,
    userPermissions,
    customerOwnerId,
    userId,
    permissionMap[action]
  );
};

// Check if user can perform action on invoice
export const canPerformInvoiceAction = (
  userRole: UserRole,
  userPermissions: Permission[],
  invoiceOwnerId: string,
  userId: string,
  action: 'view' | 'update' | 'delete'
): boolean => {
  const permissionMap = {
    view: Permission.VIEW_INVOICE,
    update: Permission.UPDATE_INVOICE,
    delete: Permission.DELETE_INVOICE,
  };
  
  return canAccessResource(
    userRole,
    userPermissions,
    invoiceOwnerId,
    userId,
    permissionMap[action]
  );
};

// Get user permissions by role
export const getPermissionsByRole = (role: UserRole): Permission[] => {
  return rolePermissions[role] || [];
};

// Check if user has any of the required permissions
export const hasAnyPermission = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
};

// Check if user has all required permissions
export const hasAllPermissions = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
};

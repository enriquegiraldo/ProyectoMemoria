// src/enterprise/multi-tenancy/tenant-management/tenant.service.ts
import crypto from 'crypto';

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  subdomain?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  plan: 'basic' | 'pro' | 'enterprise';
  features: string[];
  settings: Record<string, any>;
  limits: {
    users: number;
    storage: number; // in GB
    apiCalls: number;
    customDomains: number;
  };
  usage: {
    users: number;
    storage: number;
    apiCalls: number;
    customDomains: number;
  };
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  metadata: Record<string, any>;
}

export interface TenantUser {
  id: string;
  tenantId: string;
  userId: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  permissions: string[];
  status: 'active' | 'inactive' | 'pending';
  joinedAt: number;
  lastAccessAt?: number;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitedAt: number;
  expiresAt: number;
  acceptedAt?: number;
}

export interface TenantBilling {
  id: string;
  tenantId: string;
  plan: string;
  amount: number;
  currency: string;
  status: 'active' | 'past_due' | 'cancelled' | 'unpaid';
  startDate: number;
  endDate: number;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export class TenantService {
  private static instance: TenantService;
  private tenants: Map<string, Tenant> = new Map();
  private tenantUsers: Map<string, TenantUser[]> = new Map();
  private invitations: TenantInvitation[] = [];
  private billing: TenantBilling[] = [];

  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  constructor() {
    this.initializeDefaultTenant();
  }

  private initializeDefaultTenant(): void {
    const defaultTenant: Tenant = {
      id: 'default',
      name: 'Default Tenant',
      status: 'active',
      plan: 'enterprise',
      features: ['all'],
      settings: {
        theme: 'default',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        currency: 'USD'
      },
      limits: {
        users: 1000,
        storage: 1000,
        apiCalls: 1000000,
        customDomains: 10
      },
      usage: {
        users: 0,
        storage: 0,
        apiCalls: 0,
        customDomains: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {}
    };

    this.tenants.set('default', defaultTenant);
  }

  // Tenant Management
  async createTenant(
    name: string,
    plan: Tenant['plan'] = 'basic',
    domain?: string,
    subdomain?: string
  ): Promise<Tenant> {
    const tenantId = this.generateTenantId();
    
    const tenant: Tenant = {
      id: tenantId,
      name,
      domain,
      subdomain,
      status: 'pending',
      plan,
      features: this.getPlanFeatures(plan),
      settings: this.getDefaultSettings(),
      limits: this.getPlanLimits(plan),
      usage: {
        users: 0,
        storage: 0,
        apiCalls: 0,
        customDomains: 0
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {}
    };

    this.tenants.set(tenantId, tenant);
    return tenant;
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenants.get(tenantId) || null;
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    for (const tenant of Array.from(this.tenants.values())) {
      if (tenant.domain === domain || tenant.subdomain === domain) {
        return tenant;
      }
    }
    return null;
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    Object.assign(tenant, updates);
    tenant.updatedAt = Date.now();
    this.tenants.set(tenantId, tenant);
    return true;
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    if (tenantId === 'default') {
      return false; // Cannot delete default tenant
    }

    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    // Soft delete - mark as inactive
    tenant.status = 'inactive';
    tenant.updatedAt = Date.now();
    this.tenants.set(tenantId, tenant);
    return true;
  }

  async activateTenant(tenantId: string): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.status = 'active';
    tenant.updatedAt = Date.now();
    this.tenants.set(tenantId, tenant);
    return true;
  }

  async suspendTenant(tenantId: string, reason?: string): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.status = 'suspended';
    tenant.updatedAt = Date.now();
    if (reason) {
      tenant.metadata.suspensionReason = reason;
    }
    this.tenants.set(tenantId, tenant);
    return true;
  }

  // Tenant User Management
  async addUserToTenant(
    tenantId: string,
    userId: string,
    role: TenantUser['role'] = 'user',
    permissions: string[] = []
  ): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant || tenant.status !== 'active') {
      return false;
    }

    // Check user limit
    if (tenant.usage.users >= tenant.limits.users) {
      return false;
    }

    const tenantUser: TenantUser = {
      id: this.generateId(),
      tenantId,
      userId,
      role,
      permissions: permissions.length > 0 ? permissions : this.getDefaultPermissions(role),
      status: 'active',
      joinedAt: Date.now()
    };

    const users = this.tenantUsers.get(tenantId) || [];
    users.push(tenantUser);
    this.tenantUsers.set(tenantId, users);

    // Update usage
    tenant.usage.users++;
    tenant.updatedAt = Date.now();
    this.tenants.set(tenantId, tenant);

    return true;
  }

  async removeUserFromTenant(tenantId: string, userId: string): Promise<boolean> {
    const users = this.tenantUsers.get(tenantId) || [];
    const userIndex = users.findIndex(u => u.userId === userId);
    
    if (userIndex === -1) {
      return false;
    }

    users.splice(userIndex, 1);
    this.tenantUsers.set(tenantId, users);

    // Update usage
    const tenant = this.tenants.get(tenantId);
    if (tenant) {
      tenant.usage.users = Math.max(0, tenant.usage.users - 1);
      tenant.updatedAt = Date.now();
      this.tenants.set(tenantId, tenant);
    }

    return true;
  }

  async updateUserRole(
    tenantId: string,
    userId: string,
    role: TenantUser['role'],
    permissions?: string[]
  ): Promise<boolean> {
    const users = this.tenantUsers.get(tenantId) || [];
    const user = users.find(u => u.userId === userId);
    
    if (!user) {
      return false;
    }

    user.role = role;
    if (permissions) {
      user.permissions = permissions;
    } else {
      user.permissions = this.getDefaultPermissions(role);
    }

    this.tenantUsers.set(tenantId, users);
    return true;
  }

  async getTenantUsers(tenantId: string): Promise<TenantUser[]> {
    return this.tenantUsers.get(tenantId) || [];
  }

  async getUserTenants(userId: string): Promise<Tenant[]> {
    const userTenants: Tenant[] = [];
    
    for (const [tenantId, users] of this.tenantUsers.entries()) {
      const user = users.find(u => u.userId === userId);
      if (user && user.status === 'active') {
        const tenant = this.tenants.get(tenantId);
        if (tenant) {
          userTenants.push(tenant);
        }
      }
    }

    return userTenants;
  }

  async getUserRole(tenantId: string, userId: string): Promise<TenantUser | null> {
    const users = this.tenantUsers.get(tenantId) || [];
    return users.find(u => u.userId === userId) || null;
  }

  // Invitations
  async inviteUser(
    tenantId: string,
    email: string,
    role: TenantInvitation['role'],
    invitedBy: string
  ): Promise<string> {
    const invitation: TenantInvitation = {
      id: this.generateId(),
      tenantId,
      email,
      role,
      invitedBy,
      status: 'pending',
      invitedAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };

    this.invitations.push(invitation);
    return invitation.id;
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<boolean> {
    const invitation = this.invitations.find(i => i.id === invitationId);
    if (!invitation || invitation.status !== 'pending' || Date.now() > invitation.expiresAt) {
      return false;
    }

    const success = await this.addUserToTenant(invitation.tenantId, userId, invitation.role);
    if (success) {
      invitation.status = 'accepted';
      invitation.acceptedAt = Date.now();
    }

    return success;
  }

  async getInvitations(tenantId: string): Promise<TenantInvitation[]> {
    return this.invitations.filter(i => i.tenantId === tenantId);
  }

  async cancelInvitation(invitationId: string): Promise<boolean> {
    const invitation = this.invitations.find(i => i.id === invitationId);
    if (!invitation) {
      return false;
    }

    invitation.status = 'cancelled';
    return true;
  }

  // Usage Tracking
  async trackUsage(
    tenantId: string,
    type: 'users' | 'storage' | 'apiCalls' | 'customDomains',
    amount: number = 1
  ): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    tenant.usage[type] += amount;
    tenant.updatedAt = Date.now();
    this.tenants.set(tenantId, tenant);
    return true;
  }

  async checkUsageLimit(
    tenantId: string,
    type: 'users' | 'storage' | 'apiCalls' | 'customDomains',
    amount: number = 1
  ): Promise<boolean> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return false;
    }

    return (tenant.usage[type] + amount) <= tenant.limits[type];
  }

  // Billing
  async createBilling(
    tenantId: string,
    plan: string,
    amount: number,
    currency: string = 'USD'
  ): Promise<string> {
    const billing: TenantBilling = {
      id: this.generateId(),
      tenantId,
      plan,
      amount,
      currency,
      status: 'active',
      startDate: Date.now(),
      endDate: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    };

    this.billing.push(billing);
    return billing.id;
  }

  async getBilling(tenantId: string): Promise<TenantBilling[]> {
    return this.billing.filter(b => b.tenantId === tenantId);
  }

  // Utility methods
  private generateTenantId(): string {
    return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPlanFeatures(plan: Tenant['plan']): string[] {
    switch (plan) {
      case 'basic':
        return ['basic_features', 'email_support'];
      case 'pro':
        return ['basic_features', 'advanced_features', 'priority_support', 'analytics'];
      case 'enterprise':
        return ['basic_features', 'advanced_features', 'enterprise_features', 'dedicated_support', 'analytics', 'custom_integrations'];
      default:
        return ['basic_features'];
    }
  }

  private getPlanLimits(plan: Tenant['plan']): Tenant['limits'] {
    switch (plan) {
      case 'basic':
        return {
          users: 10,
          storage: 10,
          apiCalls: 10000,
          customDomains: 1
        };
      case 'pro':
        return {
          users: 100,
          storage: 100,
          apiCalls: 100000,
          customDomains: 5
        };
      case 'enterprise':
        return {
          users: 1000,
          storage: 1000,
          apiCalls: 1000000,
          customDomains: 10
        };
      default:
        return {
          users: 10,
          storage: 10,
          apiCalls: 10000,
          customDomains: 1
        };
    }
  }

  private getDefaultSettings(): Record<string, any> {
    return {
      theme: 'default',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      currency: 'USD',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    };
  }

  private getDefaultPermissions(role: TenantUser['role']): string[] {
    switch (role) {
      case 'owner':
        return ['*'];
      case 'admin':
        return ['read', 'write', 'delete', 'manage_users', 'manage_settings'];
      case 'user':
        return ['read', 'write'];
      case 'viewer':
        return ['read'];
      default:
        return ['read'];
    }
  }

  // Statistics
  async getStats(): Promise<Record<string, any>> {
    const totalTenants = this.tenants.size;
    const activeTenants = Array.from(this.tenants.values()).filter(t => t.status === 'active').length;
    const totalUsers = Array.from(this.tenantUsers.values()).flat().length;
    const pendingInvitations = this.invitations.filter(i => i.status === 'pending').length;

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      pendingInvitations,
      plans: {
        basic: Array.from(this.tenants.values()).filter(t => t.plan === 'basic').length,
        pro: Array.from(this.tenants.values()).filter(t => t.plan === 'pro').length,
        enterprise: Array.from(this.tenants.values()).filter(t => t.plan === 'enterprise').length
      }
    };
  }

  // Cleanup expired invitations
  cleanupExpiredInvitations(): void {
    const now = Date.now();
    this.invitations = this.invitations.filter(invitation => 
      invitation.status === 'pending' && invitation.expiresAt > now
    );
  }
}

export const tenantService = TenantService.getInstance();
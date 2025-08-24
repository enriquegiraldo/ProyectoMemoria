import crypto from 'crypto';

export interface GDPRConsent {
  id: string;
  userId: string;
  tenantId?: string;
  consentType: 'marketing' | 'analytics' | 'necessary' | 'third_party';
  granted: boolean;
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  version: string;
  details: Record<string, any>;
}

export interface DataSubject {
  id: string;
  userId: string;
  tenantId?: string;
  email: string;
  name?: string;
  dataCategories: string[];
  retentionPeriod: number;
  createdAt: number;
  lastAccessed: number;
  deletionRequested?: number;
  deletedAt?: number;
}

export interface DataRequest {
  id: string;
  userId: string;
  tenantId?: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: number;
  completedAt?: number;
  details: Record<string, any>;
  response?: Record<string, any>;
}

export interface DataRetentionPolicy {
  id: string;
  tenantId?: string;
  dataCategory: string;
  retentionPeriod: number; // in days
  deletionMethod: 'soft' | 'hard' | 'anonymize';
  enabled: boolean;
  createdAt: number;
}

export class GDPRService {
  private static instance: GDPRService;
  private consents: GDPRConsent[] = [];
  private dataSubjects: DataSubject[] = [];
  private dataRequests: DataRequest[] = [];
  private retentionPolicies: DataRetentionPolicy[] = [];

  static getInstance(): GDPRService {
    if (!GDPRService.instance) {
      GDPRService.instance = new GDPRService();
    }
    return GDPRService.instance;
  }

  constructor() {
    this.initializeDefaultPolicies();
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicies: DataRetentionPolicy[] = [
      {
        id: 'policy-1',
        dataCategory: 'user_profile',
        retentionPeriod: 2555, // 7 years
        deletionMethod: 'soft',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'policy-2',
        dataCategory: 'analytics',
        retentionPeriod: 365, // 1 year
        deletionMethod: 'anonymize',
        enabled: true,
        createdAt: Date.now()
      },
      {
        id: 'policy-3',
        dataCategory: 'logs',
        retentionPeriod: 90, // 3 months
        deletionMethod: 'hard',
        enabled: true,
        createdAt: Date.now()
      }
    ];

    this.retentionPolicies.push(...defaultPolicies);
  }

  // Consent Management
  async recordConsent(
    userId: string,
    tenantId: string | undefined,
    consentType: GDPRConsent['consentType'],
    granted: boolean,
    ipAddress: string,
    userAgent: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    const consent: GDPRConsent = {
      id: this.generateId(),
      userId,
      tenantId,
      consentType,
      granted,
      timestamp: Date.now(),
      ipAddress,
      userAgent,
      version: '1.0',
      details
    };

    this.consents.push(consent);
    return consent.id;
  }

  async getConsentHistory(userId: string): Promise<GDPRConsent[]> {
    return this.consents
      .filter(consent => consent.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async hasValidConsent(userId: string, consentType: GDPRConsent['consentType']): Promise<boolean> {
    const userConsents = this.consents.filter(consent => 
      consent.userId === userId && consent.consentType === consentType
    );

    if (userConsents.length === 0) {
      return false;
    }

    // Get the most recent consent
    const latestConsent = userConsents.sort((a, b) => b.timestamp - a.timestamp)[0];
    return latestConsent.granted;
  }

  async withdrawConsent(
    userId: string,
    tenantId: string | undefined,
    consentType: GDPRConsent['consentType'],
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    return this.recordConsent(userId, tenantId, consentType, false, ipAddress, userAgent, {
      action: 'withdrawal'
    });
  }

  // Data Subject Management
  async registerDataSubject(
    userId: string,
    tenantId: string | undefined,
    email: string,
    name?: string,
    dataCategories: string[] = ['user_profile']
  ): Promise<string> {
    const dataSubject: DataSubject = {
      id: this.generateId(),
      userId,
      tenantId,
      email,
      name,
      dataCategories,
      retentionPeriod: 2555, // Default 7 years
      createdAt: Date.now(),
      lastAccessed: Date.now()
    };

    this.dataSubjects.push(dataSubject);
    return dataSubject.id;
  }

  async getDataSubject(userId: string): Promise<DataSubject | null> {
    return this.dataSubjects.find(subject => subject.userId === userId) || null;
  }

  async updateDataSubject(userId: string, updates: Partial<DataSubject>): Promise<boolean> {
    const subject = this.dataSubjects.find(s => s.userId === userId);
    if (!subject) {
      return false;
    }

    Object.assign(subject, updates);
    subject.lastAccessed = Date.now();
    return true;
  }

  // Data Subject Rights
  async requestDataAccess(userId: string, tenantId?: string): Promise<string> {
    const request: DataRequest = {
      id: this.generateId(),
      userId,
      tenantId,
      requestType: 'access',
      status: 'pending',
      requestedAt: Date.now(),
      details: {}
    };

    this.dataRequests.push(request);
    return request.id;
  }

  async requestDataRectification(
    userId: string,
    tenantId: string | undefined,
    corrections: Record<string, any>
  ): Promise<string> {
    const request: DataRequest = {
      id: this.generateId(),
      userId,
      tenantId,
      requestType: 'rectification',
      status: 'pending',
      requestedAt: Date.now(),
      details: { corrections }
    };

    this.dataRequests.push(request);
    return request.id;
  }

  async requestDataErasure(userId: string, tenantId?: string): Promise<string> {
    const request: DataRequest = {
      id: this.generateId(),
      userId,
      tenantId,
      requestType: 'erasure',
      status: 'pending',
      requestedAt: Date.now(),
      details: {}
    };

    this.dataRequests.push(request);

    // Mark data subject for deletion
    const subject = this.dataSubjects.find(s => s.userId === userId);
    if (subject) {
      subject.deletionRequested = Date.now();
    }

    return request.id;
  }

  async requestDataPortability(userId: string, tenantId?: string): Promise<string> {
    const request: DataRequest = {
      id: this.generateId(),
      userId,
      tenantId,
      requestType: 'portability',
      status: 'pending',
      requestedAt: Date.now(),
      details: {}
    };

    this.dataRequests.push(request);
    return request.id;
  }

  async requestDataRestriction(
    userId: string,
    tenantId: string | undefined,
    reason: string
  ): Promise<string> {
    const request: DataRequest = {
      id: this.generateId(),
      userId,
      tenantId,
      requestType: 'restriction',
      status: 'pending',
      requestedAt: Date.now(),
      details: { reason }
    };

    this.dataRequests.push(request);
    return request.id;
  }

  // Data Processing
  async processDataRequest(requestId: string): Promise<boolean> {
    const request = this.dataRequests.find(r => r.id === requestId);
    if (!request) {
      return false;
    }

    request.status = 'processing';

    try {
      switch (request.requestType) {
        case 'access':
          request.response = await this.generateDataExport(request.userId);
          break;
        case 'rectification':
          request.response = await this.applyDataCorrections(request.userId, request.details.corrections);
          break;
        case 'erasure':
          request.response = await this.performDataErasure(request.userId);
          break;
        case 'portability':
          request.response = await this.generateDataPortability(request.userId);
          break;
        case 'restriction':
          request.response = await this.applyDataRestriction(request.userId, request.details.reason);
          break;
      }

      request.status = 'completed';
      request.completedAt = Date.now();
      return true;
    } catch (error) {
      request.status = 'rejected';
      request.response = { error: error.message };
      return false;
    }
  }

  private async generateDataExport(userId: string): Promise<Record<string, any>> {
    const subject = this.dataSubjects.find(s => s.userId === userId);
    const consents = this.consents.filter(c => c.userId === userId);

    return {
      dataSubject: subject,
      consents,
      exportDate: new Date().toISOString(),
      format: 'json'
    };
  }

  private async applyDataCorrections(userId: string, corrections: Record<string, any>): Promise<Record<string, any>> {
    const subject = this.dataSubjects.find(s => s.userId === userId);
    if (subject) {
      Object.assign(subject, corrections);
      subject.lastAccessed = Date.now();
    }

    return {
      applied: true,
      corrections,
      timestamp: new Date().toISOString()
    };
  }

  private async performDataErasure(userId: string): Promise<Record<string, any>> {
    const subject = this.dataSubjects.find(s => s.userId === userId);
    if (subject) {
      subject.deletedAt = Date.now();
    }

    // Remove consents
    this.consents = this.consents.filter(c => c.userId !== userId);

    return {
      erased: true,
      timestamp: new Date().toISOString(),
      dataTypes: ['profile', 'consents']
    };
  }

  private async generateDataPortability(userId: string): Promise<Record<string, any>> {
    const subject = this.dataSubjects.find(s => s.userId === userId);
    const consents = this.consents.filter(c => c.userId === userId);

    return {
      dataSubject: subject,
      consents,
      exportDate: new Date().toISOString(),
      format: 'machine_readable'
    };
  }

  private async applyDataRestriction(userId: string, reason: string): Promise<Record<string, any>> {
    const subject = this.dataSubjects.find(s => s.userId === userId);
    if (subject) {
      subject.lastAccessed = Date.now();
    }

    return {
      restricted: true,
      reason,
      timestamp: new Date().toISOString()
    };
  }

  // Data Retention
  async applyRetentionPolicies(): Promise<{ processed: number; deleted: number }> {
    let processed = 0;
    let deleted = 0;

    for (const policy of this.retentionPolicies) {
      if (!policy.enabled) continue;

      const cutoffDate = Date.now() - (policy.retentionPeriod * 24 * 60 * 60 * 1000);
      
      switch (policy.dataCategory) {
        case 'user_profile':
          const subjectsToProcess = this.dataSubjects.filter(s => 
            s.createdAt < cutoffDate && !s.deletedAt
          );
          
          for (const subject of subjectsToProcess) {
            if (policy.deletionMethod === 'hard') {
              subject.deletedAt = Date.now();
              deleted++;
            } else if (policy.deletionMethod === 'anonymize') {
              subject.email = this.anonymizeEmail(subject.email);
              subject.name = 'ANONYMIZED';
            }
            processed++;
          }
          break;

        case 'analytics':
          // Process analytics data
          processed++;
          break;

        case 'logs':
          // Process log data
          processed++;
          break;
      }
    }

    return { processed, deleted };
  }

  private anonymizeEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const anonymizedLocal = localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
    return `${anonymizedLocal}@${domain}`;
  }

  // Reporting
  async generateGDPRReport(tenantId?: string): Promise<Record<string, any>> {
    const subjects = tenantId 
      ? this.dataSubjects.filter(s => s.tenantId === tenantId)
      : this.dataSubjects;

    const consents = tenantId
      ? this.consents.filter(c => c.tenantId === tenantId)
      : this.consents;

    const requests = tenantId
      ? this.dataRequests.filter(r => r.tenantId === tenantId)
      : this.dataRequests;

    return {
      reportDate: new Date().toISOString(),
      tenantId,
      summary: {
        totalDataSubjects: subjects.length,
        activeDataSubjects: subjects.filter(s => !s.deletedAt).length,
        totalConsents: consents.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        completedRequests: requests.filter(r => r.status === 'completed').length
      },
      details: {
        dataSubjects: subjects,
        consents: consents,
        requests: requests,
        retentionPolicies: this.retentionPolicies
      }
    };
  }

  // Utility methods
  private generateId(): string {
    return `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getRequestStatus(requestId: string): Promise<DataRequest | null> {
    return this.dataRequests.find(r => r.id === requestId) || null;
  }

  async getUserRequests(userId: string): Promise<DataRequest[]> {
    return this.dataRequests
      .filter(r => r.userId === userId)
      .sort((a, b) => b.requestedAt - a.requestedAt);
  }

  async getStats(): Promise<Record<string, any>> {
    return {
      totalDataSubjects: this.dataSubjects.length,
      totalConsents: this.consents.length,
      totalRequests: this.dataRequests.length,
      pendingRequests: this.dataRequests.filter(r => r.status === 'pending').length,
      retentionPolicies: this.retentionPolicies.length
    };
  }
}

export const gdprService = GDPRService.getInstance();

import { NextApiRequest } from 'next';

export interface AuditEvent {
  id: string;
  timestamp: number;
  userId?: string;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  outcome: 'success' | 'failure' | 'pending';
  metadata: Record<string, any>;
}

export interface AuditQuery {
  userId?: string;
  tenantId?: string;
  action?: string;
  resource?: string;
  severity?: string;
  outcome?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  offset?: number;
}

export interface AuditStats {
  totalEvents: number;
  eventsBySeverity: Record<string, number>;
  eventsByAction: Record<string, number>;
  eventsByOutcome: Record<string, number>;
  eventsByUser: Record<string, number>;
  eventsByTenant: Record<string, number>;
}

export class AuditService {
  private static instance: AuditService;
  private events: AuditEvent[] = [];
  private maxEvents: number = 10000; // Keep last 10k events in memory

  static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async logEvent(
    req: NextApiRequest,
    action: string,
    resource: string,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low',
    outcome: 'success' | 'failure' | 'pending' = 'success'
  ): Promise<string> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      userId: (req as any).user?.id,
      tenantId: (req as any).tenantId || (req as any).user?.tenantId,
      action,
      resource,
      resourceId: details.resourceId,
      details,
      ipAddress: this.getClientIP(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      sessionId: req.headers['x-session-id'] as string,
      severity,
      outcome,
      metadata: {
        requestId: req.headers['x-request-id'] as string,
        method: req.method,
        url: req.url,
        referer: req.headers.referer
      }
    };

    this.events.push(event);

    // Maintain max events limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('AUDIT:', {
        id: event.id,
        timestamp: new Date(event.timestamp).toISOString(),
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        severity: event.severity,
        outcome: event.outcome
      });
    }

    return event.id;
  }

  async logSecurityEvent(
    req: NextApiRequest,
    action: string,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    return this.logEvent(req, action, 'security', details, severity, 'success');
  }

  async logAuthenticationEvent(
    req: NextApiRequest,
    action: 'login' | 'logout' | 'login_failed' | 'password_reset' | '2fa_enabled' | '2fa_disabled',
    details: Record<string, any> = {}
  ): Promise<string> {
    const severity = action === 'login_failed' ? 'medium' : 'low';
    return this.logEvent(req, action, 'authentication', details, severity, 'success');
  }

  async logDataAccessEvent(
    req: NextApiRequest,
    action: 'read' | 'create' | 'update' | 'delete',
    resource: string,
    resourceId: string,
    details: Record<string, any> = {}
  ): Promise<string> {
    return this.logEvent(req, action, resource, { ...details, resourceId }, 'low', 'success');
  }

  async logSystemEvent(
    action: string,
    details: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<string> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      action,
      resource: 'system',
      details,
      ipAddress: 'system',
      userAgent: 'system',
      severity,
      outcome: 'success',
      metadata: {}
    };

    this.events.push(event);

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    return event.id;
  }

  async queryEvents(query: AuditQuery): Promise<AuditEvent[]> {
    let filteredEvents = this.events;

    if (query.userId) {
      filteredEvents = filteredEvents.filter(event => event.userId === query.userId);
    }

    if (query.tenantId) {
      filteredEvents = filteredEvents.filter(event => event.tenantId === query.tenantId);
    }

    if (query.action) {
      filteredEvents = filteredEvents.filter(event => event.action === query.action);
    }

    if (query.resource) {
      filteredEvents = filteredEvents.filter(event => event.resource === query.resource);
    }

    if (query.severity) {
      filteredEvents = filteredEvents.filter(event => event.severity === query.severity);
    }

    if (query.outcome) {
      filteredEvents = filteredEvents.filter(event => event.outcome === query.outcome);
    }

    if (query.startTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= query.startTime!);
    }

    if (query.endTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= query.endTime!);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return paginatedEvents;
  }

  async getEventById(eventId: string): Promise<AuditEvent | null> {
    return this.events.find(event => event.id === eventId) || null;
  }

  async getEventsByUser(userId: string, limit: number = 100): Promise<AuditEvent[]> {
    return this.events
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getEventsByTenant(tenantId: string, limit: number = 100): Promise<AuditEvent[]> {
    return this.events
      .filter(event => event.tenantId === tenantId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getSecurityEvents(limit: number = 100): Promise<AuditEvent[]> {
    return this.events
      .filter(event => event.resource === 'security' || event.severity === 'high' || event.severity === 'critical')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getFailedEvents(limit: number = 100): Promise<AuditEvent[]> {
    return this.events
      .filter(event => event.outcome === 'failure')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getStats(timeRange?: { start: number; end: number }): Promise<AuditStats> {
    let events = this.events;

    if (timeRange) {
      events = events.filter(event => 
        event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
      );
    }

    const stats: AuditStats = {
      totalEvents: events.length,
      eventsBySeverity: {},
      eventsByAction: {},
      eventsByOutcome: {},
      eventsByUser: {},
      eventsByTenant: {}
    };

    events.forEach(event => {
      // Count by severity
      stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;

      // Count by action
      stats.eventsByAction[event.action] = (stats.eventsByAction[event.action] || 0) + 1;

      // Count by outcome
      stats.eventsByOutcome[event.outcome] = (stats.eventsByOutcome[event.outcome] || 0) + 1;

      // Count by user
      if (event.userId) {
        stats.eventsByUser[event.userId] = (stats.eventsByUser[event.userId] || 0) + 1;
      }

      // Count by tenant
      if (event.tenantId) {
        stats.eventsByTenant[event.tenantId] = (stats.eventsByTenant[event.tenantId] || 0) + 1;
      }
    });

    return stats;
  }

  async exportEvents(query: AuditQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    const events = await this.queryEvents(query);

    if (format === 'csv') {
      return this.eventsToCSV(events);
    }

    return JSON.stringify(events, null, 2);
  }

  private eventsToCSV(events: AuditEvent[]): string {
    const headers = [
      'ID', 'Timestamp', 'User ID', 'Tenant ID', 'Action', 'Resource', 'Resource ID',
      'Severity', 'Outcome', 'IP Address', 'User Agent', 'Session ID'
    ];

    const rows = events.map(event => [
      event.id,
      new Date(event.timestamp).toISOString(),
      event.userId || '',
      event.tenantId || '',
      event.action,
      event.resource,
      event.resourceId || '',
      event.severity,
      event.outcome,
      event.ipAddress,
      event.userAgent,
      event.sessionId || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getClientIP(req: NextApiRequest): string {
    return req.headers['x-forwarded-for'] as string ||
           req.headers['x-real-ip'] as string ||
           req.socket.remoteAddress ||
           'unknown';
  }

  // Cleanup old events (older than 30 days)
  cleanupOldEvents(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp > thirtyDaysAgo);
  }

  // Get memory usage
  getMemoryUsage(): { events: number; maxEvents: number; memoryEstimate: number } {
    const memoryEstimate = this.events.length * 1024; // Rough estimate: 1KB per event
    return {
      events: this.events.length,
      maxEvents: this.maxEvents,
      memoryEstimate
    };
  }
}

export const auditService = AuditService.getInstance();

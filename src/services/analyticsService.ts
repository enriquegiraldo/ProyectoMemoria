import { supabase } from '../lib/supabase';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

export interface UserMetrics {
  totalMemories: number;
  totalStorageUsed: number;
  averageMemorySize: number;
  memoriesThisMonth: number;
  storageThisMonth: number;
  mostUsedTags: Array<{ tag: string; count: number }>;
  activityByDay: Array<{ date: string; count: number }>;
}

export interface SystemMetrics {
  totalUsers: number;
  totalMemories: number;
  totalStorageUsed: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  conversionRate: number;
  averageSessionDuration: number;
}

export class AnalyticsService {
  // Track user events
  static async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const eventData = {
        event: event.event,
        properties: event.properties || {},
        user_id: event.userId || user?.id,
        timestamp: event.timestamp || new Date().toISOString(),
        session_id: this.getSessionId(),
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        page_url: typeof window !== 'undefined' ? window.location.href : null,
      };

      // Send to analytics endpoint
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Get user metrics
  static async getUserMetrics(userId?: string): Promise<UserMetrics | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) return null;

      // Get total memories
      const { count: totalMemories } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId);

      // Get storage usage
      const { data: memories } = await supabase
        .from('memories')
        .select('file_size, created_at, tags')
        .eq('user_id', targetUserId);

      const totalStorageUsed = memories?.reduce((total, memory) => total + (memory.file_size || 0), 0) || 0;
      const averageMemorySize = totalMemories ? totalStorageUsed / totalMemories : 0;

      // Get this month's activity
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: memoriesThisMonth } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
        .gte('created_at', startOfMonth.toISOString());

      const storageThisMonth = memories
        ?.filter(memory => new Date(memory.created_at) >= startOfMonth)
        .reduce((total, memory) => total + (memory.file_size || 0), 0) || 0;

      // Get most used tags
      const tagCounts: Record<string, number> = {};
      memories?.forEach(memory => {
        if (memory.tags) {
          const tags = Array.isArray(memory.tags) ? memory.tags : [memory.tags];
          tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const mostUsedTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get activity by day (last 30 days)
      const activityByDay: Array<{ date: string; count: number }> = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentMemories } = await supabase
        .from('memories')
        .select('created_at')
        .eq('user_id', targetUserId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Group by day
      const dayCounts: Record<string, number> = {};
      recentMemories?.forEach(memory => {
        const date = new Date(memory.created_at).toISOString().split('T')[0];
        dayCounts[date] = (dayCounts[date] || 0) + 1;
      });

      // Fill in missing days
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        activityByDay.unshift({
          date: dateStr,
          count: dayCounts[dateStr] || 0,
        });
      }

      return {
        totalMemories: totalMemories || 0,
        totalStorageUsed,
        averageMemorySize,
        memoriesThisMonth: memoriesThisMonth || 0,
        storageThisMonth,
        mostUsedTags,
        activityByDay,
      };
    } catch (error) {
      console.error('Error getting user metrics:', error);
      return null;
    }
  }

  // Get system metrics (admin only)
  static async getSystemMetrics(): Promise<SystemMetrics | null> {
    try {
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') return null;

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total memories
      const { count: totalMemories } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true });

      // Get storage usage
      const { data: allMemories } = await supabase
        .from('memories')
        .select('file_size');

      const totalStorageUsed = allMemories?.reduce((total, memory) => total + (memory.file_size || 0), 0) || 0;

      // Get active users
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // This would require tracking user sessions in a separate table
      // For now, we'll use a simplified approach
      const { count: activeUsersToday } = await supabase
        .from('memories')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      const { count: activeUsersThisWeek } = await supabase
        .from('memories')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      const { count: activeUsersThisMonth } = await supabase
        .from('memories')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', monthAgo.toISOString());

      // Calculate conversion rate (users with paid plans)
      const { count: paidUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('subscription_plan', 'FREE');

      const conversionRate = totalUsers ? (paidUsers || 0) / totalUsers : 0;

      return {
        totalUsers: totalUsers || 0,
        totalMemories: totalMemories || 0,
        totalStorageUsed,
        activeUsersToday: activeUsersToday || 0,
        activeUsersThisWeek: activeUsersThisWeek || 0,
        activeUsersThisMonth: activeUsersThisMonth || 0,
        conversionRate,
        averageSessionDuration: 0, // Would need session tracking
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return null;
    }
  }

  // Track page views
  static async trackPageView(page: string): Promise<void> {
    await this.trackEvent({
      event: 'page_view',
      properties: { page },
    });
  }

  // Track memory creation
  static async trackMemoryCreated(memoryId: string, fileSize: number, tags?: string[]): Promise<void> {
    await this.trackEvent({
      event: 'memory_created',
      properties: {
        memory_id: memoryId,
        file_size: fileSize,
        tags: tags || [],
      },
    });
  }

  // Track memory viewed
  static async trackMemoryViewed(memoryId: string): Promise<void> {
    await this.trackEvent({
      event: 'memory_viewed',
      properties: { memory_id: memoryId },
    });
  }

  // Track search
  static async trackSearch(query: string, resultsCount: number): Promise<void> {
    await this.trackEvent({
      event: 'search_performed',
      properties: {
        query,
        results_count: resultsCount,
      },
    });
  }

  // Track subscription events
  static async trackSubscriptionStarted(planId: string, amount: number): Promise<void> {
    await this.trackEvent({
      event: 'subscription_started',
      properties: {
        plan_id: planId,
        amount,
      },
    });
  }

  static async trackSubscriptionCanceled(planId: string): Promise<void> {
    await this.trackEvent({
      event: 'subscription_canceled',
      properties: { plan_id: planId },
    });
  }

  // Track feature usage
  static async trackFeatureUsed(feature: string): Promise<void> {
    await this.trackEvent({
      event: 'feature_used',
      properties: { feature },
    });
  }

  // Get session ID for tracking
  private static getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }
}

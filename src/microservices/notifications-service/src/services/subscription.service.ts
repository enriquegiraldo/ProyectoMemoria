import { v4 as uuidv4 } from 'uuid';
import { 
  Subscription,
  NotificationPreferences,
  SubscriptionQuery,
  SubscriptionResult,
  SubscriptionStatus
} from '../types';
import { logger, metrics, logAudit } from '../utils';
import { 
  SubscriptionError, 
  SubscriptionNotFoundError, 
  InvalidSubscriptionError,
  ValidationError 
} from '../utils/errors';

export class SubscriptionService {
  private subscriptions: Map<string, Subscription> = new Map();
  private userSubscriptions: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeDefaultSubscriptions();
  }

  private initializeDefaultSubscriptions() {
    // This would typically load from a database
    // For now, we'll create some mock subscriptions
    logger.info('Initializing subscription service');
  }

  async createSubscription(subscription: Subscription): Promise<Subscription> {
    const startTime = Date.now();

    try {
      // Validate subscription
      this.validateSubscription(subscription);

      // Generate ID if not provided
      const subscriptionId = subscription.id || uuidv4();
      const newSubscription: Subscription = {
        ...subscription,
        id: subscriptionId,
        createdAt: subscription.createdAt || new Date(),
        updatedAt: new Date(),
      };

      // Store subscription
      this.subscriptions.set(subscriptionId, newSubscription);

      // Add to user's subscription list
      if (!this.userSubscriptions.has(subscription.userId)) {
        this.userSubscriptions.set(subscription.userId, new Set());
      }
      this.userSubscriptions.get(subscription.userId)!.add(subscriptionId);

      const duration = Date.now() - startTime;

      logger.info('Subscription created successfully', {
        subscriptionId,
        userId: subscription.userId,
        type: subscription.type,
        channel: subscription.channel,
        duration,
      });

      logAudit('subscription:create', subscription.userId, `subscription:${subscriptionId}`, {
        subscriptionId,
        type: subscription.type,
        channel: subscription.channel,
      });

      metrics.recordSubscriptionChange('create', subscription.type);

      return newSubscription;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Subscription creation failed', {
        userId: subscription.userId,
        type: subscription.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    return this.subscriptions.get(subscriptionId) || null;
  }

  async getUserSubscriptions(userId: string, query?: SubscriptionQuery): Promise<Subscription[]> {
    const userSubscriptionIds = this.userSubscriptions.get(userId);
    if (!userSubscriptionIds) {
      return [];
    }

    let subscriptions = Array.from(userSubscriptionIds)
      .map(id => this.subscriptions.get(id))
      .filter((sub): sub is Subscription => sub !== undefined);

    // Apply filters
    if (query?.type) {
      subscriptions = subscriptions.filter(sub => sub.type === query.type);
    }

    if (query?.enabled !== undefined) {
      subscriptions = subscriptions.filter(sub => sub.preferences.enabled === query.enabled);
    }

    // Apply pagination
    const limit = query?.limit || 20;
    const offset = query?.offset || 0;
    subscriptions = subscriptions.slice(offset, offset + limit);

    return subscriptions;
  }

  async updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription> {
    const startTime = Date.now();

    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new SubscriptionNotFoundError(subscriptionId);
      }

      // Validate updates
      this.validateSubscriptionUpdates(updates);

      const updatedSubscription: Subscription = {
        ...subscription,
        ...updates,
        id: subscriptionId, // Ensure ID doesn't change
        updatedAt: new Date(),
      };

      // Store updated subscription
      this.subscriptions.set(subscriptionId, updatedSubscription);

      const duration = Date.now() - startTime;

      logger.info('Subscription updated successfully', {
        subscriptionId,
        userId: subscription.userId,
        type: subscription.type,
        duration,
      });

      logAudit('subscription:update', subscription.userId, `subscription:${subscriptionId}`, {
        subscriptionId,
        updates: Object.keys(updates),
      });

      metrics.recordSubscriptionChange('update', subscription.type);

      return updatedSubscription;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Subscription update failed', {
        subscriptionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    const startTime = Date.now();

    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new SubscriptionNotFoundError(subscriptionId);
      }

      // Remove from storage
      this.subscriptions.delete(subscriptionId);

      // Remove from user's subscription list
      const userSubscriptionIds = this.userSubscriptions.get(subscription.userId);
      if (userSubscriptionIds) {
        userSubscriptionIds.delete(subscriptionId);
        if (userSubscriptionIds.size === 0) {
          this.userSubscriptions.delete(subscription.userId);
        }
      }

      const duration = Date.now() - startTime;

      logger.info('Subscription deleted successfully', {
        subscriptionId,
        userId: subscription.userId,
        type: subscription.type,
        duration,
      });

      logAudit('subscription:delete', subscription.userId, `subscription:${subscriptionId}`, {
        subscriptionId,
        type: subscription.type,
      });

      metrics.recordSubscriptionChange('delete', subscription.type);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Subscription deletion failed', {
        subscriptionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }

  async updatePreferences(
    userId: string, 
    type: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<Subscription[]> {
    const startTime = Date.now();

    try {
      const userSubscriptionIds = this.userSubscriptions.get(userId);
      if (!userSubscriptionIds) {
        return [];
      }

      const updatedSubscriptions: Subscription[] = [];

      for (const subscriptionId of userSubscriptionIds) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription && subscription.type === type) {
          const updatedSubscription = await this.updateSubscription(subscriptionId, {
            preferences: {
              ...subscription.preferences,
              ...preferences,
            },
          });
          updatedSubscriptions.push(updatedSubscription);
        }
      }

      const duration = Date.now() - startTime;

      logger.info('User preferences updated successfully', {
        userId,
        type,
        updatedCount: updatedSubscriptions.length,
        duration,
      });

      logAudit('preferences:update', userId, `preferences:${type}`, {
        type,
        updatedCount: updatedSubscriptions.length,
      });

      return updatedSubscriptions;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('User preferences update failed', {
        userId,
        type,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });

      throw error;
    }
  }

  async getPreferences(userId: string, type?: string): Promise<NotificationPreferences[]> {
    const userSubscriptionIds = this.userSubscriptions.get(userId);
    if (!userSubscriptionIds) {
      return [];
    }

    const preferences: NotificationPreferences[] = [];

    for (const subscriptionId of userSubscriptionIds) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription && (!type || subscription.type === type)) {
        preferences.push(subscription.preferences);
      }
    }

    return preferences;
  }

  async enableSubscription(subscriptionId: string): Promise<Subscription> {
    return this.updateSubscription(subscriptionId, {
      preferences: { enabled: true }
    });
  }

  async disableSubscription(subscriptionId: string): Promise<Subscription> {
    return this.updateSubscription(subscriptionId, {
      preferences: { enabled: false }
    });
  }

  async enableUserSubscriptions(userId: string, type?: string): Promise<Subscription[]> {
    const userSubscriptionIds = this.userSubscriptions.get(userId);
    if (!userSubscriptionIds) {
      return [];
    }

    const updatedSubscriptions: Subscription[] = [];

    for (const subscriptionId of userSubscriptionIds) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription && (!type || subscription.type === type)) {
        const updatedSubscription = await this.enableSubscription(subscriptionId);
        updatedSubscriptions.push(updatedSubscription);
      }
    }

    return updatedSubscriptions;
  }

  async disableUserSubscriptions(userId: string, type?: string): Promise<Subscription[]> {
    const userSubscriptionIds = this.userSubscriptions.get(userId);
    if (!userSubscriptionIds) {
      return [];
    }

    const updatedSubscriptions: Subscription[] = [];

    for (const subscriptionId of userSubscriptionIds) {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription && (!type || subscription.type === type)) {
        const updatedSubscription = await this.disableSubscription(subscriptionId);
        updatedSubscriptions.push(updatedSubscription);
      }
    }

    return updatedSubscriptions;
  }

  async getActiveSubscriptions(userId: string, type?: string): Promise<Subscription[]> {
    const subscriptions = await this.getUserSubscriptions(userId);
    return subscriptions.filter(sub => 
      sub.preferences.enabled && (!type || sub.type === type)
    );
  }

  async getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatus> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new SubscriptionNotFoundError(subscriptionId);
    }

    return {
      subscriptionId,
      enabled: subscription.preferences.enabled,
      lastUpdated: subscription.updatedAt,
      type: subscription.type,
      channel: subscription.channel,
    };
  }

  async validateSubscription(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    // Check if subscription is enabled
    if (!subscription.preferences.enabled) {
      return false;
    }

    // Check quiet hours if enabled
    if (subscription.preferences.quietHours?.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      const startTime = subscription.preferences.quietHours.start;
      const endTime = subscription.preferences.quietHours.end;
      
      if (startTime && endTime) {
        if (startTime <= endTime) {
          // Same day quiet hours (e.g., 22:00 to 08:00)
          if (currentTime >= startTime || currentTime <= endTime) {
            return false;
          }
        } else {
          // Overnight quiet hours (e.g., 22:00 to 08:00)
          if (currentTime >= startTime && currentTime <= endTime) {
            return false;
          }
        }
      }
    }

    return true;
  }

  async getSubscriptionStats(userId: string): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
  }> {
    const subscriptions = await this.getUserSubscriptions(userId);
    const activeSubscriptions = subscriptions.filter(sub => sub.preferences.enabled);
    
    const byType: Record<string, number> = {};
    subscriptions.forEach(sub => {
      byType[sub.type] = (byType[sub.type] || 0) + 1;
    });

    return {
      total: subscriptions.length,
      active: activeSubscriptions.length,
      byType,
    };
  }

  private validateSubscription(subscription: Subscription): void {
    if (!subscription.userId) {
      throw new ValidationError('User ID is required');
    }

    if (!subscription.type) {
      throw new ValidationError('Subscription type is required');
    }

    if (!subscription.channel) {
      throw new ValidationError('Subscription channel is required');
    }

    if (!subscription.address) {
      throw new ValidationError('Subscription address is required');
    }

    // Validate type-specific requirements
    switch (subscription.type) {
      case 'email':
        if (!this.isValidEmail(subscription.address)) {
          throw new InvalidSubscriptionError('Invalid email address');
        }
        break;
      case 'sms':
        if (!this.isValidPhone(subscription.address)) {
          throw new InvalidSubscriptionError('Invalid phone number');
        }
        break;
      case 'push':
        if (!this.isValidEndpoint(subscription.address)) {
          throw new InvalidSubscriptionError('Invalid push endpoint');
        }
        break;
      case 'webhook':
        if (!this.isValidUrl(subscription.address)) {
          throw new InvalidSubscriptionError('Invalid webhook URL');
        }
        break;
    }

    // Validate preferences
    if (subscription.preferences.quietHours?.enabled) {
      const { start, end } = subscription.preferences.quietHours;
      if (start && end) {
        if (!this.isValidTime(start) || !this.isValidTime(end)) {
          throw new InvalidSubscriptionError('Invalid quiet hours format');
        }
      }
    }
  }

  private validateSubscriptionUpdates(updates: Partial<Subscription>): void {
    if (updates.address) {
      // Validate address based on type
      const type = updates.type;
      if (type === 'email' && !this.isValidEmail(updates.address)) {
        throw new InvalidSubscriptionError('Invalid email address');
      }
      if (type === 'sms' && !this.isValidPhone(updates.address)) {
        throw new InvalidSubscriptionError('Invalid phone number');
      }
      if (type === 'push' && !this.isValidEndpoint(updates.address)) {
        throw new InvalidSubscriptionError('Invalid push endpoint');
      }
      if (type === 'webhook' && !this.isValidUrl(updates.address)) {
        throw new InvalidSubscriptionError('Invalid webhook URL');
      }
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }

  private isValidEndpoint(endpoint: string): boolean {
    try {
      new URL(endpoint);
      return true;
    } catch {
      return false;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}

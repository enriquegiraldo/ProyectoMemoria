import { useState, useEffect } from 'react';
import { AnalyticsService, type UserMetrics, type SystemMetrics } from '../services/analyticsService';

export interface UseAnalyticsReturn {
  // Estado
  userMetrics: UserMetrics | null;
  systemMetrics: SystemMetrics | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  trackPageView: (page: string) => Promise<void>;
  trackMemoryCreated: (memoryId: string, fileSize: number, tags?: string[]) => Promise<void>;
  trackMemoryViewed: (memoryId: string) => Promise<void>;
  trackSearch: (query: string, resultsCount: number) => Promise<void>;
  trackSubscriptionStarted: (planId: string, amount: number) => Promise<void>;
  trackSubscriptionCanceled: (planId: string) => Promise<void>;
  trackFeatureUsed: (feature: string) => Promise<void>;
  
  // Métricas
  loadUserMetrics: (userId?: string) => Promise<void>;
  loadSystemMetrics: () => Promise<void>;
  
  // Utilidades
  formatBytes: (bytes: number) => string;
  formatNumber: (num: number) => string;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trackPageView = async (page: string): Promise<void> => {
    try {
      await AnalyticsService.trackPageView(page);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  const trackMemoryCreated = async (memoryId: string, fileSize: number, tags?: string[]): Promise<void> => {
    try {
      await AnalyticsService.trackMemoryCreated(memoryId, fileSize, tags);
    } catch (error) {
      console.error('Error tracking memory created:', error);
    }
  };

  const trackMemoryViewed = async (memoryId: string): Promise<void> => {
    try {
      await AnalyticsService.trackMemoryViewed(memoryId);
    } catch (error) {
      console.error('Error tracking memory viewed:', error);
    }
  };

  const trackSearch = async (query: string, resultsCount: number): Promise<void> => {
    try {
      await AnalyticsService.trackSearch(query, resultsCount);
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  };

  const trackSubscriptionStarted = async (planId: string, amount: number): Promise<void> => {
    try {
      await AnalyticsService.trackSubscriptionStarted(planId, amount);
    } catch (error) {
      console.error('Error tracking subscription started:', error);
    }
  };

  const trackSubscriptionCanceled = async (planId: string): Promise<void> => {
    try {
      await AnalyticsService.trackSubscriptionCanceled(planId);
    } catch (error) {
      console.error('Error tracking subscription canceled:', error);
    }
  };

  const trackFeatureUsed = async (feature: string): Promise<void> => {
    try {
      await AnalyticsService.trackFeatureUsed(feature);
    } catch (error) {
      console.error('Error tracking feature used:', error);
    }
  };

  const loadUserMetrics = async (userId?: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const metrics = await AnalyticsService.getUserMetrics(userId);
      setUserMetrics(metrics);
    } catch (err) {
      setError('Error al cargar métricas de usuario');
      console.error('Error loading user metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemMetrics = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const metrics = await AnalyticsService.getSystemMetrics();
      setSystemMetrics(metrics);
    } catch (err) {
      setError('Error al cargar métricas del sistema');
      console.error('Error loading system metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return {
    // Estado
    userMetrics,
    systemMetrics,
    isLoading,
    error,
    
    // Acciones
    trackPageView,
    trackMemoryCreated,
    trackMemoryViewed,
    trackSearch,
    trackSubscriptionStarted,
    trackSubscriptionCanceled,
    trackFeatureUsed,
    
    // Métricas
    loadUserMetrics,
    loadSystemMetrics,
    
    // Utilidades
    formatBytes,
    formatNumber,
  };
}

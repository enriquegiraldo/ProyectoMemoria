import { useState, useEffect } from 'react';
import { PaymentService, type PaymentResult, type SubscriptionStatus } from '../services/paymentService';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../lib/stripe';

export interface UsePaymentsReturn {
  // Estado
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Acciones
  createCheckoutSession: (planId: SubscriptionPlanId) => Promise<PaymentResult>;
  openBillingPortal: () => Promise<PaymentResult>;
  cancelSubscription: () => Promise<PaymentResult>;
  getCurrentPlanLimits: () => Promise<PaymentResult>;
  canCreateMemory: () => Promise<PaymentResult>;
  checkStorageLimit: (fileSize: number) => Promise<PaymentResult>;
  
  // Utilidades
  getPlanInfo: (planId: SubscriptionPlanId) => typeof SUBSCRIPTION_PLANS[SubscriptionPlanId];
  isPlanActive: boolean;
  currentPlan: SubscriptionPlanId;
}

export function usePayments(): UsePaymentsReturn {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar estado de suscripción al inicializar
  useEffect(() => {
    loadSubscriptionStatus();
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await PaymentService.getSubscriptionStatus();
      
      if (result.success) {
        setSubscription(result.data);
      } else {
        setError(result.error || 'Error al cargar suscripción');
      }
    } catch (err) {
      setError('Error inesperado al cargar suscripción');
      console.error('Error loading subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createCheckoutSession = async (planId: SubscriptionPlanId): Promise<PaymentResult> => {
    try {
      setError(null);
      const result = await PaymentService.createCheckoutSession(planId);
      
      if (result.success) {
        // Recargar estado después de crear sesión
        await loadSubscriptionStatus();
      } else {
        setError(result.error || 'Error al crear sesión de pago');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'Error inesperado al crear sesión de pago';
      setError(errorMessage);
      console.error('Error creating checkout session:', err);
      return { success: false, error: errorMessage };
    }
  };

  const openBillingPortal = async (): Promise<PaymentResult> => {
    try {
      setError(null);
      const result = await PaymentService.openBillingPortal();
      
      if (!result.success) {
        setError(result.error || 'Error al abrir portal de facturación');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'Error inesperado al abrir portal de facturación';
      setError(errorMessage);
      console.error('Error opening billing portal:', err);
      return { success: false, error: errorMessage };
    }
  };

  const cancelSubscription = async (): Promise<PaymentResult> => {
    try {
      setError(null);
      const result = await PaymentService.cancelSubscription();
      
      if (result.success) {
        // Recargar estado después de cancelar
        await loadSubscriptionStatus();
      } else {
        setError(result.error || 'Error al cancelar suscripción');
      }
      
      return result;
    } catch (err) {
      const errorMessage = 'Error inesperado al cancelar suscripción';
      setError(errorMessage);
      console.error('Error canceling subscription:', err);
      return { success: false, error: errorMessage };
    }
  };

  const getCurrentPlanLimits = async (): Promise<PaymentResult> => {
    try {
      setError(null);
      return await PaymentService.getCurrentPlanLimits();
    } catch (err) {
      const errorMessage = 'Error al obtener límites del plan';
      setError(errorMessage);
      console.error('Error getting plan limits:', err);
      return { success: false, error: errorMessage };
    }
  };

  const canCreateMemory = async (): Promise<PaymentResult> => {
    try {
      setError(null);
      return await PaymentService.canCreateMemory();
    } catch (err) {
      const errorMessage = 'Error al verificar límites de memoria';
      setError(errorMessage);
      console.error('Error checking memory limits:', err);
      return { success: false, error: errorMessage };
    }
  };

  const checkStorageLimit = async (fileSize: number): Promise<PaymentResult> => {
    try {
      setError(null);
      return await PaymentService.checkStorageLimit(fileSize);
    } catch (err) {
      const errorMessage = 'Error al verificar límites de almacenamiento';
      setError(errorMessage);
      console.error('Error checking storage limits:', err);
      return { success: false, error: errorMessage };
    }
  };

  const getPlanInfo = (planId: SubscriptionPlanId) => {
    return SUBSCRIPTION_PLANS[planId];
  };

  const isPlanActive = subscription?.isActive || false;
  const currentPlan = subscription?.plan || 'FREE';

  return {
    // Estado
    subscription,
    isLoading,
    error,
    
    // Acciones
    createCheckoutSession,
    openBillingPortal,
    cancelSubscription,
    getCurrentPlanLimits,
    canCreateMemory,
    checkStorageLimit,
    
    // Utilidades
    getPlanInfo,
    isPlanActive,
    currentPlan,
  };
}

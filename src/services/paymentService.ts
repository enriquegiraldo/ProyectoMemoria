import { supabase } from '../lib/supabase';
import { getStripe, SUBSCRIPTION_PLANS, type SubscriptionPlanId } from '../lib/stripe';

export interface PaymentResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface SubscriptionStatus {
  isActive: boolean;
  plan: SubscriptionPlanId;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export class PaymentService {
  // Crear sesión de checkout
  static async createCheckoutSession(planId: SubscriptionPlanId): Promise<PaymentResult> {
    try {
      const plan = SUBSCRIPTION_PLANS[planId];
      if (!plan.stripePriceId) {
        return {
          success: false,
          error: 'Plan no disponible para compra',
        };
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'Usuario no autenticado',
        };
      }

      // Obtener o crear customer de Stripe
      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      let customerId = profile?.stripe_customer_id;

      if (!customerId) {
        // Crear customer en Stripe
        const response = await fetch('/api/stripe/create-customer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            userId: user.id,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          return {
            success: false,
            error: 'Error al crear cliente',
          };
        }

        customerId = result.customerId;
      }

      // Crear sesión de checkout
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          customerId,
          planId,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Error al crear sesión de pago',
        };
      }

      // Redirigir a Stripe Checkout
      const stripe = await getStripe();
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: result.sessionId,
        });

        if (error) {
          return {
            success: false,
            error: error.message,
          };
        }
      }

      return {
        success: true,
        data: { sessionId: result.sessionId },
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return {
        success: false,
        error: 'Error interno del servidor',
      };
    }
  }

  // Obtener estado de suscripción
  static async getSubscriptionStatus(): Promise<PaymentResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'Usuario no autenticado',
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_end_date')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return {
          success: false,
          error: 'Perfil no encontrado',
        };
      }

      const subscriptionStatus: SubscriptionStatus = {
        isActive: profile.subscription_status === 'active',
        plan: profile.subscription_plan || 'FREE',
        currentPeriodEnd: profile.subscription_end_date ? new Date(profile.subscription_end_date) : null,
        cancelAtPeriodEnd: profile.subscription_status === 'canceled',
        stripeCustomerId: profile.stripe_customer_id,
        stripeSubscriptionId: profile.stripe_subscription_id,
      };

      return {
        success: true,
        data: subscriptionStatus,
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        success: false,
        error: 'Error al obtener estado de suscripción',
      };
    }
  }

  // Abrir portal de facturación
  static async openBillingPortal(): Promise<PaymentResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'Usuario no autenticado',
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single();

      if (!profile?.stripe_customer_id) {
        return {
          success: false,
          error: 'No se encontró información de facturación',
        };
      }

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: profile.stripe_customer_id,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Error al abrir portal de facturación',
        };
      }

      // Redirigir al portal
      window.location.href = result.url;

      return {
        success: true,
        data: { url: result.url },
      };
    } catch (error) {
      console.error('Error opening billing portal:', error);
      return {
        success: false,
        error: 'Error al abrir portal de facturación',
      };
    }
  }

  // Cancelar suscripción
  static async cancelSubscription(): Promise<PaymentResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          error: 'Usuario no autenticado',
        };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_subscription_id')
        .eq('id', user.id)
        .single();

      if (!profile?.stripe_subscription_id) {
        return {
          success: false,
          error: 'No se encontró suscripción activa',
        };
      }

      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: profile.stripe_subscription_id,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Error al cancelar suscripción',
        };
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: 'Error al cancelar suscripción',
      };
    }
  }

  // Obtener límites del plan actual
  static async getCurrentPlanLimits(): Promise<PaymentResult> {
    try {
      const subscriptionResult = await this.getSubscriptionStatus();
      if (!subscriptionResult.success) {
        return subscriptionResult;
      }

      const subscription = subscriptionResult.data as SubscriptionStatus;
      const plan = SUBSCRIPTION_PLANS[subscription.plan];

      return {
        success: true,
        data: {
          plan: subscription.plan,
          limits: plan.limits,
          isActive: subscription.isActive,
        },
      };
    } catch (error) {
      console.error('Error getting plan limits:', error);
      return {
        success: false,
        error: 'Error al obtener límites del plan',
      };
    }
  }

  // Verificar si el usuario puede crear más memorias
  static async canCreateMemory(): Promise<PaymentResult> {
    try {
      const limitsResult = await this.getCurrentPlanLimits();
      if (!limitsResult.success) {
        return limitsResult;
      }

      const { plan, limits, isActive } = limitsResult.data;
      
      if (!isActive && plan !== 'FREE') {
        return {
          success: false,
          error: 'Suscripción inactiva',
        };
      }

      if (limits.memories === -1) {
        return {
          success: true,
          data: { canCreate: true },
        };
      }

      // Contar memorias actuales
      const { data: { user } } = await supabase.auth.getUser();
      const { count } = await supabase
        .from('memories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const canCreate = (count || 0) < limits.memories;

      return {
        success: true,
        data: { 
          canCreate,
          currentCount: count || 0,
          limit: limits.memories,
        },
      };
    } catch (error) {
      console.error('Error checking memory creation limit:', error);
      return {
        success: false,
        error: 'Error al verificar límites',
      };
    }
  }

  // Verificar espacio de almacenamiento
  static async checkStorageLimit(fileSize: number): Promise<PaymentResult> {
    try {
      const limitsResult = await this.getCurrentPlanLimits();
      if (!limitsResult.success) {
        return limitsResult;
      }

      const { plan, limits, isActive } = limitsResult.data;
      
      if (!isActive && plan !== 'FREE') {
        return {
          success: false,
          error: 'Suscripción inactiva',
        };
      }

      if (limits.storage === -1) {
        return {
          success: true,
          data: { canUpload: true },
        };
      }

      // Calcular uso actual de almacenamiento
      const { data: { user } } = await supabase.auth.getUser();
      const { data: memories } = await supabase
        .from('memories')
        .select('file_size')
        .eq('user_id', user?.id);

      const currentUsage = memories?.reduce((total, memory) => total + (memory.file_size || 0), 0) || 0;
      const canUpload = currentUsage + fileSize <= limits.storage;

      return {
        success: true,
        data: { 
          canUpload,
          currentUsage,
          limit: limits.storage,
          fileSize,
        },
      };
    } catch (error) {
      console.error('Error checking storage limit:', error);
      return {
        success: false,
        error: 'Error al verificar límites de almacenamiento',
      };
    }
  }
}

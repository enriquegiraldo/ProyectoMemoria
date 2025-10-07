import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Configuración del servidor

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
});

// Configuración del cliente
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
};

// Tipos de suscripción
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Gratis',
    price: 0,
    features: [
      'Hasta 50 memorias',
      'Almacenamiento básico',
      'Soporte por email',
    ],
    limits: {
      memories: 50,
      storage: 1 * 1024 * 1024 * 1024, // 1GB
    },
  },
  BASIC: {
    id: 'basic',
    name: 'Básico',
    price: 9.99,
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: [
      'Hasta 500 memorias',
      '5GB de almacenamiento',
      'Búsqueda avanzada',
      'Soporte prioritario',
    ],
    limits: {
      memories: 500,
      storage: 5 * 1024 * 1024 * 1024, // 5GB
    },
  },
  PRO: {
    id: 'pro',
    name: 'Profesional',
    price: 19.99,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Memorias ilimitadas',
      '20GB de almacenamiento',
      'Búsqueda avanzada',
      'Analytics detallados',
      'Soporte 24/7',
      'API access',
    ],
    limits: {
      memories: -1, // Ilimitado
      storage: 20 * 1024 * 1024 * 1024, // 20GB
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Empresarial',
    price: 49.99,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      'Todo lo de Pro',
      'Almacenamiento ilimitado',
      'Soporte dedicado',
      'Integraciones personalizadas',
      'SLA garantizado',
    ],
    limits: {
      memories: -1, // Ilimitado
      storage: -1, // Ilimitado
    },
  },
} as const;

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS;

// Utilidades para manejo de pagos
export const createCheckoutSession = async ({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  priceId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) => {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
  });

  return session;
};

export const createCustomerPortalSession = async (customerId: string, returnUrl: string) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
};

export const getSubscription = async (subscriptionId: string) => {
  return await stripe.subscriptions.retrieve(subscriptionId);
};

export const cancelSubscription = async (subscriptionId: string): Promise<Stripe.Subscription>=> {
  return await stripe.subscriptions.cancel(subscriptionId);
};

export const updateSubscription = async (
  subscriptionId: string,
  priceId: string
) => {
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscriptionId,
        price: priceId,
      },
    ],
  });
};

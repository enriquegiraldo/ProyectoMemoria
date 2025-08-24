import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';
import { supabase } from '../../../../lib/supabase';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionChange(subscription: any) {
  try {
    const customerId = subscription.customer as string;
    const planId = subscription.metadata?.planId || 'BASIC';

    // Obtener el plan correspondiente
    const planMap: Record<string, string> = {
      'price_basic': 'BASIC',
      'price_pro': 'PRO',
      'price_enterprise': 'ENTERPRISE',
    };

    const priceId = subscription.items.data[0]?.price.id;
    const actualPlanId = planMap[priceId] || planId;

    // Actualizar perfil del usuario
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: actualPlanId,
        subscription_status: subscription.status,
        stripe_subscription_id: subscription.id,
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error('Error updating subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleSubscriptionCanceled(subscription: any) {
  try {
    const customerId = subscription.customer as string;

    // Actualizar perfil del usuario
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: 'FREE',
        subscription_status: 'canceled',
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error('Error updating canceled subscription:', error);
    }
  } catch (error) {
    console.error('Error handling subscription cancellation:', error);
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const customerId = invoice.customer as string;

    // Actualizar estado de pago
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        last_payment_date: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error('Error updating payment status:', error);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const customerId = invoice.customer as string;

    // Actualizar estado de pago fallido
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'past_due',
        last_payment_failed: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customerId);

    if (error) {
      console.error('Error updating failed payment status:', error);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

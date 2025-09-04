// src/app/api/stripe/cancel-subscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cancelSubscription } from '../../../../lib/stripe';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'subscriptionId es requerido' },
        { status: 400 }
      );
    }

    // Cancelar suscripción en Stripe
    const subscription = await cancelSubscription(subscriptionId);

    // Actualizar estado en la base de datos
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'canceled',
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('Error updating subscription status:', error);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar estado de suscripción' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Error al cancelar suscripción' },
      { status: 500 }
    );
  }
}


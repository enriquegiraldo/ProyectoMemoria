import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '../../../../lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { priceId, customerId, planId } = await request.json();

    if (!priceId || !customerId) {
      return NextResponse.json(
        { success: false, error: 'priceId y customerId son requeridos' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await createCheckoutSession({
      priceId,
      customerId,
      successUrl: `${baseUrl}/dashboard?success=true&plan=${planId}`,
      cancelUrl: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        planId: planId || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear sesión de pago' },
      { status: 500 }
    );
  }
}

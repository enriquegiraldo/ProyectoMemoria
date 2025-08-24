import { NextRequest, NextResponse } from 'next/server';
import { createCustomerPortalSession } from '../../../../lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'customerId es requerido' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await createCustomerPortalSession(
      customerId,
      `${baseUrl}/dashboard`
    );

    return NextResponse.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear sesión del portal' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configurar VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
};

webpush.setVapidDetails(
  'mailto:info@memoriaeterna.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(request: NextRequest) {
  try {
    const { subscription, notification } = await request.json();

    if (!subscription || !notification) {
      return NextResponse.json(
        { error: 'Subscription and notification are required' },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: notification.data || {},
      actions: [
        {
          action: 'view',
          title: 'Ver',
          icon: '/icons/view-24x24.png',
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/icons/close-24x24.png',
        },
      ],
    });

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const result = await webpush.sendNotification(pushSubscription, payload);

    return NextResponse.json({
      success: true,
      statusCode: result.statusCode,
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

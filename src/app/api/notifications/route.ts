import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NotificationService } from '../../../services/notificationService';

// GET - Obtener notificaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const notifications = await NotificationService.getUserNotifications(
      session.user.id,
      limit
    );

    const unreadCount = await NotificationService.getUnreadCount(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          limit,
          offset,
          total: notifications.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva notificación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, message, type, category, data, userId } = body;

    // Validar campos requeridos
    if (!title || !message || !type || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Solo administradores pueden crear notificaciones para otros usuarios
    const targetUserId = userId || session.user.id;
    if (userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const notificationId = await NotificationService.createNotification({
      user_id: targetUserId,
      title,
      message,
      type,
      category,
      data,
      is_read: false,
    });

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    // Enviar notificación push si está habilitado
    if (process.env.NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true') {
      await NotificationService.sendPushNotification(
        targetUserId,
        title,
        message,
        data
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: notificationId },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Marcar notificación como leída
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      const success = await NotificationService.markAllAsRead(session.user.id);
      return NextResponse.json({
        success,
        message: success ? 'All notifications marked as read' : 'Failed to mark notifications as read',
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const success = await NotificationService.markAsRead(notificationId);
    
    return NextResponse.json({
      success,
      message: success ? 'Notification marked as read' : 'Failed to mark notification as read',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

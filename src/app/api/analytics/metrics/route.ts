import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '../../../../services/analyticsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'user' or 'system'
    const userId = searchParams.get('userId');

    if (type === 'system') {
      const metrics = await AnalyticsService.getSystemMetrics();
      if (!metrics) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized or no data available' },
          { status: 403 }
        );
      }
      return NextResponse.json({ success: true, data: metrics });
    }

    if (type === 'user') {
      const metrics = await AnalyticsService.getUserMetrics(userId || undefined);
      if (!metrics) {
        return NextResponse.json(
          { success: false, error: 'No data available' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: metrics });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error getting analytics metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

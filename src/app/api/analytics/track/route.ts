import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    
    const {
      event,
      properties,
      user_id,
      timestamp,
      session_id,
      user_agent,
      page_url,
    } = eventData;

    if (!event) {
      return NextResponse.json(
        { success: false, error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Store event in analytics table
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event,
        properties: properties || {},
        user_id,
        timestamp: timestamp || new Date().toISOString(),
        session_id,
        user_agent,
        page_url,
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
      });

    if (error) {
      console.error('Error storing analytics event:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to store event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in analytics track endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

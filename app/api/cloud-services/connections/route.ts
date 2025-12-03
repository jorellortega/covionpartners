import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 Connections API - Auth check:', { user: !!user, error: authError });
    
    if (authError || !user) {
      console.log('🔍 No authenticated user, returning empty connections');
      return NextResponse.json([]);
    }

    // Get user's personal connections
    const { data: userConnections, error: userError } = await supabase
      .from('cloud_services')
      .select('*')
      .eq('user_id', user.id)
      .eq('connection_type', 'user')
      .eq('is_active', true);

    if (userError) {
      console.error('Error fetching user connections:', userError);
      return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
    }

    // Get system connections (available to all users)
    const { data: systemConnections, error: systemError } = await supabase
      .from('cloud_services')
      .select('*')
      .eq('connection_type', 'system')
      .is('user_id', null)
      .eq('is_active', true);

    if (systemError) {
      console.error('Error fetching system connections:', systemError);
      // Don't fail if system connections can't be fetched, just return user connections
    }

    // Combine user and system connections
    // System connections are marked so frontend knows they're read-only
    const allConnections = [
      ...(userConnections || []),
      ...(systemConnections || []).map(conn => ({
        ...conn,
        is_system: true, // Flag to indicate this is a system connection
      })),
    ];

    return NextResponse.json(allConnections);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
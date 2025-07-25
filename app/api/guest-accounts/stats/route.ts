import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GuestStats } from '@/types/guest-accounts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/guest-accounts/stats - Get guest account statistics for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get guest accounts for the organization
    const { data: guestAccounts, error: accountsError } = await supabase
      .from('guest_accounts')
      .select('*')
      .eq('organization_id', organizationId);

    if (accountsError) {
      console.error('Error fetching guest accounts:', accountsError);
      return NextResponse.json({ error: 'Failed to fetch guest accounts' }, { status: 500 });
    }

    // Get recent activities
    const { data: recentActivities, error: activitiesError } = await supabase
      .from('guest_activities')
      .select(`
        *,
        guest_account:guest_accounts(display_name, guest_code)
      `)
      .in('guest_account_id', guestAccounts?.map(ga => ga.id) || [])
      .order('created_at', { ascending: false })
      .limit(10);

    if (activitiesError) {
      console.error('Error fetching guest activities:', activitiesError);
      // Continue without activities
    }

    // Calculate statistics
    const totalGuests = guestAccounts?.length || 0;
    const activeGuests = guestAccounts?.filter(ga => ga.status === 'active').length || 0;
    const pausedGuests = guestAccounts?.filter(ga => ga.status === 'paused').length || 0;
    const frozenGuests = guestAccounts?.filter(ga => ga.status === 'frozen').length || 0;
    const droppedGuests = guestAccounts?.filter(ga => ga.status === 'dropped').length || 0;

    // Get total activities count
    const { count: totalActivities, error: countError } = await supabase
      .from('guest_activities')
      .select('*', { count: 'exact', head: true })
      .in('guest_account_id', guestAccounts?.map(ga => ga.id) || []);

    if (countError) {
      console.error('Error counting activities:', countError);
    }

    const stats: GuestStats = {
      total_guests: totalGuests,
      active_guests: activeGuests,
      paused_guests: pausedGuests,
      frozen_guests: frozenGuests,
      dropped_guests: droppedGuests,
      total_activities: totalActivities || 0,
      recent_activities: recentActivities || []
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error in GET /api/guest-accounts/stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
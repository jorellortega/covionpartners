import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { serviceId: string } }
) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = params;

    // Verify user owns this service connection
    const { data: connection, error: connectionError } = await supabase
      .from('cloud_services')
      .select('id')
      .eq('user_id', user.id)
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      return NextResponse.json({ error: 'Service connection not found' }, { status: 404 });
    }

    // Get files for this service
    const { data: files, error } = await supabase
      .from('cloud_service_files')
      .select('*')
      .eq('cloud_service_id', connection.id)
      .order('last_modified', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }

    return NextResponse.json(files || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

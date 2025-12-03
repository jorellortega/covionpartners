import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Admin endpoint to manage system-wide Dropbox connection
// This allows platform admins to connect a default Dropbox account for all users

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or CEO
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'ceo')) {
      return NextResponse.json({ error: 'Forbidden. Admin or CEO role required.' }, { status: 403 });
    }

    // Get system Dropbox connection
    const { data: connection, error } = await supabase
      .from('cloud_services')
      .select('*')
      .eq('service_id', 'dropbox')
      .eq('connection_type', 'system')
      .is('user_id', null)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching system Dropbox connection:', error);
      return NextResponse.json({ error: 'Failed to fetch connection' }, { status: 500 });
    }

    return NextResponse.json({ 
      connected: !!connection,
      connection: connection || null 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or CEO
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'ceo')) {
      return NextResponse.json({ error: 'Forbidden. Admin or CEO role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { access_token, refresh_token, account_info } = body;

    if (!access_token) {
      return NextResponse.json({ error: 'Missing access_token' }, { status: 400 });
    }

    // Upsert system Dropbox connection
    // First check if system connection exists
    const { data: existing } = await supabase
      .from('cloud_services')
      .select('id')
      .eq('service_id', 'dropbox')
      .eq('connection_type', 'system')
      .is('user_id', null)
      .single();

    let connection;
    let error;

    if (existing) {
      // Update existing system connection
      const result = await supabase
        .from('cloud_services')
        .update({
          access_token,
          refresh_token: refresh_token || null,
          account_info: account_info || {},
          scopes: ['files.metadata.write', 'files.content.write', 'files.content.read', 'account_info.read'],
          is_active: true,
          last_sync: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      connection = result.data;
      error = result.error;
    } else {
      // Insert new system connection
      const result = await supabase
        .from('cloud_services')
        .insert({
          service_id: 'dropbox',
          service_name: 'Dropbox',
          connection_type: 'system',
          user_id: null, // System connections have no user_id
          access_token,
          refresh_token: refresh_token || null,
          account_info: account_info || {},
          scopes: ['files.metadata.write', 'files.content.write', 'files.content.read', 'account_info.read'],
          is_active: true,
          last_sync: new Date().toISOString(),
        })
        .select()
        .single();
      connection = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error saving system Dropbox connection:', error);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      connection 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or CEO
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'ceo')) {
      return NextResponse.json({ error: 'Forbidden. Admin or CEO role required.' }, { status: 403 });
    }

    // Delete system Dropbox connection
    const { error } = await supabase
      .from('cloud_services')
      .delete()
      .eq('service_id', 'dropbox')
      .eq('connection_type', 'system')
      .is('user_id', null);

    if (error) {
      console.error('Error deleting system Dropbox connection:', error);
      return NextResponse.json({ error: 'Failed to delete connection' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function DELETE(
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

    // Find the connection
    const { data: connection, error: fetchError } = await supabase
      .from('cloud_services')
      .select('id, access_token, service_name')
      .eq('user_id', user.id)
      .eq('service_id', serviceId)
      .eq('is_active', true)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Revoke the OAuth token if possible
    try {
      await revokeToken(serviceId, connection.access_token);
    } catch (revokeError) {
      console.warn('Failed to revoke token:', revokeError);
      // Continue with disconnection even if token revocation fails
    }

    // Deactivate the connection
    const { error: updateError } = await supabase
      .from('cloud_services')
      .update({ 
        is_active: false,
        access_token: '',
        refresh_token: '',
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Error deactivating connection:', updateError);
      return NextResponse.json({ error: 'Failed to disconnect service' }, { status: 500 });
    }

    // Clean up associated files and sync logs
    await supabase
      .from('cloud_service_files')
      .delete()
      .eq('cloud_service_id', connection.id);

    await supabase
      .from('cloud_service_sync_logs')
      .delete()
      .eq('cloud_service_id', connection.id);

    return NextResponse.json({ message: 'Service disconnected successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function revokeToken(serviceId: string, accessToken: string): Promise<void> {
  const revokeUrls: { [key: string]: string } = {
    'google-drive': 'https://oauth2.googleapis.com/revoke',
    'dropbox': 'https://api.dropboxapi.com/2/auth/token/revoke',
    'onedrive': 'https://graph.microsoft.com/v1.0/me/revokeSignInSessions',
    'box': 'https://api.box.com/oauth2/revoke',
  };

  const revokeUrl = revokeUrls[serviceId];
  if (!revokeUrl) {
    throw new Error(`No revoke URL configured for service: ${serviceId}`);
  }

  const response = await fetch(revokeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token: accessToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to revoke token: ${response.statusText}`);
  }
}

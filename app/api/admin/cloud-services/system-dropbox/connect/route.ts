import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Admin endpoint to initiate OAuth flow for system Dropbox connection
// This redirects to Dropbox OAuth, then callback will save as system connection

const DROPBOX_CONFIG = {
  clientId: process.env.DROPBOX_CLIENT_ID,
  redirectUri: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api/admin/cloud-services/system-dropbox/callback'
    : `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/cloud-services/system-dropbox/callback`,
  scope: 'files.metadata.write files.content.write files.content.read account_info.read',
  authUrl: 'https://www.dropbox.com/oauth2/authorize',
};

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

    if (!DROPBOX_CONFIG.clientId) {
      return NextResponse.json({ error: 'Dropbox client ID not configured' }, { status: 500 });
    }

    // Generate state parameter (use 'system' as serviceId to distinguish from user connections)
    const state = `system:dropbox:${Date.now()}`;
    
    // Build OAuth URL
    const urlParams = new URLSearchParams();
    urlParams.set('client_id', DROPBOX_CONFIG.clientId);
    urlParams.set('redirect_uri', DROPBOX_CONFIG.redirectUri);
    urlParams.set('response_type', 'code');
    urlParams.set('scope', DROPBOX_CONFIG.scope);
    urlParams.set('state', state);
    urlParams.set('access_type', 'offline');
    urlParams.set('prompt', 'consent');

    const authUrl = `${DROPBOX_CONFIG.authUrl}?${urlParams.toString()}`;
    
    console.log('🔍 System Dropbox OAuth URL generated');
    console.log('🔍 Client ID:', DROPBOX_CONFIG.clientId);
    console.log('🔍 Redirect URI (raw):', DROPBOX_CONFIG.redirectUri);
    console.log('🔍 Redirect URI (encoded):', urlParams.get('redirect_uri'));
    console.log('🔍 Full OAuth URL:', authUrl);

    return NextResponse.json({ authUrl, state });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


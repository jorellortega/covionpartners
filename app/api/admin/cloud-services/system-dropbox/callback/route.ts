import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Callback handler for system Dropbox OAuth
// This saves the connection as a system-wide connection (connection_type = 'system')

export async function GET(request: NextRequest) {
  console.log('🔍 System Dropbox callback hit!');
  console.log('🔍 Full URL:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔍 Callback params:', { code: !!code, state, error });

    if (error) {
      console.error('🔍 OAuth error:', error);
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?error=oauth_error`);
    }

    if (!code || !state) {
      console.log('🔍 Missing code or state');
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?error=missing_parameters`);
    }

    // Parse state (format: system:dropbox:timestamp)
    const [connectionType, serviceId, timestamp] = state.split(':');
    console.log('🔍 Parsed state:', { connectionType, serviceId, timestamp });
    
    if (connectionType !== 'system' || serviceId !== 'dropbox') {
      console.log('🔍 Invalid state format for system connection');
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?error=invalid_state`);
    }

    // Use authenticated Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify user is authenticated and has admin/CEO role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('🔍 User not authenticated');
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?error=unauthorized`);
    }

    // Check if user is admin or CEO
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.role !== 'admin' && userData.role !== 'ceo')) {
      console.error('🔍 User does not have admin/CEO role');
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?error=forbidden`);
    }

    // Exchange code for tokens
    const redirectUri = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/admin/cloud-services/system-dropbox/callback'
      : `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/cloud-services/system-dropbox/callback`;

    console.log('🔍 Exchanging code for tokens with redirect_uri:', redirectUri);
    
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DROPBOX_CLIENT_ID!,
        client_secret: process.env.DROPBOX_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('🔍 Token exchange failed:', tokenResponse.status, errorText);
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();
    console.log('🔍 Token exchange successful');

    // Get user info from Dropbox
    const userInfoResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('🔍 Failed to get user info:', userInfoResponse.status, errorText);
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?error=user_info_failed`);
    }

    const userInfo = await userInfoResponse.json();
    console.log('🔍 System Dropbox account info:', {
      account_id: userInfo.account_id,
      email: userInfo.email,
      display_name: userInfo.name?.display_name
    });

    // Prepare account info
    const accountInfo = {
      name: userInfo.name?.display_name || 'System Dropbox',
      email: userInfo.email || 'system@dropbox.com',
      account_id: userInfo.account_id || 'unknown',
    };

    // Save as system connection
    // Check if system connection already exists
    const { data: existing } = await supabase
      .from('cloud_services')
      .select('id')
      .eq('service_id', 'dropbox')
      .eq('connection_type', 'system')
      .is('user_id', null)
      .single();

    let connection;
    let upsertError;

    if (existing) {
      // Update existing system connection
      const result = await supabase
        .from('cloud_services')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          account_info: accountInfo,
          scopes: ['files.metadata.write', 'files.content.write', 'files.content.read', 'account_info.read'],
          is_active: true,
          last_sync: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      connection = result.data;
      upsertError = result.error;
    } else {
      // Insert new system connection
      const result = await supabase
        .from('cloud_services')
        .insert({
          service_id: 'dropbox',
          service_name: 'Dropbox',
          connection_type: 'system',
          user_id: null, // System connections have no user_id
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          account_info: accountInfo,
          scopes: ['files.metadata.write', 'files.content.write', 'files.content.read', 'account_info.read'],
          is_active: true,
          last_sync: new Date().toISOString(),
        })
        .select()
        .single();
      connection = result.data;
      upsertError = result.error;
    }

    console.log('🔍 Saving system Dropbox connection...');

    if (upsertError) {
      console.error('🔍 Error saving system connection:', upsertError);
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?error=save_failed`);
    }

    console.log('🔍 System Dropbox connection saved successfully');

    const redirectUrl = `${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?success=connected`;
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('🔍 Unexpected error in system Dropbox callback:', error);
    return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/admin/cloud-services?error=unexpected_error`);
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('🔍 Dropbox callback hit!');
  console.log('🔍 Full URL:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔍 Callback params:', { code: !!code, state, error });

    if (error) {
      console.error('🔍 OAuth error:', error);
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=oauth_error`);
    }

    if (!code || !state) {
      console.log('🔍 Missing code or state');
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=missing_parameters`);
    }

    // Parse state to get user ID and service ID
    const [userId, serviceId, timestamp] = state.split(':');
    console.log('🔍 Parsed state:', { userId, serviceId, timestamp });
    
    if (!userId || !serviceId) {
      console.log('🔍 Invalid state format');
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=invalid_state`);
    }

    // Use authenticated Supabase client
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify the user matches the state (security check)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      console.error('🔍 User mismatch or not authenticated:', { 
        stateUserId: userId, 
        authUserId: user?.id,
        authError 
      });
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=unauthorized`);
    }

    // Exchange code for tokens
    const redirectUri = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/cloud-services/callback/dropbox'
      : `${process.env.NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/dropbox`;

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
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();
    console.log('🔍 Token exchange successful, access_token length:', tokens.access_token?.length);

    // Get user info from Dropbox
    console.log('🔍 Getting user info from Dropbox...');
    
    const userInfoResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    console.log('🔍 User info response status:', userInfoResponse.status);
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('🔍 Failed to get user info:', userInfoResponse.status, errorText);
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=user_info_failed`);
    }

    const userInfo = await userInfoResponse.json();
    console.log('🔍 User info received:', {
      account_id: userInfo.account_id,
      email: userInfo.email,
      display_name: userInfo.name?.display_name
    });

    // Prepare account info
    const accountInfo = {
      name: userInfo.name?.display_name || 'Dropbox User',
      email: userInfo.email || 'unknown@dropbox.com',
      account_id: userInfo.account_id || 'unknown',
    };

    console.log('🔍 Prepared account info:', accountInfo);

    // Use UPSERT to handle both insert and update cases
    const connectionData = {
      user_id: userId,
      service_id: serviceId,
      service_name: 'Dropbox',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      account_info: accountInfo,
      scopes: ['files.metadata.write', 'files.content.write', 'files.content.read', 'account_info.read'],
      is_active: true,
      last_sync: new Date().toISOString(),
    };

    console.log('🔍 Upserting connection data...');
    
    const { data: connection, error: upsertError } = await supabase
      .from('cloud_services')
      .upsert(connectionData, {
        onConflict: 'user_id,service_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (upsertError) {
      console.error('🔍 Error upserting connection:', upsertError);
      return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=update_failed`);
    }

    console.log('🔍 Connection saved successfully:', {
      id: connection?.id,
      service_id: connection?.service_id,
      is_active: connection?.is_active
    });

    const redirectUrl = `${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?success=connected`;
    console.log('🔍 Redirecting to:', redirectUrl);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('🔍 Unexpected error in Dropbox callback:', error);
    return NextResponse.redirect(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=unexpected_error`);
  }
}

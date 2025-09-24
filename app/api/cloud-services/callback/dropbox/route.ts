import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=oauth_error`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=missing_parameters`);
    }

    // Parse state to get user ID and service ID
    const [userId, serviceId, timestamp] = state.split(':');
    if (!userId || !serviceId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=invalid_state`);
    }

    const supabase = createClient();

    // Exchange code for tokens
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
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/dropbox`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get user info from Dropbox
    const userInfoResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', await userInfoResponse.text());
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=user_info_failed`);
    }

    const userInfo = await userInfoResponse.json();

    // Update the cloud service connection
    const { error: updateError } = await supabase
      .from('cloud_services')
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        account_info: {
          name: userInfo.name.display_name,
          email: userInfo.email,
          account_id: userInfo.account_id,
        },
        is_active: true,
        last_sync: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('service_id', serviceId);

    if (updateError) {
      console.error('Error updating connection:', updateError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=update_failed`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?success=connected`);
  } catch (error) {
    console.error('Unexpected error in Dropbox callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/cloud-services?error=unexpected_error`);
  }
}

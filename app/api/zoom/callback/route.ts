import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/zoom/callback`
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Zoom token exchange failed:', tokenData);
      return NextResponse.json({ error: 'Failed to exchange code for token' }, { status: 400 });
    }

    // Get user info from Zoom
    const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      console.error('Failed to get Zoom user info:', userData);
      return NextResponse.json({ error: 'Failed to get user info' }, { status: 400 });
    }

    // Store the tokens in database
    const { error: insertError } = await supabase
      .from('user_zoom_auth')
      .upsert({
        user_id: state, // We'll pass user_id as state parameter
        zoom_user_id: userData.id,
        zoom_email: userData.email,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      });

    if (insertError) {
      console.error('Error storing Zoom tokens:', insertError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/workmode?zoom_auth=error`);
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/workmode?zoom_auth=success`);
  } catch (error) {
    console.error('Zoom callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/workmode?zoom_auth=error`);
  }
} 
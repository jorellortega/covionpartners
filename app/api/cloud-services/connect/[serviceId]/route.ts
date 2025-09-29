import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// OAuth configuration for different services
const OAUTH_CONFIG = {
  'google-drive': {
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/google-drive`,
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  'dropbox': {
    clientId: process.env.DROPBOX_CLIENT_ID,
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/dropbox`,
    scope: 'files.metadata.write files.content.write files.content.read account_info.read',
    authUrl: 'https://www.dropbox.com/oauth2/authorize',
  },
  'onedrive': {
    clientId: process.env.ONEDRIVE_CLIENT_ID,
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/onedrive`,
    scope: 'Files.Read User.Read',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  },
  'box': {
    clientId: process.env.BOX_CLIENT_ID,
    redirectUri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/box`,
    scope: 'root_readonly',
    authUrl: 'https://account.box.com/api/oauth2/authorize',
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceId } = await params;
    const config = OAUTH_CONFIG[serviceId as keyof typeof OAUTH_CONFIG];

    if (!config) {
      return NextResponse.json({ error: 'Unsupported service' }, { status: 400 });
    }

    // Check if user already has a connection for this service
    const { data: existingConnection } = await supabase
      .from('cloud_services')
      .select('id, is_active, access_token')
      .eq('user_id', user.id)
      .eq('service_id', serviceId)
      .single();

    // Generate state parameter for security
    const state = `${user.id}:${serviceId}:${Date.now()}`;
    
    let stateError;
    if (existingConnection) {
      // Update existing connection (reset for new OAuth flow)
      console.log('🔍 Updating existing connection for service:', serviceId);
      const { error } = await supabase
        .from('cloud_services')
        .update({
          access_token: '', // Will be filled after OAuth callback
          refresh_token: null,
          account_info: {},
          scopes: config.scope.split(' '),
          is_active: false, // Will be activated after successful OAuth
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);
      stateError = error;
    } else {
      // Create new connection
      console.log('🔍 Creating new connection for service:', serviceId);
      const { error } = await supabase
        .from('cloud_services')
        .insert({
          user_id: user.id,
          service_id: serviceId,
          service_name: getServiceName(serviceId),
          access_token: '', // Will be filled after OAuth callback
          account_info: {},
          scopes: config.scope.split(' '),
          is_active: false, // Will be activated after successful OAuth
        });
      stateError = error;
    }

    if (stateError) {
      console.error('Error storing OAuth state:', stateError);
      return NextResponse.json({ error: 'Failed to initiate connection' }, { status: 500 });
    }

    // Build OAuth URL
    console.log('🔍 Building OAuth URL for service:', serviceId);
    console.log('🔍 Config:', config);
    console.log('🔍 Redirect URI:', config.redirectUri);
    
    const authUrl = new URL(config.authUrl);
    authUrl.searchParams.set('client_id', config.clientId!);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scope);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline'); // For Google Drive refresh tokens
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen for Google Drive

    const finalUrl = authUrl.toString();
    console.log('🔍 Final OAuth URL:', finalUrl);

    return NextResponse.json({ authUrl: finalUrl });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getServiceName(serviceId: string): string {
  const serviceNames: { [key: string]: string } = {
    'google-drive': 'Google Drive',
    'dropbox': 'Dropbox',
    'onedrive': 'OneDrive',
    'box': 'Box',
  };
  return serviceNames[serviceId] || serviceId;
}

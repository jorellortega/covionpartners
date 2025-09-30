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
    redirectUri: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000/api/cloud-services/callback/dropbox'
      : `${process.env.NEXT_PUBLIC_SITE_URL}/api/cloud-services/callback/dropbox`,
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
    const { serviceId } = await params;
    
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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

    // Debug environment variables
    console.log('🔍 NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);
    console.log('🔍 Config redirectUri:', config.redirectUri);
    console.log('🔍 Config clientId:', config.clientId);
    console.log('🔍 Config scope:', config.scope);
    console.log('🔍 State:', state);
    
    // Build OAuth URL with proper encoding
    const urlParams = new URLSearchParams();
    urlParams.set('client_id', config.clientId!);
    urlParams.set('redirect_uri', config.redirectUri);
    urlParams.set('response_type', 'code');
    urlParams.set('scope', config.scope);
    urlParams.set('state', state);
    urlParams.set('access_type', 'offline');
    urlParams.set('prompt', 'consent');

    const authUrl = `${config.authUrl}?${urlParams.toString()}`;
    
    console.log('🔍 OAuth URL generated for', serviceId);
    console.log('🔍 Final URL:', authUrl);
    console.log('🔍 Redirect URI:', config.redirectUri);
    console.log('🔍 URLSearchParams toString():', urlParams.toString());

    return NextResponse.json({ authUrl });
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

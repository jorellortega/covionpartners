import { NextRequest, NextResponse } from 'next/server';
import { getSystemCloudStorageConnection } from '@/lib/cloud-storage';

/**
 * Get a temporary upload URL for direct client-to-Dropbox upload
 * This bypasses Vercel's request body size limits
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, fileSize } = body;

    if (!path) {
      return NextResponse.json({ error: 'Path parameter required' }, { status: 400 });
    }

    const connection = await getSystemCloudStorageConnection('dropbox');
    if (!connection) {
      return NextResponse.json({ error: 'System Dropbox not connected' }, { status: 400 });
    }

    // For files larger than 150MB, use upload session
    // For smaller files, we can use direct upload
    const useSession = fileSize > 150 * 1024 * 1024; // 150MB

    if (useSession) {
      // Start an upload session and return session info
      // Client will upload directly to Dropbox
      const response = await fetch('https://content.dropboxapi.com/2/files/upload_session/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({ close: false }),
        },
        body: new ArrayBuffer(0), // Empty body to start session
      });

      if (!response.ok) {
        const error = await response.text();
        return NextResponse.json({ error: 'Failed to start upload session' }, { status: response.status });
      }

      const sessionData = await response.json();
      
      return NextResponse.json({
        uploadType: 'session',
        sessionId: sessionData.session_id,
        path: path,
        accessToken: connection.access_token, // Client needs this for direct upload
      });
    } else {
      // For smaller files, return upload URL info
      // Note: Dropbox doesn't have pre-signed URLs like S3
      // We'll use the access token on client side for direct upload
      return NextResponse.json({
        uploadType: 'direct',
        path: path,
        accessToken: connection.access_token,
        uploadUrl: 'https://content.dropboxapi.com/2/files/upload',
      });
    }
  } catch (error) {
    console.error('Error getting upload URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSystemCloudStorageConnection } from '@/lib/cloud-storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path parameter required' }, { status: 400 });
    }

    const connection = await getSystemCloudStorageConnection('dropbox');
    if (!connection) {
      return NextResponse.json({ error: 'System Dropbox not connected' }, { status: 400 });
    }

    // Download file from Dropbox
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Dropbox-API-Arg': JSON.stringify({
          path: path,
        }),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Dropbox download error:', error);
      return NextResponse.json({ error: 'Failed to download file' }, { status: response.status });
    }

    // Get filename from response header
    const apiArg = response.headers.get('dropbox-api-result');
    let filename = 'download';
    if (apiArg) {
      try {
        const metadata = JSON.parse(apiArg);
        filename = metadata.name || 'download';
      } catch (e) {
        // Use default filename
      }
    }

    // Get file content
    const blob = await response.blob();

    // Return file with proper headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


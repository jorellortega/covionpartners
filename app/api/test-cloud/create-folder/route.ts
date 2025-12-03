import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSystemCloudStorageConnection } from '@/lib/cloud-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path } = body;

    if (!path) {
      return NextResponse.json({ error: 'Path parameter required' }, { status: 400 });
    }

    const connection = await getSystemCloudStorageConnection('dropbox');
    if (!connection) {
      return NextResponse.json({ error: 'System Dropbox not connected' }, { status: 400 });
    }

    // Create folder in Dropbox
    const response = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: path,
        autorename: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // If folder already exists, that's okay
      if (error.error?.path?.is_conflict) {
        return NextResponse.json({ success: true, message: 'Folder already exists', metadata: null });
      }
      console.error('Dropbox create folder error:', error);
      return NextResponse.json({ error: error.error_summary || 'Failed to create folder' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, metadata: data.metadata });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSystemCloudStorageConnection } from '@/lib/cloud-storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';

    const connection = await getSystemCloudStorageConnection('dropbox');
    if (!connection) {
      return NextResponse.json({ error: 'System Dropbox not connected' }, { status: 400 });
    }

    // List files/folders in Dropbox
    const response = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: path || '',
        recursive: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Dropbox API error:', error);
      return NextResponse.json({ error: error.error_summary || 'Failed to list files' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


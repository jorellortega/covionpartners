import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSystemCloudStorageConnection } from '@/lib/cloud-storage';

export async function GET(request: NextRequest) {
  try {
    const connection = await getSystemCloudStorageConnection('dropbox');
    return NextResponse.json({ connected: !!connection });
  } catch (error) {
    console.error('Error checking connection:', error);
    return NextResponse.json({ connected: false });
  }
}


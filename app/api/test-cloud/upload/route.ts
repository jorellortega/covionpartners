import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSystemCloudStorageConnection } from '@/lib/cloud-storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const connection = await getSystemCloudStorageConnection('dropbox');
    if (!connection) {
      return NextResponse.json({ error: 'System Dropbox not connected' }, { status: 400 });
    }

    // Ensure path starts with /
    const uploadPath = path.startsWith('/') ? path : `/${path}`;
    // If path doesn't end with filename, append it
    const finalPath = uploadPath.endsWith(file.name) 
      ? uploadPath 
      : `${uploadPath}/${file.name}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Dropbox using upload session for large files
    const fileSize = buffer.length;
    const chunkSize = 4 * 1024 * 1024; // 4MB chunks

    if (fileSize <= chunkSize) {
      // Small file - direct upload
      const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            path: finalPath,
            mode: 'overwrite',
            autorename: true,
            mute: false,
          }),
        },
        body: buffer,
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Dropbox upload error:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json({ success: true, file: data });
    } else {
      // Large file - use upload session
      // Start upload session
      const sessionStartResponse = await fetch('https://content.dropboxapi.com/2/files/upload_session/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({ close: false }),
        },
        body: buffer.slice(0, chunkSize),
      });

      if (!sessionStartResponse.ok) {
        const error = await sessionStartResponse.text();
        return NextResponse.json({ error: 'Failed to start upload session' }, { status: sessionStartResponse.status });
      }

      const sessionData = await sessionStartResponse.json();
      let sessionId = sessionData.session_id;
      let offset = chunkSize;

      // Upload remaining chunks
      while (offset < fileSize) {
        const chunk = buffer.slice(offset, Math.min(offset + chunkSize, fileSize));
        const isLastChunk = offset + chunk.length >= fileSize;

        const appendResponse = await fetch('https://content.dropboxapi.com/2/files/upload_session/append_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${connection.access_token}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              cursor: {
                session_id: sessionId,
                offset: offset,
              },
              close: isLastChunk,
            }),
          },
          body: chunk,
        });

        if (!appendResponse.ok) {
          const error = await appendResponse.text();
          return NextResponse.json({ error: 'Failed to upload chunk' }, { status: appendResponse.status });
        }

        offset += chunk.length;
      }

      // Finish upload session
      const finishResponse = await fetch('https://content.dropboxapi.com/2/files/upload_session/finish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            cursor: {
              session_id: sessionId,
              offset: fileSize,
            },
            commit: {
              path: finalPath,
              mode: 'overwrite',
              autorename: true,
              mute: false,
            },
          }),
        },
      });

      if (!finishResponse.ok) {
        const error = await finishResponse.text();
        return NextResponse.json({ error: 'Failed to finish upload' }, { status: finishResponse.status });
      }

      const data = await finishResponse.json();
      return NextResponse.json({ success: true, file: data });
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


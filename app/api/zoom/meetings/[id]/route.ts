import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No valid authorization token' }, { status: 401 });
  }

  const accessToken = authHeader.replace('Bearer ', '');
  const meetingId = params.id;

  try {
    const response = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Zoom API error:', error);
      return NextResponse.json({ error: 'Failed to delete meeting' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Zoom meeting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No valid authorization token' }, { status: 401 });
  }

  const accessToken = authHeader.replace('Bearer ', '');

  try {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Zoom API error:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ meetings: data.meetings || [] });
  } catch (error) {
    console.error('Error fetching Zoom meetings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'No valid authorization token' }, { status: 401 });
  }

  const accessToken = authHeader.replace('Bearer ', '');
  const body = await request.json();

  try {
    const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Zoom API error:', error);
      return NextResponse.json({ error: 'Failed to create meeting' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
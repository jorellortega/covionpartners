import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fetch messages between two users
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const user1 = searchParams.get('user1');
  const user2 = searchParams.get('user2');
  if (!user1 || !user2) {
    return NextResponse.json({ error: 'Missing user IDs' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user1},receiver_id.eq.${user2}),and(sender_id.eq.${user2},receiver_id.eq.${user1})`)
    .order('created_at', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ messages: data });
}

// Send a new message
export async function POST(req: NextRequest) {
  try {
    const { subject, content, sender_id, receiver_id } = await req.json();
    if (!content || !sender_id || !receiver_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { error } = await supabase.from('messages').insert([
      {
        subject: subject || null,
        content,
        sender_id,
        receiver_id,
        read: false,
      },
    ]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
} 
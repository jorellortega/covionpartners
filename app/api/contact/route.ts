import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { subject, message, category, email, user_id, name, company } = await req.json();
    if (!subject || !message || !email) {
      return NextResponse.json({ error: 'Subject, message, and email are required.' }, { status: 400 });
    }
    const { error } = await supabase.from('contact_messages').insert([
      {
        subject,
        message,
        category,
        email,
        user_id: user_id || null,
        name: name || null,
        company: company || null,
        status: 'new',
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
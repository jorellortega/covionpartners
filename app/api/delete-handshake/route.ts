import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Delete the file from storage
  const { error: storageError } = await supabase.storage
    .from('partnerfiles')
    .remove(['branding/handshake.png']);

  // Set all branding entries to inactive
  await supabase.from('branding').update({ active: false }).eq('active', true);

  if (storageError) {
    return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 
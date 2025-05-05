import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const formData = await req.formData();
  const file = formData.get('handshake');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('partnerfiles')
    .upload('branding/handshake.png', file as File, { upsert: true, contentType: (file as File).type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get public URL
  const { data: publicUrlData } = supabase.storage.from('partnerfiles').getPublicUrl('branding/handshake.png');
  const logoUrl = publicUrlData.publicUrl;

  // Deactivate old logos and insert new one as active
  await supabase.from('branding').update({ active: false }).eq('active', true);
  await supabase.from('branding').insert({ logo_url: logoUrl, active: true });

  return NextResponse.json({ url: logoUrl });
} 
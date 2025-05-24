import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const testPayload = {
    project_id: 'd9f23cec-901f-45b8-a871-29567585bb12',
    user_id: '5fb18f0a-0ce2-4eb7-8db4-a54995737dd6',
    amount: 1.23,
    currency: 'usd',
    status: 'succeeded',
    message: 'Test insert',
    stripe_payment_intent_id: 'test_intent_id',
    stripe_fee: 0.01,
    platform_fee: 0.01,
    created_at: new Date().toISOString(),
    metadata: { test: true }
  };
  console.log('[TEST SUPPORT INSERT] Payload:', testPayload);
  const { data, error, status, statusText } = await serviceSupabase
    .from('public_supports')
    .insert(testPayload)
    .select()
    .single();
  console.log('[TEST SUPPORT INSERT] Response:', { data, error, status, statusText });
  if (error) {
    return NextResponse.json({ error, status, statusText }, { status: 500 });
  }
  return NextResponse.json({ data }, { status: 200 });
} 
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('Incoming body:', body);

    const {
      stripeAccountId,
      externalAccount,
      routing_number,
      account_number,
      account_holder_name,
      account_holder_type,
      bank_account_type
    } = body;

    if (!externalAccount || !externalAccount.id) {
      return NextResponse.json({ error: 'Missing or invalid externalAccount' }, { status: 400 });
    }

    const insertPayload = {
      user_id: session.user.id,
      type: 'stripe',
      status: 'pending',
      details: externalAccount,
      is_default: false,
      stripe_payment_method_id: externalAccount.id,
      stripe_account_id: stripeAccountId,
      account_holder_name,
      account_holder_type,
      bank_name: externalAccount.bank_name || 'STRIPE TEST BANK',
      bank_routing_number: routing_number,
      bank_account_last4: account_number.slice(-4),
      bank_account_type,
      currency: 'usd',
      country: 'US',
      verification_status: 'pending',
      instant_payouts_eligible: false
    };

    const { error: insertError } = await supabase
      .from('payment_methods')
      .insert(insertPayload);

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save payment method' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Unhandled error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
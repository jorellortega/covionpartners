import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-03-31.basil' });

export async function POST(request: Request) {
  try {
    const { amount, external_account_id } = await request.json();

    // Validate input
    if (!amount || !external_account_id || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Get the current user from Supabase session
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user's Stripe Connect account ID from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single();
    if (userError || !userData?.stripe_connect_account_id) {
      return NextResponse.json({ error: 'No connected account found' }, { status: 400 });
    }
    const connectedAccountId = userData.stripe_connect_account_id;

    // Create a payout to the external account (bank account)
    const payout = await stripe.payouts.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination: external_account_id,
      method: 'standard',
      metadata: {
        type: 'withdrawal',
        external_account_id: external_account_id
      }
    }, {
      stripeAccount: connectedAccountId
    });

    return NextResponse.json({ success: true, payout });
  } catch (error: any) {
    console.error('Stripe payout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
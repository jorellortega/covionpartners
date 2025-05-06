import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

export async function GET() {
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

  // Fetch the available balance from Stripe
  try {
    const balance = await stripe.balance.retrieve({ stripeAccount: connectedAccountId });
    // Find the available USD balance
    const available = balance.available.find(b => b.currency === 'usd');
    return NextResponse.json({ available: available ? available.amount / 100 : 0 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch Stripe balance' }, { status: 500 });
  }
} 
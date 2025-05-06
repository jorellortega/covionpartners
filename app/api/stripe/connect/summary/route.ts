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

  try {
    // Get balances
    const balance = await stripe.balance.retrieve({ stripeAccount: connectedAccountId });
    const available = balance.available.find(b => b.currency === 'usd')?.amount || 0;
    const pending = balance.pending.find(b => b.currency === 'usd')?.amount || 0;

    // Get payouts
    const payouts = await stripe.payouts.list({ limit: 5 }, { stripeAccount: connectedAccountId });
    const inTransit = payouts.data
      .filter(p => p.status === 'in_transit' && p.currency === 'usd')
      .reduce((sum, p) => sum + p.amount, 0);
    const upcomingPayout = payouts.data
      .find(p => p.status === 'pending' && p.currency === 'usd');

    // Get account info for payout schedule and destination
    const account = await stripe.accounts.retrieve(connectedAccountId);
    let payoutSchedule = account.settings?.payouts?.schedule?.interval || 'manual';
    let payoutDestination = null;
    if (account.external_accounts && account.external_accounts.data.length > 0) {
      const ext = account.external_accounts.data[0];
      payoutDestination = {
        bank_name: ext.object === 'bank_account' ? ext.bank_name : undefined,
        last4: ext.last4,
      };
    }

    return NextResponse.json({
      in_transit: inTransit / 100,
      upcoming_payout: upcomingPayout ? upcomingPayout.amount / 100 : 0,
      upcoming_payout_estimated_arrival: upcomingPayout ? upcomingPayout.arrival_date * 1000 : null,
      available: available / 100,
      pending: pending / 100,
      total: (available + pending) / 100,
      payout_schedule: payoutSchedule,
      payout_destination: payoutDestination,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch Stripe summary' }, { status: 500 });
  }
} 
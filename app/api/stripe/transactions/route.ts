import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Check session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user;
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's Stripe customer ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.stripe_customer_id) {
    return NextResponse.json({ error: 'No Stripe customer ID found' }, { status: 400 });
  }

  try {
    // Fetch all invoices for the customer
    const invoices = await stripe.invoices.list({
      customer: userData.stripe_customer_id,
      limit: 100,
    });
    // Fetch all charges for the customer
    const charges = await stripe.charges.list({
      customer: userData.stripe_customer_id,
      limit: 100,
    });

    // Normalize invoices (only include paid invoices)
    const invoiceTxs = invoices.data
      .filter(inv => inv.status === 'paid' && inv.amount_paid > 0)
      .map(inv => ({
        id: inv.id,
        type: 'invoice',
        amount: inv.amount_paid / 100,
        currency: inv.currency,
        status: inv.status,
        date: new Date((inv.status_transitions?.paid_at || inv.created) * 1000).toISOString(),
        description: inv.lines.data[0]?.description || 'Subscription Invoice',
        source: 'stripe',
      }));

    // Normalize charges
    const chargeTxs = charges.data.map(ch => ({
      id: ch.id,
      type: 'charge',
      amount: ch.amount / 100 * (ch.refunded ? -1 : 1),
      currency: ch.currency,
      status: ch.status,
      date: new Date(ch.created * 1000).toISOString(),
      description: ch.description || 'Stripe Charge',
      source: 'stripe',
    }));

    // Merge and deduplicate (avoid double-counting charges that are linked to invoices)
    const allTxs = [
      ...invoiceTxs,
      ...chargeTxs.filter(ch => !invoices.data.some(inv => (inv as any).charge === ch.id))
    ];

    return NextResponse.json({ transactions: allTxs });
  } catch (err) {
    console.error('Stripe fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch Stripe transactions' }, { status: 500 });
  }
} 
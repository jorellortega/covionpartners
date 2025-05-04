import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
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

  // Get user's subscription_id and price_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('subscription_id, stripe_customer_id, subscription_tier')
    .eq('id', user.id)
    .single();

  if (userError) {
    return NextResponse.json({ error: 'No subscription info found' }, { status: 400 });
  }

  try {
    let subscription = null;
    if (userData?.subscription_id) {
      subscription = await stripe.subscriptions.retrieve(userData.subscription_id);
    }

    // If subscription is active and cancel_at_period_end, reactivate
    if (subscription && subscription.status === 'active' && subscription.cancel_at_period_end) {
      const updated = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });
      await supabase.from('users').update({
        subscription_status: updated.status
      }).eq('id', user.id);
      return NextResponse.json({ success: true, status: updated.status });
    }

    // If subscription is canceled, create a new one
    if (!subscription || subscription.status === 'canceled') {
      // Use the same price as before, or fallback to manager plan
      let priceId = process.env.NEXT_PUBLIC_STRIPE_PARTNER_PRICE_ID;
      if (subscription && subscription.items.data[0]?.price?.id) {
        priceId = subscription.items.data[0].price.id;
      }
      if (!priceId) {
        return NextResponse.json({ error: 'No price ID found for new subscription' }, { status: 400 });
      }
      if (!userData.stripe_customer_id) {
        return NextResponse.json({ error: 'No Stripe customer ID found' }, { status: 400 });
      }
      const newSub = await stripe.subscriptions.create({
        customer: userData.stripe_customer_id,
        items: [{ price: priceId }],
        expand: ['latest_invoice'],
      });
      await supabase.from('users').update({
        subscription_id: newSub.id,
        subscription_status: newSub.status,
        subscription_tier: userData.subscription_tier || 'manager',
        trial_end: newSub.trial_end ? new Date(newSub.trial_end * 1000).toISOString() : null
      }).eq('id', user.id);
      return NextResponse.json({ success: true, status: newSub.status });
    }

    return NextResponse.json({ error: 'Subscription is not canceling or canceled' }, { status: 400 });
  } catch (err) {
    console.error('Stripe reactivate error:', err);
    return NextResponse.json({ error: 'Failed to reactivate subscription' }, { status: 500 });
  }
} 
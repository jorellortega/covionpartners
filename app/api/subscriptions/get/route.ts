import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    // Get authenticated user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return NextResponse.json({ error: 'Session error', details: sessionError }, { status: 401 });
    }
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription details from the database
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_id, subscription_status, subscription_tier')
      .eq('id', user.id)
      .single();

    if (!userData?.subscription_id) {
      return NextResponse.json({ subscription: null });
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(userData.subscription_id) as Stripe.Subscription;
    // Get the product details for the subscription
    const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);

    // Extract current_period_end from the correct location
    let currentPeriodEnd = null;
    if (typeof (subscription as any).current_period_end === 'number') {
      currentPeriodEnd = (subscription as any).current_period_end;
    } else if (
      subscription.items &&
      subscription.items.data &&
      subscription.items.data.length > 0 &&
      typeof subscription.items.data[0].current_period_end === 'number'
    ) {
      currentPeriodEnd = subscription.items.data[0].current_period_end;
    }

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: currentPeriodEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        tier_name: product.name,
        price_id: subscription.items.data[0].price.id,
      },
    });
  } catch (err) {
    console.error('Error fetching subscription:', err);
    // Avoid 500 on stale subscription_id or Stripe errors — page can load without subscription block
    return NextResponse.json({ subscription: null });
  }
} 
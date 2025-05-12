import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = session.user;

    // 1. Try to get subscription_id from users table
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_id')
      .eq('id', user.id)
      .single();

    let subscriptionId = userData?.subscription_id;

    // 2. If not found, get latest from subscriptions table
    if (!subscriptionId) {
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      subscriptionId = subData?.id;
    }

    if (!subscriptionId) {
      return NextResponse.json({ subscription: null });
    }

    // 3. Fetch from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
    const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);

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
        plan: subscription.items.data[0].price.nickname,
        // Add more fields as needed
      },
    });
  } catch (err) {
    console.error('Error fetching subscription:', err);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
} 
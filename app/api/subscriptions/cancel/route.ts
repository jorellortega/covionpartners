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

  // Get user's subscription_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('subscription_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.subscription_id) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
  }

  try {
    // Cancel the subscription at period end
    const canceled = await stripe.subscriptions.update(userData.subscription_id, {
      cancel_at_period_end: true,
    });

    // Update user's subscription_status in DB
    await supabase.from('users').update({
      subscription_status: canceled.status
    }).eq('id', user.id);

    return NextResponse.json({ success: true, status: canceled.status });
  } catch (err) {
    console.error('Stripe cancel error:', err);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
} 
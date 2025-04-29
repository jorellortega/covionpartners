import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

export async function POST(req: Request) {
  // Correct cookies usage for Next.js 14/15
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  // Check session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    console.error('Session error:', sessionError);
    return NextResponse.json({ error: 'Session error', details: sessionError }, { status: 401 });
  }
  if (!session) {
    console.error('No session found');
    return NextResponse.json({ error: 'No session found' }, { status: 401 });
  }

  const user = session.user;
  if (!user) {
    console.error('No user in session');
    return NextResponse.json({ error: 'No user in session' }, { status: 401 });
  }

  const { paymentMethodId } = await req.json();

  // Get or create Stripe customer ID
  let stripeCustomerId = user.user_metadata?.stripe_customer_id;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id }
    });
    stripeCustomerId = customer.id;
    await supabase.auth.updateUser({ data: { stripe_customer_id: stripeCustomerId } });
  }

  // Attach the payment method to the customer
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: stripeCustomerId,
  });

  // Set as default payment method
  await stripe.customers.update(stripeCustomerId, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });

  // Save payment method details to Supabase
  const { error: dbError } = await supabase
    .from('payment_methods')
    .insert({
      user_id: user.id,
      type: 'stripe',
      status: 'active',
      stripe_payment_method_id: paymentMethod.id,
      card_brand: paymentMethod.card?.brand,
      card_last4: paymentMethod.card?.last4,
      card_exp_month: paymentMethod.card?.exp_month,
      card_exp_year: paymentMethod.card?.exp_year,
      is_default: true,
      details: {
        card: paymentMethod.card,
        type: paymentMethod.type,
        billing_details: paymentMethod.billing_details
      }
    });

  if (dbError) {
    console.error('Database error:', dbError);
    return NextResponse.json({ error: 'Failed to save payment method', details: dbError }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    paymentMethod: {
      id: paymentMethod.id,
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4
    }
  });
} 
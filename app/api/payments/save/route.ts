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

  const { paymentMethodId, accountType } = await req.json();

  try {
    // Get user's current stripe_customer_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    let stripeCustomerId = userData?.stripe_customer_id;

    // If no Stripe customer ID exists, create one
    if (!stripeCustomerId) {
      console.log('Creating new Stripe customer for user:', user.id);
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      stripeCustomerId = customer.id;

      // Update user with new Stripe customer ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user with Stripe customer ID:', updateError);
        return NextResponse.json({ error: 'Failed to update user with Stripe customer ID' }, { status: 500 });
      }
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

    // If accountType is 'manager', create a Stripe subscription for $1/month
    if (accountType === 'manager') {
      const priceId = process.env.NEXT_PUBLIC_STRIPE_PARTNER_PRICE_ID;
      if (!priceId) {
        console.error('Stripe priceId not configured for manager subscription');
        // Continue without creating subscription
        return NextResponse.json({
          success: true,
          paymentMethod: {
            id: paymentMethod.id,
            brand: paymentMethod.card?.brand,
            last4: paymentMethod.card?.last4
          },
          warning: 'Subscription not created: Price ID not configured'
        });
      }
      // Check if user already has a subscription (optional: implement this logic if needed)
      // Create the subscription
      try {
        const subscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [{ price: priceId }],
          default_payment_method: paymentMethod.id,
          payment_behavior: 'default_incomplete',
          payment_settings: {
            payment_method_types: ['card'],
            save_default_payment_method: 'on_subscription',
          },
          expand: ['latest_invoice'],
        });

        // Check if the subscription requires payment
        if (subscription.status === 'incomplete') {
          const invoice = subscription.latest_invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent };
          if (invoice.payment_intent) {
            if (invoice.payment_intent.status === 'requires_action') {
              return NextResponse.json({
                success: true,
                requires_action: true,
                payment_intent_client_secret: invoice.payment_intent.client_secret,
                subscription_id: subscription.id
              });
            }
          }
        }

        return NextResponse.json({
          success: true,
          subscription_id: subscription.id,
          status: subscription.status
        });
      } catch (subError) {
        console.error('Stripe subscription error:', subError);
        return NextResponse.json({ 
          error: 'Failed to create subscription', 
          details: subError instanceof Error ? subError.message : 'Unknown error' 
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      paymentMethod: {
        id: paymentMethod.id,
        brand: paymentMethod.card?.brand,
        last4: paymentMethod.card?.last4
      }
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json({ 
      error: 'Failed to process payment method',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
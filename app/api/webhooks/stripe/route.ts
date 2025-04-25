import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { verifyWebhookSignature } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new NextResponse('No signature', { status: 400 });
  }

  try {
    const event = await verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Set up Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Get the user record
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (user) {
          // Update the user's subscription status
          await supabase
            .from('users')
            .update({
              subscription_status: subscription.status,
              subscription_id: subscription.id,
              subscription_tier: subscription.items.data[0].price.product,
            })
            .eq('id', user.id);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        const deletedCustomerId = deletedSubscription.customer as string;

        // Get the user record
        const { data: deletedUser } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', deletedCustomerId)
          .single();

        if (deletedUser) {
          // Clear the user's subscription data
          await supabase
            .from('users')
            .update({
              subscription_status: 'canceled',
              subscription_id: null,
              subscription_tier: null,
            })
            .eq('id', deletedUser.id);
        }
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Handle successful payment
        console.log('PaymentIntent was successful!', paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPaymentIntent = event.data.object;
        // Handle failed payment
        console.log('PaymentIntent failed!', failedPaymentIntent);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new NextResponse(
      JSON.stringify({ error: 'Webhook signature verification failed' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 
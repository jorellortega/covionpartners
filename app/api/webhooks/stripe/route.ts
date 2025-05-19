import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil'
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Get project details from metadata
        const { projectId, baseAmount, stripeFee, platformFee, message } = paymentIntent.metadata;

        // Log event and metadata for debugging
        console.log('Received Stripe event:', event.type, paymentIntent?.id, paymentIntent?.metadata);

        // Create transaction record (using original supabase client)
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            id: paymentIntent.id,
            amount: parseFloat(baseAmount),
            type: 'deposit',
            status: 'completed',
            user_id: paymentIntent.customer as string,
            project_id: projectId,
            metadata: {
              stripe_payment_intent_id: paymentIntent.id,
              stripe_fee: stripeFee,
              platform_fee: platformFee,
              message: message || '',
              payment_method: paymentIntent.payment_method_types[0],
              transfer_destination: paymentIntent.transfer_data?.destination
            }
          });

        if (transactionError) {
          console.error('Error creating transaction:', transactionError);
          return NextResponse.json(
            { error: 'Failed to create transaction record' },
            { status: 500 }
          );
        }

        // Use service role key for public_supports insert
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const supporterId = paymentIntent.metadata?.user_id && paymentIntent.metadata.user_id !== '' ? paymentIntent.metadata.user_id : null;
        console.log('Attempting insert into public_supports:', {
          project_id: projectId,
          supporter_id: supporterId,
          amount: parseFloat(baseAmount),
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          message: message || null,
          stripe_payment_intent_id: paymentIntent.id,
          stripe_fee: stripeFee,
          platform_fee: platformFee,
          created_at: new Date().toISOString(),
          metadata: paymentIntent.metadata || {}
        });
        const { error: supportError } = await serviceSupabase
          .from('public_supports')
          .insert({
            project_id: projectId,
            supporter_id: supporterId,
            amount: parseFloat(baseAmount),
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            message: message || null,
            stripe_payment_intent_id: paymentIntent.id,
            stripe_fee: stripeFee,
            platform_fee: platformFee,
            created_at: new Date().toISOString(),
            metadata: paymentIntent.metadata || {}
          });

        if (supportError) {
          console.error('Error creating public support record:', supportError);
        } else {
          console.log('Successfully inserted public support record for:', paymentIntent.id);
        }

        // Fetch current funding
        const { data: projectData, error: fetchError } = await supabase
          .from('projects')
          .select('current_funding')
          .eq('id', projectId)
          .single();

        if (fetchError) {
          console.error('Error fetching project funding:', fetchError);
          return NextResponse.json(
            { error: 'Failed to fetch project funding' },
            { status: 500 }
          );
        }

        const newFunding = (projectData?.current_funding || 0) + parseFloat(baseAmount);

        // Update project's current funding
        const { error: projectError } = await supabase
          .from('projects')
          .update({ current_funding: newFunding })
          .eq('id', projectId);

        if (projectError) {
          console.error('Error updating project funding:', projectError);
          return NextResponse.json(
            { error: 'Failed to update project funding' },
            { status: 500 }
          );
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Create failed transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            id: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert from cents
            type: 'deposit',
            status: 'failed',
            user_id: paymentIntent.customer as string,
            project_id: paymentIntent.metadata.projectId,
            metadata: {
              stripe_payment_intent_id: paymentIntent.id,
              failure_reason: paymentIntent.last_payment_error?.message,
              payment_method: paymentIntent.payment_method_types[0]
            }
          });

        if (transactionError) {
          console.error('Error creating failed transaction:', transactionError);
          return NextResponse.json(
            { error: 'Failed to create failed transaction record' },
            { status: 500 }
          );
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;
        const role = subscription.metadata.role;

        if (userId && role) {
          await supabase
            .from('users')
            .update({ 
              role,
              subscription_status: subscription.status,
              subscription_id: subscription.id,
              subscription_tier: role,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (userId) {
          await supabase
            .from('users')
            .update({ 
              role: 'public',
              subscription_status: 'canceled',
              subscription_id: null
            })
            .eq('id', userId);
        }
        break;
      }

      case 'payment_method.attached':
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log('Payment method attached:', paymentMethod.id);
        break;

      case 'payment_method.detached':
        const detachedMethod = event.data.object as Stripe.PaymentMethod;
        console.log('Payment method detached:', detachedMethod.id);
        break;

      // Add more event types as needed

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 
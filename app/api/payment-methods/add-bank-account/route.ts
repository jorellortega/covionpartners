import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      account_holder_name,
      account_holder_type,
      routing_number,
      account_number,
      bank_account_type
    } = body;

    // Validate required fields
    if (!account_holder_name || !account_holder_type || !routing_number || !account_number || !bank_account_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Split name into first and last
    const nameParts = account_holder_name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // First, create or get Stripe Connect Custom account
    let stripeAccountId;
    
    // Check if user already has a Stripe Connect account
    const { data: user } = await supabase
      .from('users')
      .select('stripe_connected_account_id')
      .eq('id', session.user.id)
      .single();

    if (user?.stripe_connected_account_id) {
      stripeAccountId = user.stripe_connected_account_id;
    } else {
      // Create new Stripe Connect Custom account with required fields
      const account = await stripe.accounts.create({
        type: 'custom',
        country: 'US',
        capabilities: {
          transfers: { requested: true },
        },
        business_type: account_holder_type,
        individual: {
          first_name: firstName,
          last_name: lastName,
        },
        business_profile: {
          url: 'https://covionpartners.com',
        },
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1',
        },
      });

      stripeAccountId = account.id;

      // Update user with Stripe Connect account ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_connected_account_id: stripeAccountId })
        .eq('id', session.user.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw new Error('Failed to update user with Stripe account');
      }
    }

    // Create bank account token
    const bankAccountToken = await stripe.tokens.create({
      bank_account: {
        country: 'US',
        currency: 'usd',
        account_holder_name,
        account_holder_type,
        routing_number,
        account_number,
      },
    });

    // Attach bank account to Stripe Connect Custom account
    const externalAccount = await stripe.accounts.createExternalAccount(
      stripeAccountId,
      {
        external_account: bankAccountToken.id,
      }
    );

    // Save bank account info to database (only safe fields)
    const { error: insertError } = await supabase
      .from('payment_methods')
      .insert({
        user_id: session.user.id,
        type: 'bank_account',
        stripe_payment_method_id: stripeAccountId,
        bank_name: 'Test Bank',
        bank_routing_number: routing_number,
        bank_account_last4: account_number.slice(-4),
        bank_account_type,
        account_holder_name,
        account_holder_type,
        verification_status: 'pending',
        country: 'US',
        currency: 'usd',
        is_default: false,
        details: {
          account_type: bank_account_type
        }
      });

    if (insertError) {
      console.error('Error inserting payment method:', insertError);
      throw new Error('Failed to save payment method');
    }

    return NextResponse.json({
      success: true,
      message: 'Bank account connected successfully',
      accountId: stripeAccountId,
    });

  } catch (error: any) {
    console.error('Error connecting bank account:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to connect bank account',
        code: error.code,
        type: error.type
      },
      { status: 400 }
    );
  }
} 
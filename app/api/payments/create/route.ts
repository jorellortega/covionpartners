import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { amount, recipientId, paymentMethodId, projectId } = await request.json()

    // Get recipient's data
    const { data: recipient } = await supabase
      .from('users')
      .select('stripe_connect_account_id, stripe_customer_id')
      .eq('id', recipientId)
      .single()

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 400 }
      )
    }

    // Check if recipient has activated their Covion banking
    if (!recipient.stripe_connect_account_id || !recipient.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Recipient has not activated their Covion banking. Please ask them to visit /managepayments to set up their account.' },
        { status: 400 }
      )
    }

    // Get sender's Stripe customer ID
    const { data: sender } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!sender?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Please add a payment method first' },
        { status: 400 }
      )
    }

    // Calculate 2% platform fee (in cents)
    const platformFee = Math.round(amount * 100 * 0.02);
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      customer: sender.stripe_customer_id,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      // Platform fee logic: 2% goes to platform, rest to recipient
      application_fee_amount: platformFee,
      transfer_data: {
        destination: recipient.stripe_connect_account_id,
      },
      metadata: {
        project_id: projectId,
        sender_id: user.id,
        recipient_id: recipientId,
        platform_fee: platformFee,
      },
    })

    // Get recipient's current balance
    const { data: recipientBalance, error: balanceError } = await supabase
      .from('cvnpartners_user_balances')
      .select('balance')
      .eq('user_id', recipientId)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw balanceError
    }

    const currentBalance = recipientBalance?.balance || 0

    // Update or create recipient's balance record
    const { error: updateError } = await supabase
      .from('cvnpartners_user_balances')
      .upsert({
        user_id: recipientId,
        balance: currentBalance + amount,
        currency: 'USD',
        status: 'active',
        last_updated: new Date().toISOString()
      })

    if (updateError) {
      console.error('Error updating recipient balance:', updateError)
      // Don't throw here since the payment was successful
    }

    // Record the transaction in the database
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        amount,
        project_id: projectId,
        status: paymentIntent.status,
        stripe_payment_intent_id: paymentIntent.id,
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // We don't throw here since the payment was successful
    }

    return NextResponse.json({ success: true, paymentIntent })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
} 
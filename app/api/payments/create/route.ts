import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler'
import { isValidStripeCustomerId } from '@/lib/stripe-customer-id'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

/**
 * Map Stripe PI status → public.transaction_status.
 * Many DB enums only allow pending | completed | failed (no "processing") — use pending for in-flight ACH.
 */
function dbStatusFromPaymentIntent(status: string): string {
  if (status === 'succeeded') return 'completed'
  if (status === 'processing' || status === 'requires_action' || status === 'requires_confirmation') {
    return 'pending'
  }
  return 'pending'
}

/** P2P outgoing payment: use transaction_type values that exist in DB (see prisma/seed.sql — not always "payment"). */
const P2P_TRANSACTION_TYPE = 'withdrawal' as const

function normalizeProjectId(projectId: string | null | undefined): string | null {
  if (projectId == null || String(projectId).trim() === '') return null
  return projectId
}

/** Insert P2P row; retries without optional columns if migration not applied yet. */
async function insertP2pTransaction(
  supabase: Awaited<ReturnType<typeof createSupabaseRouteHandlerClient>>,
  row: {
    user_id: string
    amount: number
    type: string
    status: string
    project_id: string | null
    recipient_id: string
    stripe_payment_intent_id?: string | null
  }
) {
  const full = {
    user_id: row.user_id,
    amount: row.amount,
    type: row.type,
    status: row.status,
    project_id: row.project_id,
    recipient_id: row.recipient_id,
    ...(row.stripe_payment_intent_id != null && row.stripe_payment_intent_id !== ''
      ? { stripe_payment_intent_id: row.stripe_payment_intent_id }
      : {}),
  }
  const minimal = {
    user_id: row.user_id,
    amount: row.amount,
    type: row.type,
    status: row.status,
    project_id: row.project_id,
  }

  let { error } = await supabase.from('transactions').insert(full)
  const msg = error?.message ?? ''
  if (
    error &&
    (msg.includes('recipient_id') ||
      msg.includes('stripe_payment_intent_id') ||
      msg.includes('PGRST204'))
  ) {
    console.warn('[payments/create] transactions insert: retrying without optional columns', error.message)
    const second = await supabase.from('transactions').insert(minimal)
    error = second.error
  }
  if (error) {
    console.error('Error recording transaction:', error)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      recipientId,
      projectId,
      funding = 'card',
      paymentMethodId,
    } = body as {
      amount: unknown
      recipientId: string
      projectId?: string
      funding?: 'card' | 'bank' | 'balance'
      paymentMethodId?: string
    }

    const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
    const fundingType = funding === 'bank' || funding === 'balance' ? funding : 'card'

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (fundingType !== 'balance' && !paymentMethodId) {
      return NextResponse.json(
        { error: 'paymentMethodId is required for card or bank' },
        { status: 400 }
      )
    }

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

    // Card/bank: money moves through Stripe to recipient's Connect account
    if (
      fundingType !== 'balance' &&
      (!recipient.stripe_connect_account_id ||
        !isValidStripeCustomerId(recipient.stripe_customer_id))
    ) {
      return NextResponse.json(
        {
          error:
            'Recipient has not activated their Covion banking. Please ask them to visit /managepayments to set up their account.',
        },
        { status: 400 }
      )
    }

    // Get sender's Stripe customer ID
    const { data: sender } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    const amountCents = Math.round(amount * 100)
    const platformFee = Math.round(amountCents * 0.02)
    const recipientNetCents = amountCents - platformFee

    /** Pay from in-app wallet (cvnpartners_user_balances) — no Stripe charge. */
    if (fundingType === 'balance') {
      const { data: senderWallet } = await supabase
        .from('cvnpartners_user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle()

      const senderBal = typeof senderWallet?.balance === 'number' ? senderWallet.balance : 0
      if (senderBal < amount) {
        return NextResponse.json(
          {
            error: `Insufficient account balance. You have $${senderBal.toFixed(2)}; this send requires $${amount.toFixed(2)}.`,
          },
          { status: 400 }
        )
      }

      if (!senderWallet) {
        return NextResponse.json(
          { error: 'No account balance record. Add funds or receive payments first.' },
          { status: 400 }
        )
      }

      const newSenderBal = senderBal - amount
      const { error: decErr } = await supabase
        .from('cvnpartners_user_balances')
        .update({
          balance: newSenderBal,
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (decErr) {
        console.error('[payments/create] sender wallet deduct', decErr)
        return NextResponse.json({ error: 'Could not update your balance' }, { status: 500 })
      }

      const { data: recW } = await supabase
        .from('cvnpartners_user_balances')
        .select('balance')
        .eq('user_id', recipientId)
        .maybeSingle()

      const recBal = typeof recW?.balance === 'number' ? recW.balance : 0
      const recipientCreditUsd = recipientNetCents / 100

      const newRecBal = recBal + recipientCreditUsd
      const incRes = recW
        ? await supabase
            .from('cvnpartners_user_balances')
            .update({
              balance: newRecBal,
              last_updated: new Date().toISOString(),
            })
            .eq('user_id', recipientId)
        : await supabase.from('cvnpartners_user_balances').insert({
            user_id: recipientId,
            balance: newRecBal,
            currency: 'USD',
            status: 'active',
            last_updated: new Date().toISOString(),
          })

      if (incRes.error) {
        console.error('[payments/create] recipient wallet credit', incRes.error)
        await supabase
          .from('cvnpartners_user_balances')
          .update({
            balance: senderBal,
            last_updated: new Date().toISOString(),
          })
          .eq('user_id', user.id)
        return NextResponse.json({ error: 'Could not credit recipient balance' }, { status: 500 })
      }

      await insertP2pTransaction(supabase, {
        user_id: user.id,
        amount,
        type: P2P_TRANSACTION_TYPE,
        status: 'completed',
        project_id: normalizeProjectId(projectId),
        recipient_id: recipientId,
      })

      return NextResponse.json({
        success: true,
        funding: 'balance',
        message: 'Payment sent from account balance',
      })
    }

    if (!isValidStripeCustomerId(sender?.stripe_customer_id)) {
      return NextResponse.json(
        { error: 'Please add a payment method first' },
        { status: 400 }
      )
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId!)
    if (paymentMethod.customer !== sender.stripe_customer_id) {
      return NextResponse.json({ error: 'That payment method does not belong to your account' }, { status: 400 })
    }

    const pmType = paymentMethod.type
    if (fundingType === 'card' && pmType !== 'card') {
      return NextResponse.json({ error: 'Selected payment method is not a card' }, { status: 400 })
    }
    if (fundingType === 'bank' && pmType !== 'us_bank_account') {
      return NextResponse.json(
        { error: 'Selected payment method is not a US bank account' },
        { status: 400 }
      )
    }

    // Create a payment intent (card or ACH debit on Customer; type comes from payment_method)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: sender.stripe_customer_id!,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      application_fee_amount: platformFee,
      transfer_data: {
        destination: recipient.stripe_connect_account_id,
      },
      metadata: {
        project_id: projectId ?? '',
        sender_id: user.id,
        recipient_id: recipientId,
        platform_fee: String(platformFee),
        funding: fundingType,
      },
    })

    if (
      paymentIntent.status !== 'succeeded' &&
      paymentIntent.status !== 'processing'
    ) {
      return NextResponse.json(
        {
          error: `Payment could not be completed (status: ${paymentIntent.status}). Bank debits may take a few days.`,
        },
        { status: 400 }
      )
    }

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

    await insertP2pTransaction(supabase, {
      user_id: user.id,
      amount,
      type: P2P_TRANSACTION_TYPE,
      status: dbStatusFromPaymentIntent(paymentIntent.status),
      project_id: normalizeProjectId(projectId),
      recipient_id: recipientId,
      stripe_payment_intent_id: paymentIntent.id,
    })

    return NextResponse.json({ success: true, paymentIntent })
  } catch (error: unknown) {
    console.error('Error creating payment:', error)
    const message =
      error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : 'Failed to process payment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
} 
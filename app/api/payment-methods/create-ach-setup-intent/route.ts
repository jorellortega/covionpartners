import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler'
import { isValidStripeCustomerId } from '@/lib/stripe-customer-id'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

/**
 * SetupIntent to collect a US bank account as a Customer PaymentMethod (ACH debits).
 * Required for /pay → "Bank account (US ACH)". Separate from Connect payout bank.
 */
export async function POST() {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: row } = await supabase
      .from('users')
      .select('stripe_customer_id, name')
      .eq('id', user.id)
      .single()

    let customerId = row?.stripe_customer_id

    if (!isValidStripeCustomerId(customerId)) {
      const c = await stripe.customers.create({
        email: user.email ?? undefined,
        name: row?.name ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = c.id
      const { error: upErr } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
      if (upErr) {
        console.error('[create-ach-setup-intent] update users', upErr)
        return NextResponse.json({ error: 'Could not save Stripe customer' }, { status: 500 })
      }
    }

    const base: Stripe.SetupIntentCreateParams = {
      customer: customerId,
      payment_method_types: ['us_bank_account'],
      usage: 'off_session',
    }

    let setupIntent: Stripe.SetupIntent
    try {
      setupIntent = await stripe.setupIntents.create({
        ...base,
        payment_method_options: {
          us_bank_account: {
            financial_connections: {
              permissions: ['payment_method'],
            },
          },
        },
      })
    } catch (first) {
      console.warn('[create-ach-setup-intent] retry without Financial Connections', first)
      setupIntent = await stripe.setupIntents.create(base)
    }

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (e) {
    const raw = e instanceof Error ? e.message : 'Failed to create bank setup'
    console.error('[create-ach-setup-intent]', e)
    return NextResponse.json({ error: raw }, { status: 400 })
  }
}

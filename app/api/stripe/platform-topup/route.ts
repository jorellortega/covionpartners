import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

async function requireAdminOrCeo(supabase: Awaited<ReturnType<typeof createSupabaseRouteHandlerClient>>) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const { data: row } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!row || (row.role !== 'admin' && row.role !== 'ceo')) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden. Admin or CEO role required.' }, { status: 403 }) }
  }
  return { user, error: null }
}

function stripeErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message
  }
  return 'Request failed'
}

/** Platform Stripe balance (not a connected account). */
export async function GET() {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const { error } = await requireAdminOrCeo(supabase)
    if (error) return error

    const balance = await stripe.balance.retrieve()
    const usdAvailable = balance.available.find((b) => b.currency === 'usd')?.amount ?? 0
    const usdPending = balance.pending.find((b) => b.currency === 'usd')?.amount ?? 0

    let topupRows: Stripe.Topup[] = []
    try {
      const topups = await stripe.topups.list({ limit: 15 })
      topupRows = topups.data
    } catch (listErr) {
      console.warn('platform-topup: could not list top-ups', listErr)
    }

    return NextResponse.json({
      available: usdAvailable / 100,
      pending: usdPending / 100,
      topups: topupRows.map((t) => ({
        id: t.id,
        amount: t.amount / 100,
        currency: t.currency,
        status: t.status,
        description: t.description,
        created: t.created,
        failure_code: t.failure_code,
        failure_message: t.failure_message,
      })),
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch platform balance'
    console.error('platform-topup GET:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Add funds to the platform Stripe balance.
 *
 * - `funding: "bank"` (default): Stripe Top-up — debits your verified **platform bank account**
 *   configured in the Dashboard (not a card). See https://docs.stripe.com/connect/top-ups
 * - `funding: "card"`: Charges a **saved card** on your Stripe Customer via PaymentIntent;
 *   proceeds settle to the platform balance (minus Stripe processing fees).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const { user, error: authErr } = await requireAdminOrCeo(supabase)
    if (authErr) return authErr
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const amountUsd = typeof body.amountUsd === 'number' ? body.amountUsd : Number(body.amountUsd)
    const description =
      typeof body.description === 'string' && body.description.trim()
        ? body.description.trim().slice(0, 500)
        : 'Platform balance top-up'

    const funding: 'bank' | 'card' = body.funding === 'card' ? 'card' : 'bank'
    const paymentMethodId = typeof body.paymentMethodId === 'string' ? body.paymentMethodId.trim() : ''

    if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
      return NextResponse.json({ error: 'amountUsd must be a positive number' }, { status: 400 })
    }

    const amountCents = Math.round(amountUsd * 100)
    if (amountCents < 1) {
      return NextResponse.json({ error: 'Amount is too small' }, { status: 400 })
    }
    if (funding === 'card' && amountCents < 50) {
      return NextResponse.json({ error: 'Card payments require at least $0.50' }, { status: 400 })
    }

    if (funding === 'bank') {
      const topup = await stripe.topups.create({
        amount: amountCents,
        currency: 'usd',
        description,
      })

      return NextResponse.json({
        success: true,
        funding: 'bank' as const,
        topup: {
          id: topup.id,
          amount: topup.amount / 100,
          currency: topup.currency,
          status: topup.status,
          description: topup.description,
          failure_code: topup.failure_code,
          failure_message: topup.failure_message,
        },
      })
    }

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'Select a saved card for card funding' }, { status: 400 })
    }

    const { data: payer } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!payer?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Create a Stripe customer and save a card first (Activate Payment Methods).' },
        { status: 400 }
      )
    }

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (pm.customer !== payer.stripe_customer_id) {
      return NextResponse.json({ error: 'That payment method does not belong to your account' }, { status: 400 })
    }
    if (pm.type !== 'card') {
      return NextResponse.json({ error: 'Only saved cards work for this option (not bank debits).' }, { status: 400 })
    }

    const pi = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: payer.stripe_customer_id,
      payment_method: paymentMethodId,
      description: `${description} (card → platform balance)`,
      metadata: { purpose: 'platform_balance_funding', funding: 'card' },
      confirm: true,
      off_session: true,
      payment_method_types: ['card'],
    })

    if (pi.status === 'requires_action') {
      return NextResponse.json({
        success: false,
        funding: 'card' as const,
        requiresAction: true,
        clientSecret: pi.client_secret,
        paymentIntentId: pi.id,
      })
    }

    if (pi.status !== 'succeeded') {
      return NextResponse.json(
        { error: `Payment could not be completed (status: ${pi.status})` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      funding: 'card' as const,
      paymentIntent: {
        id: pi.id,
        amount: pi.amount / 100,
        currency: pi.currency,
        status: pi.status,
      },
    })
  } catch (e: unknown) {
    console.error('platform-topup POST:', e)
    return NextResponse.json({ error: stripeErrorMessage(e) }, { status: 500 })
  }
}

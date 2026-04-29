import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler'
import { resolvePaymentMethodIdForCustomer } from '@/lib/stripe-resolve-payment-method'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

const RETRYABLE = new Set<Stripe.PaymentIntent.Status>([
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'requires_capture',
])

async function syncPartnerWithdrawalIfApplicable(
  supabase: Awaited<ReturnType<typeof createSupabaseRouteHandlerClient>>,
  userId: string,
  intent: Stripe.PaymentIntent
) {
  if (intent.metadata?.type !== 'partner_withdrawal') return
  const wid = intent.metadata.withdrawal_request_id
  if (!wid) return
  if (intent.status !== 'succeeded' && intent.status !== 'processing') return

  const { data: wr } = await supabase
    .from('partner_withdrawal_requests')
    .select('id, organization_id')
    .eq('id', wid)
    .maybeSingle()
  if (!wr?.organization_id) return

  const { data: org } = await supabase
    .from('organizations')
    .select('owner_id')
    .eq('id', wr.organization_id)
    .single()
  if (org?.owner_id !== userId) return

  const rowStatus = intent.status === 'succeeded' ? 'completed' : 'processing'
  await supabase
    .from('partner_withdrawal_requests')
    .update({
      status: rowStatus,
      stripe_transfer_id: intent.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', wid)
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const paymentIntentId =
      typeof body.paymentIntentId === 'string' ? body.paymentIntentId.trim() : ''
    const paymentMethodIdBody =
      typeof body.paymentMethodId === 'string' ? body.paymentMethodId.trim() : ''
    const applyCompletion = body.applyCompletion === true

    if (!paymentIntentId.startsWith('pi_')) {
      return NextResponse.json({ error: 'Invalid payment intent id' }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!userData?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer on file' }, { status: 400 })
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)
    const custId = typeof intent.customer === 'string' ? intent.customer : intent.customer?.id
    if (custId !== userData.stripe_customer_id) {
      return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
    }

    if (applyCompletion) {
      if (intent.status !== 'succeeded' && intent.status !== 'processing') {
        return NextResponse.json(
          { error: `Payment is not complete yet (status: ${intent.status})` },
          { status: 400 }
        )
      }
      await syncPartnerWithdrawalIfApplicable(supabase, user.id, intent)
      return NextResponse.json({
        success: true,
        status: intent.status,
        paymentIntentId: intent.id,
        message: 'Withdrawal records updated.',
      })
    }

    if (intent.status === 'succeeded') {
      return NextResponse.json({ error: 'This payment already succeeded' }, { status: 400 })
    }
    if (intent.status === 'canceled') {
      return NextResponse.json(
        {
          error:
            'This payment was canceled and cannot be retried. Ask your partner to request a new withdrawal if needed.',
        },
        { status: 400 }
      )
    }
    if (intent.status === 'processing') {
      return NextResponse.json({ error: 'This payment is already processing' }, { status: 400 })
    }
    if (!RETRYABLE.has(intent.status)) {
      return NextResponse.json({ error: `Cannot retry from status: ${intent.status}` }, { status: 400 })
    }

    let pmId = paymentMethodIdBody
    if (!pmId) {
      const resolved = await resolvePaymentMethodIdForCustomer(stripe, userData.stripe_customer_id)
      if (!resolved) {
        return NextResponse.json(
          { error: 'Add a saved card or bank account under Payment Methods first.' },
          { status: 400 }
        )
      }
      pmId = resolved.id
    }

    const pm = await stripe.paymentMethods.retrieve(pmId)
    if (pm.customer !== userData.stripe_customer_id) {
      return NextResponse.json({ error: 'That payment method is not on your account' }, { status: 400 })
    }

    let updated: Stripe.PaymentIntent
    try {
      updated = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: pmId,
        off_session: true,
      })
    } catch {
      const again = await stripe.paymentIntents.retrieve(paymentIntentId)
      if (again.status === 'requires_action' && again.client_secret) {
        return NextResponse.json({
          requiresAction: true,
          clientSecret: again.client_secret,
          paymentIntentId: again.id,
        })
      }
      return NextResponse.json({ error: 'Payment could not be confirmed. Try again or use a different card.' }, { status: 400 })
    }

    if (updated.status === 'requires_action' && updated.client_secret) {
      return NextResponse.json({
        requiresAction: true,
        clientSecret: updated.client_secret,
        paymentIntentId: updated.id,
      })
    }

    if (updated.status !== 'succeeded' && updated.status !== 'processing') {
      return NextResponse.json(
        { error: `Payment not completed (status: ${updated.status})` },
        { status: 400 }
      )
    }

    await syncPartnerWithdrawalIfApplicable(supabase, user.id, updated)

    return NextResponse.json({
      success: true,
      status: updated.status,
      paymentIntentId: updated.id,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Request failed'
    console.error('retry-payment-intent:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

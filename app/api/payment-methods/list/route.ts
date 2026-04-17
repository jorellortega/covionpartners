import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { isValidStripeCustomerId } from '@/lib/stripe-customer-id'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

/** Plain JSON shape for the client (avoids Stripe object serialization issues). */
function serializePaymentMethod(pm: Stripe.PaymentMethod) {
  const base = { id: pm.id, type: pm.type }
  if (pm.type === 'card' && pm.card) {
    return {
      ...base,
      card: {
        brand: pm.card.brand,
        last4: pm.card.last4,
        exp_month: pm.card.exp_month,
        exp_year: pm.card.exp_year,
      },
    }
  }
  if (pm.type === 'us_bank_account' && pm.us_bank_account) {
    return {
      ...base,
      us_bank_account: {
        bank_name: pm.us_bank_account.bank_name,
        last4: pm.us_bank_account.last4,
      },
    }
  }
  return base
}

function stripeMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message
  }
  return 'Unknown error'
}

function stripeExtra(e: unknown): Record<string, string | undefined> {
  if (!e || typeof e !== 'object') return {}
  const o = e as { code?: string; type?: string; statusCode?: number; raw?: { message?: string } }
  return {
    code: typeof o.code === 'string' ? o.code : undefined,
    type: typeof o.type === 'string' ? o.type : undefined,
    statusCode: typeof o.statusCode === 'number' ? String(o.statusCode) : undefined,
  }
}

export async function GET(request: Request) {
  const started = Date.now()
  const url = new URL(request.url)
  const wantDebug =
    url.searchParams.get('debug') === '1' ||
    process.env.NODE_ENV === 'development' ||
    process.env.PAYMENT_METHODS_LIST_DEBUG === '1'

  const out: ReturnType<typeof serializePaymentMethod>[] = []
  const warnings: string[] = []
  const debugSteps: string[] = []

  const debugPayload: Record<string, unknown> = {
    at: new Date().toISOString(),
    wantDebug,
    steps: debugSteps,
    cardListError: null as null | Record<string, unknown>,
    bankListError: null as null | Record<string, unknown>,
    fatalError: null as null | string,
    userId: null as string | null,
    stripeCustomerIdPresent: false,
    stripeCustomerIdPrefix: null as string | null,
    cardCount: 0,
    bankCount: 0,
    totalReturned: 0,
    durationMs: 0,
  }

  try {
    debugSteps.push('createSupabaseRouteHandlerClient')
    const supabase = await createSupabaseRouteHandlerClient()

    debugSteps.push('auth.getUser')
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      debugPayload.fatalError = 'No user (getUser returned null)'
      debugPayload.durationMs = Date.now() - started
      return NextResponse.json(
        { error: 'Unauthorized', paymentMethods: [], ...(wantDebug ? { debug: debugPayload } : {}) },
        { status: 401 }
      )
    }
    debugPayload.userId = user.id

    debugSteps.push('users.select stripe_customer_id')
    const { data: userData, error: userErr } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (userErr) {
      debugPayload.fatalError = `Supabase users row: ${userErr.message}`
      console.error('[payment-methods/list] users select', userErr)
    }

    const rawCustomerId = userData?.stripe_customer_id
    if (!isValidStripeCustomerId(rawCustomerId)) {
      debugPayload.stripeCustomerIdPresent = false
      debugPayload.fatalError =
        debugPayload.fatalError ||
        (rawCustomerId && String(rawCustomerId).trim()
          ? 'stripe_customer_id is not a valid Stripe customer id (e.g. placeholder NULL or missing cus_ prefix) — use Manage payments / create customer flow'
          : 'No stripe_customer_id on users row — activate payment methods / create Stripe customer')
      debugPayload.durationMs = Date.now() - started
      return NextResponse.json({
        paymentMethods: [],
        ...(wantDebug ? { debug: debugPayload } : {}),
      })
    }

    const customer = rawCustomerId
    debugPayload.stripeCustomerIdPresent = true
    debugPayload.stripeCustomerIdPrefix = `${customer.slice(0, 14)}…`

    debugSteps.push('stripe.paymentMethods.list type=card')
    try {
      const cards = await stripe.paymentMethods.list({ customer, type: 'card', limit: 100 })
      out.push(...cards.data.map(serializePaymentMethod))
      debugPayload.cardCount = cards.data.length
    } catch (e) {
      console.error('[payment-methods/list] card list failed', e)
      warnings.push(`Cards: ${stripeMessage(e)}`)
      debugPayload.cardListError = { message: stripeMessage(e), ...stripeExtra(e) }
    }

    debugSteps.push('stripe.paymentMethods.list type=us_bank_account')
    let bankLen = 0
    try {
      const banks = await stripe.paymentMethods.list({ customer, type: 'us_bank_account', limit: 100 })
      out.push(...banks.data.map(serializePaymentMethod))
      bankLen = banks.data.length
      debugPayload.bankCount = bankLen
    } catch (e) {
      console.warn('[payment-methods/list] us_bank_account list failed', e)
      warnings.push(`Bank accounts: ${stripeMessage(e)}`)
      debugPayload.bankListError = { message: stripeMessage(e), ...stripeExtra(e) }
    }

    debugPayload.totalReturned = out.length
    debugPayload.durationMs = Date.now() - started
    if (warnings.length) debugPayload.warnings = warnings

    return NextResponse.json({
      paymentMethods: out,
      ...(wantDebug ? { debug: debugPayload } : {}),
    })
  } catch (e) {
    console.error('[payment-methods/list] unexpected', e)
    debugPayload.fatalError = stripeMessage(e)
    debugPayload.durationMs = Date.now() - started
    return NextResponse.json({
      paymentMethods: [],
      ...(wantDebug ? { debug: debugPayload } : {}),
    })
  }
}

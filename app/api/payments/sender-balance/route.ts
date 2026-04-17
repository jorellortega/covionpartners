import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

/** Wallet + Connect available (USD) for /pay funding picker. */
export async function GET() {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let walletUsd = 0
    const { data: walletRow } = await supabase
      .from('cvnpartners_user_balances')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle()

    if (walletRow && typeof walletRow.balance === 'number') {
      walletUsd = walletRow.balance
    }

    let connectAvailableUsd: number | null = null
    const { data: u } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', user.id)
      .single()

    if (u?.stripe_connect_account_id) {
      try {
        const bal = await stripe.balance.retrieve({
          stripeAccount: u.stripe_connect_account_id,
        })
        const usd = bal.available.find((b) => b.currency === 'usd')
        connectAvailableUsd = usd ? usd.amount / 100 : 0
      } catch {
        connectAvailableUsd = null
      }
    }

    return NextResponse.json({
      walletUsd,
      connectAvailableUsd,
    })
  } catch (e) {
    console.error('[sender-balance]', e)
    return NextResponse.json({ error: 'Failed to load balances' }, { status: 500 })
  }
}

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil'
})

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase
    .from('users')
    .select('stripe_connect_account_id')
    .eq('id', session.user.id)
    .single()

  if (!userData?.stripe_connect_account_id) {
    return NextResponse.json({ error: 'No Stripe Connect account found' }, { status: 404 })
  }

  try {
    // Fetch external accounts (bank accounts)
    const accounts = await stripe.accounts.listExternalAccounts(userData.stripe_connect_account_id, {
      object: 'bank_account',
      limit: 1
    })
    const bank = accounts.data[0]
    if (!bank || bank.object !== 'bank_account') return NextResponse.json({ error: 'No bank account found' }, { status: 404 })

    const bankAccount = bank as Stripe.BankAccount

    // Fetch most recent payout (regardless of status)
    let next_payout = null;
    let next_payout_estimated_arrival = null;
    try {
      const payouts = await stripe.payouts.list(
        {
          limit: 1,
        },
        { stripeAccount: userData.stripe_connect_account_id }
      );
      if (payouts.data.length > 0) {
        next_payout = payouts.data[0].amount / 100; // convert to dollars
        next_payout_estimated_arrival = payouts.data[0].arrival_date ? new Date(payouts.data[0].arrival_date * 1000).toISOString() : null;
      }
    } catch (e) {
      // If payouts fetch fails, just skip
    }

    return NextResponse.json({
      bank_name: bankAccount.bank_name,
      last4: bankAccount.last4,
      routing_number: bankAccount.routing_number,
      currency: bankAccount.currency,
      instant_eligible: bankAccount.metadata?.instant_eligible || false,
      account_holder_type: bankAccount.account_holder_type,
      status: bankAccount.status,
      next_payout,
      next_payout_estimated_arrival
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payout details' }, { status: 500 })
  }
} 
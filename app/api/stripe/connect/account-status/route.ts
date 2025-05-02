import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('users')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .single()

  if (!data?.stripe_connect_account_id) {
    return NextResponse.json({ error: 'No Stripe Connect account found' }, { status: 400 })
  }

  const account = await stripe.accounts.retrieve(data.stripe_connect_account_id)
  return NextResponse.json({
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
    requirements: account.requirements,
  })
} 
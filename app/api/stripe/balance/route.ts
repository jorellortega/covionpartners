import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil'
})

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's Stripe Connect account ID
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_connect_account_id')
      .eq('id', session.user.id)
      .single()

    if (!userData?.stripe_connect_account_id) {
      return NextResponse.json({ error: 'No Stripe Connect account found' }, { status: 404 })
    }

    // Fetch the balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: userData.stripe_connect_account_id
    })

    // Calculate available and pending amounts
    const available = balance.available.reduce((sum, bal) => sum + bal.amount, 0)
    const pending = balance.pending.reduce((sum, bal) => sum + bal.amount, 0)

    return NextResponse.json({
      available,
      pending
    })
  } catch (error) {
    console.error('Error fetching Stripe balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
} 
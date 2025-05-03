import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export async function GET() {
  // Use cookies() synchronously as per Next.js app directory
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch the user's Stripe Connect account ID from your DB
  const { data } = await supabase
    .from('users')
    .select('stripe_connect_account_id')
    .eq('id', user.id)
    .single()

  if (!data?.stripe_connect_account_id) {
    return NextResponse.json({ error: 'No Stripe Connect account found' }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  try {
    const accountLink = await stripe.accountLinks.create({
      account: data.stripe_connect_account_id,
      refresh_url: `${baseUrl}/managepayments?refresh=true`,
      return_url: `${baseUrl}/managepayments?success=true`,
      type: 'account_onboarding',
    })
    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create Stripe onboarding link' }, { status: 500 })
  }
} 
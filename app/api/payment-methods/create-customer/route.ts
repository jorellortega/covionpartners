import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export async function POST() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabase_user_id: user.id
      }
    })

    // Save the customer ID to the user's record
    const { error: updateError } = await supabase
      .from('users')
      .update({ stripe_customer_id: customer.id })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user with Stripe customer ID:', updateError)
      return NextResponse.json({ error: 'Failed to save customer ID' }, { status: 500 })
    }

    return NextResponse.json({ customerId: customer.id })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
} 
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil'
})

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const body = await req.json()
    const { amount, projectId, message } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, users!inner(*)')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check if project owner has Stripe Connect account
    if (!project.users.stripe_connect_account_id) {
      return NextResponse.json({ 
        error: 'Project owner has not set up their payment account. Please contact them to set up their account.' 
      }, { status: 400 })
    }

    // Calculate fees (user pays exactly the entered amount)
    const stripeFee = (amount * 0.029) + 0.30 // 2.9% + $0.30
    const platformFee = amount * 0.02 // 2%
    const netAmount = amount - stripeFee - platformFee

    // Get user id if authenticated
    const { data: { user } } = await supabase.auth.getUser()

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // User pays exactly this
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_data: {
        destination: project.users.stripe_connect_account_id,
      },
      application_fee_amount: Math.round(platformFee * 100),
      metadata: {
        projectId,
        user_id: user?.id || '',
        message: message || '',
        baseAmount: amount.toString(),
        stripeFee: stripeFee.toString(),
        platformFee: platformFee.toString(),
        netAmount: netAmount.toString(),
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
} 
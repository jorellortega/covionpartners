import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { amount, partnerInvitationId, organizationId, description } = await request.json()

    if (!amount || !partnerInvitationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user owns the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, owner_id')
      .eq('id', organizationId)
      .eq('owner_id', user.id)
      .single()

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organization not found or access denied' },
        { status: 403 }
      )
    }

    // Get partner invitation and check permissions
    const { data: invitation, error: inviteError } = await supabase
      .from('partner_invitations')
      .select('id, organization_id, status')
      .eq('id', partnerInvitationId)
      .eq('organization_id', organizationId)
      .eq('status', 'accepted')
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Partner invitation not found or not accepted' },
        { status: 404 }
      )
    }

    // Check partner settings for payment permissions
    const { data: settings, error: settingsError } = await supabase
      .from('organization_partner_settings')
      .select('can_receive_payments')
      .eq('partner_invitation_id', partnerInvitationId)
      .single()

    if (settingsError || !settings?.can_receive_payments) {
      return NextResponse.json(
        { error: 'Partner does not have permission to receive payments' },
        { status: 403 }
      )
    }

    // Get partner user ID
    const { data: partnerAccess, error: accessError } = await supabase
      .from('partner_access')
      .select('user_id')
      .eq('partner_invitation_id', partnerInvitationId)
      .not('user_id', 'is', null)
      .limit(1)
      .single()

    if (accessError || !partnerAccess?.user_id) {
      return NextResponse.json(
        { error: 'Partner user not found' },
        { status: 404 }
      )
    }

    // Get partner's Stripe Connect account ID
    const { data: partnerUser, error: partnerError } = await supabase
      .from('users')
      .select('stripe_connect_account_id, stripe_customer_id')
      .eq('id', partnerAccess.user_id)
      .single()

    if (partnerError || !partnerUser) {
      return NextResponse.json(
        { error: 'Partner user data not found' },
        { status: 404 }
      )
    }

    if (!partnerUser.stripe_connect_account_id) {
      return NextResponse.json(
        { error: 'Partner has not set up payment receiving. Please ask them to visit /managepayments to set up their account.' },
        { status: 400 }
      )
    }

    // Get sender's Stripe customer ID
    const { data: sender, error: senderError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (senderError || !sender?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Please add a payment method first' },
        { status: 400 }
      )
    }

    // Calculate 2% platform fee (in cents)
    const platformFee = Math.round(amount * 100 * 0.02)
    const transferAmount = Math.round(amount * 100) - platformFee

    // Create a payment intent with destination charge
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      customer: sender.stripe_customer_id,
      application_fee_amount: platformFee,
      transfer_data: {
        destination: partnerUser.stripe_connect_account_id,
      },
      description: description || `Payment to partner via invitation ${partnerInvitationId}`,
      metadata: {
        partner_invitation_id: partnerInvitationId,
        organization_id: organizationId,
        sender_id: user.id,
        recipient_id: partnerAccess.user_id,
      },
    })

    // Record transaction in database
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        type: 'payment',
        status: 'pending',
        metadata: {
          partner_invitation_id: partnerInvitationId,
          organization_id: organizationId,
          recipient_id: partnerAccess.user_id,
          stripe_payment_intent_id: paymentIntent.id,
        },
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      message: 'Payment intent created successfully',
    })
  } catch (error: any) {
    console.error('Error sending payment to partner:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send payment' },
      { status: 500 }
    )
  }
}


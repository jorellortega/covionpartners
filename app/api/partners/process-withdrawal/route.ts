import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createSupabaseRouteHandlerClient } from '@/lib/supabase/route-handler'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { withdrawalRequestId, action, rejectionReason } = await request.json()

    if (!withdrawalRequestId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject', 'process'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    // Get withdrawal request (org name for transaction labels / partner visibility)
    const { data: withdrawalRequest, error: requestError } = await supabase
      .from('partner_withdrawal_requests')
      .select(`
        *,
        partner_invitations!inner(
          organization_id,
          organizations!inner(
            owner_id,
            name
          )
        )
      `)
      .eq('id', withdrawalRequestId)
      .single()

    if (requestError || !withdrawalRequest) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      )
    }

    // Verify user owns the organization
    if (withdrawalRequest.partner_invitations.organizations.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Handle rejection
    if (action === 'reject') {
      const { error: updateError } = await supabase
        .from('partner_withdrawal_requests')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason || null,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalRequestId)

      if (updateError) {
        console.error('Error rejecting withdrawal:', updateError)
        return NextResponse.json(
          { error: 'Failed to reject withdrawal' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Withdrawal request rejected',
      })
    }

    // Handle approval (mark as approved, but don't process payment yet)
    if (action === 'approve') {
      const { error: updateError } = await supabase
        .from('partner_withdrawal_requests')
        .update({
          status: 'approved',
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalRequestId)

      if (updateError) {
        console.error('Error approving withdrawal:', updateError)
        return NextResponse.json(
          { error: 'Failed to approve withdrawal' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Withdrawal request approved',
      })
    }

    // Handle processing (actually send the money via Stripe)
    if (action === 'process') {
      // Get partner user's Stripe Connect account
      const { data: partnerUser, error: partnerError } = await supabase
        .from('users')
        .select('stripe_connect_account_id')
        .eq('id', withdrawalRequest.user_id)
        .single()

      if (partnerError || !partnerUser) {
        return NextResponse.json(
          { error: 'Partner user not found' },
          { status: 404 }
        )
      }

      if (!partnerUser.stripe_connect_account_id) {
        return NextResponse.json(
          { error: 'Partner has not set up payment receiving. Please ask them to visit /managepayments to set up their account.' },
          { status: 400 }
        )
      }

      // Get organization owner's Stripe account (to send from)
      const { data: ownerUser, error: ownerError } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', user.id)
        .single()

      if (ownerError || !ownerUser?.stripe_customer_id) {
        return NextResponse.json(
          { error: 'Organization owner has not set up payment sending. Please add a payment method first.' },
          { status: 400 }
        )
      }

      // Calculate platform fee (2%)
      const platformFee = Math.round(withdrawalRequest.amount * 100 * 0.02)
      const transferAmount = Math.round(withdrawalRequest.amount * 100) - platformFee

      // Create a transfer to the partner's Stripe Connect account
      // Using Payment Intent with destination charge pattern
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(withdrawalRequest.amount * 100),
        currency: 'usd',
        customer: ownerUser.stripe_customer_id,
        application_fee_amount: platformFee,
        transfer_data: {
          destination: partnerUser.stripe_connect_account_id,
        },
        description: `Partner withdrawal: ${withdrawalRequest.amount} for invitation ${withdrawalRequest.partner_invitation_id}`,
        metadata: {
          withdrawal_request_id: withdrawalRequestId,
          partner_invitation_id: withdrawalRequest.partner_invitation_id,
          organization_id: withdrawalRequest.organization_id,
          type: 'partner_withdrawal',
        },
      })

      // Update withdrawal request with transfer ID and mark as completed
      const { error: updateError } = await supabase
        .from('partner_withdrawal_requests')
        .update({
          status: 'completed',
          stripe_transfer_id: paymentIntent.id,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalRequestId)

      if (updateError) {
        console.error('Error updating withdrawal request:', updateError)
        // Don't fail the request since payment was processed
      }

      // Ledger row: owner is payer, partner is recipient (RLS + Manage Payments).
      // Omit `metadata` unless the column exists — avoids PostgREST PGRST204 on insert.
      const partnerUserId = withdrawalRequest.user_id as string
      const baseLedger = {
        user_id: user.id,
        recipient_id: partnerUserId,
        amount: withdrawalRequest.amount,
        type: 'withdrawal',
        status: 'completed',
        project_id: null as string | null,
        stripe_payment_intent_id: paymentIntent.id,
      }

      let { error: transactionError } = await supabase.from('transactions').insert(baseLedger as never)
      if (transactionError) {
        const msg = transactionError.message ?? ''
        if (msg.includes('recipient_id') || msg.includes('stripe_payment_intent_id') || msg.includes('PGRST204')) {
          const { error: e2 } = await supabase.from('transactions').insert({
            user_id: user.id,
            amount: withdrawalRequest.amount,
            type: 'withdrawal',
            status: 'completed',
            project_id: null,
          })
          if (e2) {
            console.error('Error recording transaction:', transactionError, e2)
          } else {
            console.warn('[process-withdrawal] Apply migrations: recipient_id + stripe_payment_intent_id on transactions')
          }
        } else {
          console.error('Error recording transaction:', transactionError)
        }
      }

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        message: 'Withdrawal processed successfully',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal' },
      { status: 500 }
    )
  }
}








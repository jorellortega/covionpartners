import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { amount, partnerInvitationId, organizationId, financialReportId, notes } = await request.json()

    if (!amount || !partnerInvitationId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Withdrawal amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Verify partner has access
    const { data: partnerAccess, error: accessError } = await supabase
      .from('partner_access')
      .select('user_id, partner_invitation_id, partner_invitations!inner(organization_id, status, stripe_connect_onboarding_completed, stripe_connect_onboarding_url)')
      .eq('partner_invitation_id', partnerInvitationId)
      .eq('user_id', user.id)
      .single()

    if (accessError || !partnerAccess) {
      return NextResponse.json(
        { error: 'Partner access not found' },
        { status: 403 }
      )
    }

    if (partnerAccess.partner_invitations.status !== 'accepted') {
      return NextResponse.json(
        { error: 'Partner invitation not accepted' },
        { status: 403 }
      )
    }

    // Check if Stripe Connect onboarding is completed
    if (!partnerAccess.partner_invitations.stripe_connect_onboarding_completed) {
      return NextResponse.json(
        { 
          error: 'Stripe Connect onboarding required',
          requiresOnboarding: true,
          onboardingUrl: partnerAccess.partner_invitations.stripe_connect_onboarding_url || 'https://connect.stripe.com/setup/e/acct_1SXGEs9jVu4EeqMr/o2uHo472w1Fx'
        },
        { status: 400 }
      )
    }

    // Verify organization matches
    if (partnerAccess.partner_invitations.organization_id !== organizationId) {
      return NextResponse.json(
        { error: 'Organization mismatch' },
        { status: 400 }
      )
    }

    // If financial report is provided, verify the partner has profit share available
    if (financialReportId) {
      const { data: report, error: reportError } = await supabase
        .from('partner_financial_reports')
        .select('partner_profit_share, partner_invitation_id')
        .eq('id', financialReportId)
        .eq('partner_invitation_id', partnerInvitationId)
        .single()

      if (reportError || !report) {
        return NextResponse.json(
          { error: 'Financial report not found or access denied' },
          { status: 404 }
        )
      }

      if (report.partner_profit_share && amount > report.partner_profit_share) {
        return NextResponse.json(
          { error: `Withdrawal amount cannot exceed available profit share of ${report.partner_profit_share}` },
          { status: 400 }
        )
      }
    }

    // Check for existing pending requests
    const { data: pendingRequests, error: pendingError } = await supabase
      .from('partner_withdrawal_requests')
      .select('id, amount')
      .eq('partner_invitation_id', partnerInvitationId)
      .eq('status', 'pending')
      .eq('user_id', user.id)

    if (pendingError) {
      console.error('Error checking pending requests:', pendingError)
    }

    // Create withdrawal request
    const { data: withdrawalRequest, error: insertError } = await supabase
      .from('partner_withdrawal_requests')
      .insert({
        organization_id: organizationId,
        partner_invitation_id: partnerInvitationId,
        user_id: user.id,
        amount: amount,
        financial_report_id: financialReportId || null,
        notes: notes || null,
        status: 'pending',
        request_type: 'profit_share',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating withdrawal request:', insertError)
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      withdrawalRequest,
      message: 'Withdrawal request submitted successfully',
    })
  } catch (error: any) {
    console.error('Error creating withdrawal request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create withdrawal request' },
      { status: 500 }
    )
  }
}


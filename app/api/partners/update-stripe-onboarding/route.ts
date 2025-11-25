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

    const { partnerInvitationId, completed, accountId, onboardingUrl } = await request.json()

    if (!partnerInvitationId) {
      return NextResponse.json(
        { error: 'Missing partner invitation ID' },
        { status: 400 }
      )
    }

    // Verify partner has access
    const { data: partnerAccess, error: accessError } = await supabase
      .from('partner_access')
      .select('user_id, partner_invitation_id')
      .eq('partner_invitation_id', partnerInvitationId)
      .eq('user_id', user.id)
      .single()

    if (accessError || !partnerAccess) {
      return NextResponse.json(
        { error: 'Partner access not found' },
        { status: 403 }
      )
    }

    // Update Stripe Connect onboarding status
    const updateData: any = {
      stripe_connect_onboarding_completed: completed !== undefined ? completed : true,
      updated_at: new Date().toISOString()
    }

    if (accountId) {
      updateData.stripe_connect_account_id = accountId
    }

    if (onboardingUrl) {
      updateData.stripe_connect_onboarding_url = onboardingUrl
    }

    const { data: updatedInvitation, error: updateError } = await supabase
      .from('partner_invitations')
      .update(updateData)
      .eq('id', partnerInvitationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating Stripe onboarding status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update Stripe onboarding status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: updatedInvitation,
      message: 'Stripe Connect onboarding status updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating Stripe onboarding status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update Stripe onboarding status' },
      { status: 500 }
    )
  }
}


import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { message: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const { invitation_key } = await request.json()

    if (!invitation_key) {
      return NextResponse.json(
        { message: 'Invitation key is required' },
        { status: 400 }
      )
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('partner_invitations')
      .select('*, organizations(*)')
      .eq('invitation_key', invitation_key.trim())
      .eq('status', 'pending')
      .single()

    if (inviteError || !invitation) {
      return NextResponse.json(
        { message: 'Invalid or expired invitation key' },
        { status: 404 }
      )
    }

    // Check expiration
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { message: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Get projects for this organization that are assigned to this invitation
    const { data: accessList, error: accessError } = await supabase
      .from('partner_access')
      .select('*')
      .eq('partner_invitation_id', invitation.id)

    if (accessError) throw accessError

    // Update access to link to current user
    if (accessList && accessList.length > 0) {
      const { error: updateError } = await supabase
        .from('partner_access')
        .update({ user_id: session.user.id })
        .eq('partner_invitation_id', invitation.id)
        .is('user_id', null)

      if (updateError) throw updateError
    }

    // Update invitation status
    const { error: updateInviteError } = await supabase
      .from('partner_invitations')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateInviteError) throw updateInviteError

    return NextResponse.json({ 
      success: true,
      message: 'Invitation accepted successfully',
      invitation_id: invitation.id
    })
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}


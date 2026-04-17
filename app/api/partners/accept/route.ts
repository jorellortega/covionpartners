import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

/**
 * Accept a partner invitation by key.
 *
 * Uses the service role for partner_access / partner_invitations updates because RLS
 * hides rows where user_id IS NULL from the invitee — the client could not SELECT those
 * rows, so the old flow skipped linking user_id but still marked the invitation accepted.
 */
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ message: "Unauthorized — please log in again" }, { status: 401 })
    }

    const userId = session.user.id
    const userEmail = session.user.email ?? ""

    const body = await request.json()
    const invitation_key = typeof body?.invitation_key === "string" ? body.invitation_key : ""

    if (!invitation_key.trim()) {
      return NextResponse.json({ message: "Invitation key is required" }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      console.error("Missing SUPABASE URL or SERVICE_ROLE_KEY")
      return NextResponse.json({ message: "Server configuration error" }, { status: 500 })
    }

    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: invitation, error: inviteError } = await admin
      .from("partner_invitations")
      .select("id, organization_id, expires_at, status, invitation_key, email, organizations(*)")
      .eq("invitation_key", invitation_key.trim())
      .maybeSingle()

    if (inviteError) throw inviteError
    if (!invitation) {
      return NextResponse.json({ message: "Invalid invitation key" }, { status: 404 })
    }

    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ message: "This invitation has expired" }, { status: 400 })
    }

    const linkAccessToUser = async () => {
      const { error: updateError } = await admin
        .from("partner_access")
        .update({ user_id: userId })
        .eq("partner_invitation_id", invitation.id)
        .is("user_id", null)

      if (updateError) throw updateError
    }

    const wasPending = invitation.status === "pending"

    if (invitation.status === "pending") {
      await linkAccessToUser()

      const { error: updateInviteError } = await admin
        .from("partner_invitations")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitation.id)

      if (updateInviteError) throw updateInviteError
    } else if (invitation.status === "accepted") {
      // Repair broken accepts: invitation marked accepted but partner_access.user_id never linked (RLS bug)
      await linkAccessToUser()
    } else {
      return NextResponse.json(
        { message: "This invitation is no longer available" },
        { status: 400 }
      )
    }

    // Notify org owner once on first accept (best-effort)
    const organization = invitation.organizations as { owner_id?: string; name?: string } | null
    if (wasPending && organization?.owner_id) {
      const { data: partnerUser } = await admin
        .from("users")
        .select("id, name, email")
        .eq("id", userId)
        .maybeSingle()

      await admin.from("notifications").insert({
        user_id: organization.owner_id,
        type: "partner_invitation_accepted",
        title: "Partner Invitation Accepted",
        content: `${partnerUser?.name || userEmail || "A partner"} has accepted your partner invitation`,
        metadata: {
          partner_invitation_id: invitation.id,
          organization_id: invitation.organization_id,
          organization_name: organization.name || "Organization",
          partner_user_id: userId,
          partner_name: partnerUser?.name || userEmail || "Partner",
          partner_email: userEmail,
        },
        read: false,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
      invitation_id: invitation.id,
    })
  } catch (error: unknown) {
    console.error("Error accepting invitation:", error)
    const message = error instanceof Error ? error.message : "Failed to accept invitation"
    return NextResponse.json({ message }, { status: 500 })
  }
}

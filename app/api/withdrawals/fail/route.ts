import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { withdrawalId, reason } = body

    // Set up Supabase client
    const cookieStore = cookies()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Call the database function to handle the failed withdrawal
    const { data, error } = await supabase.rpc("handle_failed_withdrawal", {
      p_withdrawal_id: withdrawalId,
      p_failure_reason: reason || "Unknown error",
    })

    if (error) {
      console.error("Error handling failed withdrawal:", error)
      return NextResponse.json({ error: "Failed to process withdrawal failure" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal failure handled successfully. Your balance has been restored.",
    })
  } catch (error) {
    console.error("Error handling failed withdrawal:", error)
    return NextResponse.json({ error: "Failed to handle withdrawal failure" }, { status: 500 })
  }
}


import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
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

  try {
    // Get user's withdrawal history
    const { data, error } = await supabase
      .from("cvnpartners_withdrawals")
      .select("id, amount, payment_method, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching withdrawals:", error)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    return NextResponse.json({ withdrawals: data })
  } catch (error) {
    console.error("Error fetching withdrawal history:", error)
    return NextResponse.json({ error: "Failed to fetch withdrawal history" }, { status: 500 })
  }
}


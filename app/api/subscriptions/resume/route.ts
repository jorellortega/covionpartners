import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function POST() {
  try {
    // Set up Supabase client
    const cookieStore = cookies()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's subscription ID
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_id')
      .eq('id', user.id)
      .single()

    if (!userData?.subscription_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 })
    }

    // Resume the subscription
    const subscription = await stripe.subscriptions.update(userData.subscription_id, {
      pause_collection: null,
      cancel_at_period_end: false,
    })

    // Update subscription status in database
    await supabase
      .from('users')
      .update({
        subscription_status: subscription.status,
      })
      .eq('id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error resuming subscription:', err)
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    )
  }
} 
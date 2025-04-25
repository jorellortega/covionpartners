import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"

export async function GET() {
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

    // Get user's subscription details from the database
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_id, subscription_status, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!userData?.subscription_id) {
      return NextResponse.json({ subscription: null })
    }

    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(userData.subscription_id)

    // Get the product details for the subscription
    const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string)

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        tier_name: product.name,
        price_id: subscription.items.data[0].price.id,
      },
    })
  } catch (err) {
    console.error('Error fetching subscription:', err)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
} 
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // Get request data
  const { amount, paymentMethod, paymentDetails } = await request.json()

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
    // Determine which payment processor to use
    let paymentProcessor
    switch (paymentMethod) {
      case "plaid":
        paymentProcessor = "BANK_TRANSFER"
        break
      case "paypal":
        paymentProcessor = "PAYPAL"
        break
      case "stripe":
        paymentProcessor = "DEBIT_CARD"
        break
      default:
        return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }

    // Process withdrawal using the database function that handles race conditions
    const { data: withdrawalResult, error: withdrawalError } = await supabase.rpc("process_withdrawal", {
      p_user_id: user.id,
      p_amount: amount,
      p_payment_method: paymentProcessor,
      p_payment_details: JSON.stringify(paymentDetails),
    })

    if (withdrawalError) {
      console.error("Withdrawal error:", withdrawalError)
      return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 })
    }

    // Check if the withdrawal was successful
    if (!withdrawalResult.success) {
      return NextResponse.json(
        {
          error: withdrawalResult.message || "Withdrawal failed",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal processed successfully",
      withdrawalId: withdrawalResult.withdrawal_id,
    })
  } catch (error) {
    console.error("Error processing withdrawal:", error)
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 })
  }
}


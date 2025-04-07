import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Mock data for demonstration
    const mockWithdrawals = [
      {
        id: "w1",
        amount: 1000,
        payment_method: "Bank Transfer (ACH)",
        status: "completed",
        created_at: "2025-01-15T12:00:00Z",
      },
      {
        id: "w2",
        amount: 500,
        payment_method: "PayPal",
        status: "pending",
        created_at: "2025-02-22T15:30:00Z",
      },
      {
        id: "w3",
        amount: 250,
        payment_method: "Debit Card",
        status: "failed",
        created_at: "2025-03-10T09:15:00Z",
      },
    ]

    return NextResponse.json({ withdrawals: mockWithdrawals })
  } catch (error) {
    console.error("Error fetching withdrawal history:", error)
    return NextResponse.json({ error: "Failed to fetch withdrawal history" }, { status: 500 })
  }
}


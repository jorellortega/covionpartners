"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PaymentHistoryTable } from "../components/payment-history-table"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

interface Withdrawal {
  id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
}

// Mock data for demonstration
const MOCK_WITHDRAWALS: Withdrawal[] = [
  {
    id: "w1",
    amount: 0,
    payment_method: "Bank Transfer (ACH)",
    status: "completed",
    created_at: "2025-01-15T12:00:00Z",
  },
  {
    id: "w2",
    amount: 0,
    payment_method: "PayPal",
    status: "pending",
    created_at: "2025-02-22T15:30:00Z",
  },
  {
    id: "w3",
    amount: 0,
    payment_method: "Debit Card",
    status: "failed",
    created_at: "2025-03-10T09:15:00Z",
  },
]

export default function WithdrawalHistoryPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      // For demonstration purposes, use mock data instead of making an API call
      // This avoids potential URL pattern issues in the development environment

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Use mock data
      setWithdrawals(MOCK_WITHDRAWALS)

      /* 
      // Uncomment this code when deploying to production with proper API routes
      const response = await fetch("/api/withdrawals")
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch withdrawals")
      }
      
      const data = await response.json()
      if (data.withdrawals) {
        setWithdrawals(data.withdrawals)
      } else {
        throw new Error("Failed to fetch withdrawals")
      }
      */
    } catch (error) {
      console.error("Error fetching withdrawals:", error)
      setError("Failed to fetch withdrawals. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="inline-flex items-center text-white hover:text-blue-400 transition-colors">
            <Home className="w-6 h-6 mr-2" />
            Home
          </Link>
        </div>
      </header>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-5">Withdrawal History</h1>

        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : (
          <PaymentHistoryTable withdrawals={withdrawals} />
        )}

        <div className="mt-4">
          <Button
            variant="outline"
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}


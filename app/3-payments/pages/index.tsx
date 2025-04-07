"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { usePlaidLink } from "react-plaid-link"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PaymentMethodSelector } from "../components/payment-method-selector"
import { PaymentForm } from "../components/payment-form"
import { validateWithdrawal } from "../utils/payment-validators"
import { Home } from "lucide-react"
import { Button } from "@/components/ui/button"

// Update the mock balance to be in millions
const MOCK_BALANCE = 5000000

// Update the withdrawal limits to be higher
const WITHDRAWAL_LIMITS = {
  plaid: { min: 10000, max: 1000000 },
  paypal: { min: 5000, max: 500000 },
  stripe: { min: 5000, max: 250000 },
}

// Mock data for demonstration
const MOCK_LINK_TOKEN = "link-sandbox-12345"

export default function PaymentsPage() {
  const [balance, setBalance] = useState(MOCK_BALANCE)
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("plaid")

  // Payment method specific states
  const [linkedBankAccount, setLinkedBankAccount] = useState<string | null>(null)
  const [paypalEmail, setPaypalEmail] = useState("")
  const [cardDetails, setCardDetails] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  })

  const router = useRouter()

  // Plaid integration
  const onPlaidSuccess = useCallback((public_token: string, metadata: any) => {
    console.log("Plaid Link success:", public_token, metadata)
    setLinkedBankAccount(metadata.accounts[0]?.name || "Connected Bank Account")
  }, [])

  const { open, ready } = usePlaidLink({
    token: MOCK_LINK_TOKEN,
    onSuccess: onPlaidSuccess,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const amount = Number.parseFloat(withdrawalAmount)

    // Validate the withdrawal
    const validationResult = validateWithdrawal({
      amount,
      balance,
      paymentMethod,
      linkedBankAccount,
      paypalEmail,
      cardDetails,
    })

    if (!validationResult.isValid) {
      setError(validationResult.error || "Invalid withdrawal request")
      setIsLoading(false)
      return
    }

    try {
      // For demonstration purposes, simulate a successful API call
      // instead of making an actual API request

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Mock successful withdrawal
      // Simulate API response with requires_approval field
      const mockData = { requires_approval: Math.random() < 0.5 } // 50% chance of requiring approval

      if (mockData.requires_approval) {
        setSuccess(
          `Your withdrawal request of $${amount.toFixed(2)} via ${getPaymentMethodName(paymentMethod)} has been submitted for approval. You will be notified once it's approved.`,
        )
      } else {
        setSuccess(
          `Your withdrawal request of $${amount.toFixed(2)} via ${getPaymentMethodName(paymentMethod)} is being processed.`,
        )
      }
      setBalance((prevBalance) => prevBalance - amount)
      setWithdrawalAmount("")

      /* 
      // Uncomment this code when deploying to production with proper API routes
      const response = await fetch("/api/withdrawals/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          paymentMethod,
          paymentDetails: paymentMethod === "plaid" ? { linkedBankAccount } :
                          paymentMethod === "paypal" ? { email: paypalEmail } :
                          { card: cardDetails }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to process withdrawal")
      }

      // Success handling
      if (data.requires_approval) {
        setSuccess(
          `Your withdrawal request of $${amount.toFixed(2)} via ${getPaymentMethodName(paymentMethod)} has been submitted for approval. You will be notified once it's approved.`
        );
      } else {
        setSuccess(
          `Your withdrawal request of $${amount.toFixed(2)} via ${getPaymentMethodName(paymentMethod)} is being processed.`
        );
      }
      setBalance((prevBalance) => prevBalance - amount)
      setWithdrawalAmount("")
      */
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process withdrawal. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "plaid":
        return "Bank Transfer (ACH)"
      case "paypal":
        return "PayPal"
      case "stripe":
        return "Debit Card"
      default:
        return method
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
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800">
          <div>
            <h2 className="text-center text-3xl font-extrabold gradient-text">Withdrawal Request</h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Available Balance: <span className="font-bold text-green-400">${balance.toFixed(2)}</span>
            </p>
          </div>

          {error && <div className="bg-red-500 text-white p-3 rounded mb-4 text-center">{error}</div>}
          {success && <div className="bg-green-500 text-white p-3 rounded mb-4 text-center">{success}</div>}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <PaymentForm
              withdrawalAmount={withdrawalAmount}
              setWithdrawalAmount={setWithdrawalAmount}
              balance={balance}
              paymentMethod={paymentMethod}
            />

            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              linkedBankAccount={linkedBankAccount}
              paypalEmail={paypalEmail}
              setPaypalEmail={setPaypalEmail}
              cardDetails={cardDetails}
              setCardDetails={setCardDetails}
              openPlaid={open}
              plaidReady={ready}
            />

            <div>
              <Button type="submit" className="w-full gradient-button group relative" disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Withdrawal"}
              </Button>
            </div>
          </form>

          <div className="text-center mt-4">
            <Button
              variant="outline"
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


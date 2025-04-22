"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { usePlaidLink } from "react-plaid-link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Home, LinkIcon, CreditCard, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

// Custom PayPal icon since it's not in Lucide
function CustomPaypalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 11c.33-.47.67-.84 1-1.09C9 9 10 9 11 9h6c1 0 2 0 2.5.5s.5 1.5.5 2.5c0 2-1 3-3 3h-1c-.33 0-.67.33-1 1" />
      <path d="M7 5c.33-.47.67-.84 1-1.09C9 3 10 3 11 3h6c1 0 2 0 2.5.5S20 5 20 6c0 2-1 3-3 3h-1c-.33 0-.67.33-1 1" />
      <path d="M3 21h18" />
    </svg>
  )
}

// Define withdrawal limits by payment method
const WITHDRAWAL_LIMITS = {
  plaid: { min: 0, max: 0 },
  paypal: { min: 0, max: 0 },
  stripe: { min: 0, max: 0 },
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [balance, setBalance] = useState(0)
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
  const [stripeConnected, setStripeConnected] = useState(false)
  const [stripeAccountId, setStripeAccountId] = useState("")

  // Plaid integration
  const onPlaidSuccess = useCallback((public_token: string, metadata: any) => {
    console.log("Plaid Link success:", public_token, metadata)
    setLinkedBankAccount(metadata.accounts[0]?.name || "Connected Bank Account")
  }, [])

  const { open, ready } = usePlaidLink({
    token: "link-sandbox-12345", // Mock token
    onSuccess: onPlaidSuccess,
  })

  // Mock function to connect to Stripe
  const connectToStripe = async () => {
    setIsLoading(true)
    try {
      // In a real implementation, this would redirect to Stripe OAuth
      // For demo purposes, we'll simulate a successful connection
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStripeConnected(true)
      setStripeAccountId("acct_" + Math.random().toString(36).substring(2, 15))
      setSuccess("Successfully connected to Stripe account")
    } catch (err) {
      setError("Failed to connect to Stripe. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Mock function to disconnect from Stripe
  const disconnectStripe = () => {
    setStripeConnected(false)
    setStripeAccountId("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const amount = Number.parseFloat(withdrawalAmount)

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount")
      setIsLoading(false)
      return
    }

    // Check withdrawal limits
    const limits = WITHDRAWAL_LIMITS[paymentMethod as keyof typeof WITHDRAWAL_LIMITS]
    if (amount < limits.min) {
      setError(`Minimum withdrawal amount is $${limits.min} for ${getPaymentMethodName(paymentMethod)}`)
      setIsLoading(false)
      return
    }

    if (amount > limits.max) {
      setError(`Maximum withdrawal amount is $${limits.max} for ${getPaymentMethodName(paymentMethod)}`)
      setIsLoading(false)
      return
    }

    // Check balance
    if (amount > balance) {
      setError("Insufficient funds")
      setIsLoading(false)
      return
    }

    // Validate payment method specific details
    if (paymentMethod === "plaid" && !linkedBankAccount) {
      setError("Please link a bank account first")
      setIsLoading(false)
      return
    }

    if (paymentMethod === "paypal" && !paypalEmail) {
      setError("Please enter your PayPal email")
      setIsLoading(false)
      return
    }

    if (paymentMethod === "stripe" && !stripeConnected) {
      setError("Please connect your Stripe account first")
      setIsLoading(false)
      return
    }

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Determine if withdrawal requires approval (amounts over $1000)
      const requiresApproval = amount >= 1000

      // Mock successful withdrawal
      if (requiresApproval) {
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
    } catch (error) {
      setError("Failed to process withdrawal. Please try again.")
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
        return "Stripe"
      default:
        return method
    }
  }

  const renderPaymentMethodContent = () => {
    switch (paymentMethod) {
      case "plaid":
        return (
          <div className="mb-4">
            <Label className="block text-sm font-medium text-white/90 mb-1">Bank Account</Label>
            {linkedBankAccount ? (
              <div className="leonardo-input flex items-center">
                <LinkIcon className="w-5 h-5 mr-2 text-green-400" />
                {linkedBankAccount}
              </div>
            ) : (
              <Button type="button" onClick={() => open()} disabled={!ready} className="gradient-button w-full">
                <LinkIcon className="w-5 h-5 mr-2" />
                Link Bank Account
              </Button>
            )}
            <p className="text-xs text-white/70 mt-2">
              Securely connect your bank account for ACH transfers. Typically takes 1-3 business days.
            </p>
          </div>
        )

      case "paypal":
        return (
          <div className="mb-4">
            <Label htmlFor="paypal-email" className="block text-sm font-medium text-white/90 mb-1">
              PayPal Email
            </Label>
            <Input
              id="paypal-email"
              type="email"
              placeholder="Enter your PayPal email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              className="leonardo-input"
              required
            />
            <p className="text-xs text-white/70 mt-2">
              Funds will be sent to this PayPal account. Usually processed within 24 hours.
            </p>
          </div>
        )

      case "stripe":
        return (
          <div className="mb-4">
            <Label className="block text-sm font-medium text-white/90 mb-1">Stripe Account</Label>
            {stripeConnected ? (
              <div className="space-y-4">
                <div className="leonardo-input flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-green-400" />
                  Connected to Stripe Account: {stripeAccountId}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={disconnectStripe}
                  className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-gray-700/50"
                >
                  Disconnect Stripe Account
                </Button>
              </div>
            ) : (
              <Button type="button" onClick={connectToStripe} disabled={isLoading} className="gradient-button w-full">
                <LogIn className="w-5 h-5 mr-2" />
                {isLoading ? "Connecting..." : "Connect Stripe Account"}
              </Button>
            )}
            <p className="text-xs text-white/70 mt-2">
              Connect your Stripe account to receive funds directly. Usually processed within 2-3 business days.
            </p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Payments</h1>
          </div>
        </div>
      </header>

      {/* Under Development Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-400">Under Development</h3>
            <div className="mt-2 text-sm text-yellow-300">
              <p>This page is currently under development. The content shown is for demonstration purposes only.</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 opacity-50">
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full leonardo-card p-8">
            <div>
              <h2 className="text-center text-3xl font-extrabold gradient-text">Withdrawal Request</h2>
              <p className="mt-2 text-center text-sm text-white/70">
                Available Balance: <span className="font-bold text-green-400">${balance.toFixed(2)}</span>
              </p>
            </div>
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded mb-4 text-center">{error}</div>
            )}
            {success && (
              <div className="bg-green-500/20 border border-green-500 text-green-400 p-3 rounded mb-4 text-center">
                {success}
              </div>
            )}
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="mb-4">
                <Label htmlFor="withdrawal-amount" className="block text-sm font-medium text-white/90 mb-1">
                  Withdrawal Amount
                </Label>
                <Input
                  id="withdrawal-amount"
                  type="number"
                  step="0.01"
                  min={WITHDRAWAL_LIMITS[paymentMethod as keyof typeof WITHDRAWAL_LIMITS].min}
                  max={Math.min(balance, WITHDRAWAL_LIMITS[paymentMethod as keyof typeof WITHDRAWAL_LIMITS].max)}
                  placeholder="Enter amount to withdraw"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  className="leonardo-input"
                  required
                />
                <p className="text-xs text-white/70 mt-1">
                  Min: ${WITHDRAWAL_LIMITS[paymentMethod as keyof typeof WITHDRAWAL_LIMITS].min} | Max: $
                  {Math.min(balance, WITHDRAWAL_LIMITS[paymentMethod as keyof typeof WITHDRAWAL_LIMITS].max)}
                </p>
              </div>

              <div className="mb-4">
                <Label className="block text-sm font-medium text-white/90 mb-1">Payment Method</Label>
                <Tabs defaultValue="plaid" value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                  <TabsList className="leonardo-tabs flex mb-4">
                    <TabsTrigger value="plaid" className="leonardo-tab flex-1 flex items-center justify-center">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Bank</span>
                    </TabsTrigger>
                    <TabsTrigger value="paypal" className="leonardo-tab flex-1 flex items-center justify-center">
                      <CustomPaypalIcon className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">PayPal</span>
                    </TabsTrigger>
                    <TabsTrigger value="stripe" className="leonardo-tab flex-1 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Stripe</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="plaid">{renderPaymentMethodContent()}</TabsContent>
                  <TabsContent value="paypal">{renderPaymentMethodContent()}</TabsContent>
                  <TabsContent value="stripe">{renderPaymentMethodContent()}</TabsContent>
                </Tabs>
              </div>

              <div>
                <Button type="submit" className="gradient-button w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Confirm Withdrawal"}
                </Button>
              </div>
            </form>
            <div className="text-center mt-4">
              <Button
                variant="outline"
                className="text-blue-300 hover:text-blue-200 transition-colors duration-200 border border-blue-500/30 hover:border-blue-500/50 bg-transparent"
                onClick={() => router.push("/dashboard")}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}


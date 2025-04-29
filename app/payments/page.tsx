"use client"

import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, DollarSign, RefreshCw, Wallet } from "lucide-react"
import { PaymentMethodSelector } from "../3-payments/components/payment-method-selector"
import { PaymentHistoryTable } from "../3-payments/components/payment-history-table"

// Placeholder data for payment methods and history
const mockPaymentMethods = [
  { id: "1", type: "stripe", last4: "4242", isDefault: true },
  { id: "2", type: "paypal", email: "user@email.com", isDefault: false },
  { id: "3", type: "plaid", bank: "Bank of America", isDefault: false },
]
const mockWithdrawals = [
  { id: "w1", amount: 100, payment_method: "stripe", status: "completed", created_at: new Date().toISOString() },
  { id: "w2", amount: 50, payment_method: "paypal", status: "pending", created_at: new Date().toISOString() },
]

export default function PaymentsAccountPage() {
  // State for payment method selector
  const [paymentMethod, setPaymentMethod] = useState("stripe")
  const [paypalEmail, setPaypalEmail] = useState("")
  const [linkedBankAccount, setLinkedBankAccount] = useState<string | null>(null)
  const [cardDetails, setCardDetails] = useState({ name: "", number: "", expiry: "", cvc: "" })
  const [plaidReady] = useState(true)

  // Placeholder for openPlaid
  const openPlaid = () => alert("Plaid flow would open here.")

  // Placeholder for setting default
  const setDefault = (id: string) => alert(`Set ${id} as default payment method`)

  // Placeholder for removing a method
  const removeMethod = (id: string) => alert(`Remove payment method ${id}`)

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Account & Payments</h1>
      <div className="space-y-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Manage your payment methods, withdrawals, and subscriptions.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="flex-1 min-w-[180px]">
              <Link href="/settings?tab=banking">
                <CreditCard className="w-4 h-4 mr-2" /> Payment Methods
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 min-w-[180px]">
              <Link href="/withdraw">
                <Wallet className="w-4 h-4 mr-2" /> Withdraw Funds
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 min-w-[180px]">
              <Link href="/settings?tab=subscription">
                <RefreshCw className="w-4 h-4 mr-2" /> Subscription
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Saved Payment Methods</CardTitle>
          <CardDescription>Manage your saved payment methods and set a default.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPaymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between bg-gray-800/30 rounded p-3 mb-2">
                <div className="flex items-center gap-3">
                  {method.type === "stripe" && <CreditCard className="w-5 h-5 text-blue-400" />}
                  {method.type === "paypal" && <span className="text-blue-400 font-bold">PayPal</span>}
                  {method.type === "plaid" && <span className="text-green-400 font-bold">Bank</span>}
                  <span className="text-white font-medium">
                    {method.type === "stripe" && `Card •••• ${method.last4}`}
                    {method.type === "paypal" && method.email}
                    {method.type === "plaid" && method.bank}
                  </span>
                  {method.isDefault && <span className="ml-2 px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">Default</span>}
                </div>
                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => setDefault(method.id)}>
                      Set Default
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => removeMethod(method.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            <div className="mt-4">
              <PaymentMethodSelector
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                linkedBankAccount={linkedBankAccount}
                paypalEmail={paypalEmail}
                setPaypalEmail={setPaypalEmail}
                cardDetails={cardDetails}
                setCardDetails={setCardDetails}
                openPlaid={openPlaid}
                plaidReady={plaidReady}
              />
              <Button className="w-full mt-2">Add Payment Method</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment & Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment & Withdrawal History</CardTitle>
          <CardDescription>View your past payments and withdrawals.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentHistoryTable withdrawals={mockWithdrawals} />
        </CardContent>
      </Card>
    </div>
  )
} 
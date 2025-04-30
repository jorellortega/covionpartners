"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CreditCard, Banknote, Bitcoin, Plus } from "lucide-react"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js/pure"
import PaymentForm from "./PaymentForm"
import SavedPaymentsList from "./SavedPaymentsList"
import { useAuth } from "@/hooks/useAuth"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentMethodSelectorProps {
  onPaymentMethodSelected: (method: string) => void
  selectedMethod: string
}

export default function PaymentMethodSelector({ onPaymentMethodSelected, selectedMethod }: PaymentMethodSelectorProps) {
  const { user } = useAuth()
  const [showAddCard, setShowAddCard] = useState(false)
  const [savedPayments, setSavedPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const fetchSavedPayments = async () => {
        try {
          const response = await fetch('/api/payments/saved', {
            credentials: 'include',
          })
          const data = await response.json()
          if (response.ok) {
            setSavedPayments(data)
          }
        } catch (error) {
          console.error('Error fetching saved payments:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchSavedPayments()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleSavedCardSelect = (paymentMethodId: string) => {
    onPaymentMethodSelected(paymentMethodId)
    setShowAddCard(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Payment Method</h3>
      
      {/* Show saved payment methods for logged-in users */}
      {user && savedPayments.length > 0 && (
        <div className="space-y-4 mb-4">
          <div className="space-y-2">
            {savedPayments.map((payment) => (
              <div
                key={payment.id}
                onClick={() => handleSavedCardSelect(payment.id)}
                className={`cursor-pointer p-4 rounded-lg border ${
                  selectedMethod === payment.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
                } transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-white">
                        {payment.card.brand} •••• {payment.card.last4}
                      </p>
                      <p className="text-sm text-gray-400">
                        Expires {payment.card.exp_month}/{payment.card.exp_year}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment method options */}
      <div className="grid grid-cols-3 gap-4">
        <Button
          variant={selectedMethod === "new_card" ? "default" : "outline"}
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={() => {
            onPaymentMethodSelected("new_card")
            setShowAddCard(true)
          }}
        >
          {user ? (
            <>
              <Plus className="w-5 h-5" />
              <span className="text-sm">New Card</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              <span className="text-sm">Credit Card</span>
            </>
          )}
        </Button>
        <Button
          variant={selectedMethod === "bank" ? "default" : "outline"}
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={() => onPaymentMethodSelected("bank")}
        >
          <Banknote className="w-5 h-5" />
          <span className="text-sm">Bank Transfer</span>
        </Button>
        <Button
          variant={selectedMethod === "crypto" ? "default" : "outline"}
          className="flex flex-col items-center gap-2 h-auto py-4"
          onClick={() => onPaymentMethodSelected("crypto")}
        >
          <Bitcoin className="w-5 h-5" />
          <span className="text-sm">Cryptocurrency</span>
        </Button>
      </div>

      {/* Show payment form when adding a new card */}
      {(selectedMethod === "new_card" || (!user && selectedMethod === "card")) && showAddCard && (
        <div className="mt-4">
          <Elements stripe={stripePromise}>
            <PaymentForm />
          </Elements>
        </div>
      )}
    </div>
  )
} 
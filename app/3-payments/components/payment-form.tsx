"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

// Define withdrawal limits by payment method
const WITHDRAWAL_LIMITS = {
  plaid: { min: 10000, max: 1000000 },
  paypal: { min: 5000, max: 500000 },
  stripe: { min: 5000, max: 250000 },
}

interface PaymentFormProps {
  withdrawalAmount: string
  setWithdrawalAmount: (value: string) => void
  balance: number
  paymentMethod: string
}

export function PaymentForm({ withdrawalAmount, setWithdrawalAmount, balance, paymentMethod }: PaymentFormProps) {
  const limits = WITHDRAWAL_LIMITS[paymentMethod as keyof typeof WITHDRAWAL_LIMITS] || { min: 1, max: 1000 }

  return (
    <div className="mb-4">
      <Label htmlFor="withdrawal-amount" className="block text-sm font-medium text-gray-300 mb-1">
        Withdrawal Amount
      </Label>
      <Input
        id="withdrawal-amount"
        type="number"
        step="0.01"
        min={limits.min}
        max={Math.min(balance, limits.max)}
        placeholder={`Enter amount to withdraw (min: $${limits.min}, max: $${limits.max})`}
        value={withdrawalAmount}
        onChange={(e) => setWithdrawalAmount(e.target.value)}
        className="bg-gray-800 border-gray-700 text-white"
        required
      />
      <p className="text-xs text-gray-400 mt-1">
        Min: ${limits.min} | Max: ${Math.min(balance, limits.max)}
      </p>
    </div>
  )
}


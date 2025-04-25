"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface SubscriptionCheckoutProps {
  priceId: string
  onSuccess?: () => void
}

function CheckoutForm({ priceId, onSuccess }: SubscriptionCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)

    try {
      // Create the subscription
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      })

      const { subscriptionId, clientSecret } = await response.json()

      if (!response.ok) {
        throw new Error('Failed to create subscription')
      }

      // Confirm the payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/account?subscription=success`,
        },
      })

      if (error) {
        throw error
      }

      toast.success('Subscription created successfully!')
      onSuccess?.()
      router.push('/account')
    } catch (err) {
      console.error('Payment error:', err)
      toast.error('Failed to process payment. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full gradient-button"
        disabled={!stripe || isLoading}
      >
        {isLoading ? 'Processing...' : 'Subscribe Now'}
      </Button>
    </form>
  )
}

export function SubscriptionCheckout({ priceId, onSuccess }: SubscriptionCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string>()

  useEffect(() => {
    // Create a payment intent
    fetch('/api/subscriptions/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret)
      })
  }, [priceId])

  if (!clientSecret) {
    return <div>Loading...</div>
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'night',
          variables: {
            colorPrimary: '#7C3AED',
            colorBackground: '#0F172A',
            colorText: '#F8FAFC',
            colorDanger: '#EF4444',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '4px',
          },
        },
      }}
    >
      <CheckoutForm priceId={priceId} onSuccess={onSuccess} />
    </Elements>
  )
} 
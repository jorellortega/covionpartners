import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PublicPaymentFormProps {
  clientSecret: string
  onSuccess: () => void
}

function PublicPaymentForm({ clientSecret, onSuccess }: PublicPaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/purchase2support/success`,
        },
        redirect: 'if_required',
      })

      if (error) {
        throw error
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess()
      }
    } catch (error) {
      console.error('Payment error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full gradient-button"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>
    </form>
  )
}

interface PublicPaymentOptionsProps {
  amount: number
  projectId: string
  onSuccess: () => void
}

export default function PublicPaymentOptions({ amount, projectId, onSuccess }: PublicPaymentOptionsProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    initializePayment()
  }, [amount, projectId])

  const initializePayment = async () => {
    if (!amount || amount <= 0) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          projectId,
          isPublicDonation: true,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error('Error creating payment intent:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#8B5CF6',
      colorBackground: '#1E293B',
      colorText: '#F1F5F9',
      colorDanger: '#EF4444',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      borderRadius: '0.5rem',
      fontSizeSm: '0.875rem',
      spacingUnit: '4px',
      spacingGridRow: '16px'
    },
    rules: {
      '.Input': {
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
      },
      '.Input:hover': {
        border: '1px solid #475569',
      },
      '.Input:focus': {
        border: '1px solid #8B5CF6',
        boxShadow: '0 0 0 1px #8B5CF6',
      },
      '.Input--invalid': {
        border: '1px solid #EF4444',
      },
      '.Label': {
        color: '#94A3B8',
      },
      '.Tab': {
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
      },
      '.Tab:hover': {
        border: '1px solid #475569',
      },
      '.Tab--selected': {
        backgroundColor: '#1E293B',
        border: '1px solid #8B5CF6',
      },
      '.TabIcon': {
        color: '#94A3B8',
      },
      '.TabIcon--selected': {
        color: '#F1F5F9',
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Payment Options</h3>
      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance,
          }}
        >
          <PublicPaymentForm
            clientSecret={clientSecret}
            onSuccess={onSuccess}
          />
        </Elements>
      )}
    </div>
  )
} 
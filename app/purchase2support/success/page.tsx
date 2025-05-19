"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent')
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')
    const redirectStatus = searchParams.get('redirect_status')

    if (redirectStatus === 'succeeded') {
      toast.success('Payment successful! Thank you for your support.')
    } else if (redirectStatus === 'failed') {
      toast.error('Payment failed. Please try again.')
    }

    // Redirect to main page after 5 seconds
    const timeout = setTimeout(() => {
      router.push('/purchase2support')
    }, 5000)

    setIsLoading(false)

    return () => clearTimeout(timeout)
  }, [router, searchParams])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-gray-800">
        <CardHeader>
          <CardTitle className="text-center">Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <p className="text-gray-400">
              Your payment has been processed successfully. You will be redirected to the main page in a few seconds.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/purchase2support')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
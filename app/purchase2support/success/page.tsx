"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { jsPDF } from 'jspdf'

function SuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)

  // Example: get details from search params or fallback
  const projectName = searchParams.get('project') || 'Project'
  const supporterName = searchParams.get('name') || 'Supporter'
  const amount = searchParams.get('amount') || ''
  const date = new Date().toLocaleDateString()

  const handleDownloadCertificate = () => {
    const doc = new jsPDF()
    doc.setFontSize(22)
    doc.text('Certificate of Support', 20, 30)
    doc.setFontSize(14)
    doc.text(`This certifies that`, 20, 50)
    doc.setFontSize(16)
    doc.text(`${supporterName}`, 20, 65)
    doc.setFontSize(14)
    doc.text(`has supported the project`, 20, 80)
    doc.setFontSize(16)
    doc.text(`${projectName}`, 20, 95)
    doc.setFontSize(14)
    doc.text(`with a contribution of $${amount}`, 20, 110)
    doc.text(`on ${date}`, 20, 125)
    doc.setFontSize(12)
    doc.text('Thank you for your generous support!', 20, 145)
    doc.text('Covion Partners', 20, 160)
    doc.save('thank-you-certificate.pdf')
  }

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
              variant="default"
              className="w-full"
              onClick={handleDownloadCertificate}
            >
              Download Certificate
            </Button>
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

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  )
} 
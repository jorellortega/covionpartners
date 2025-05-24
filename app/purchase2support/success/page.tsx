"use client"

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const TOKEN_IMAGE_URL = "https://uytqyfpjdevrqmwqfthk.supabase.co/storage/v1/object/public/partnerfiles/branding/handshake.png"

function SuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)

  // Example: get details from search params or fallback
  const projectName = searchParams.get('project') || 'Project'
  const supporterName = searchParams.get('name') || 'Supporter'
  const amount = searchParams.get('amount') || ''
  const certificateNumber = searchParams.get('certificate_number') || 'CP-XXXXXX'
  const tokenSerial = searchParams.get('token_serial') || 'CP-XXXXXX'
  const date = new Date().toLocaleDateString()

  const handleDownloadCertificate = async () => {
    const certificateElement = document.getElementById('certificate-image')
    if (certificateElement) {
      const canvas = await html2canvas(certificateElement, { backgroundColor: null, width: 240, height: 320, scale: 2 })
      const link = document.createElement('a')
      link.download = `certificate-${certificateNumber}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  const handleDownloadToken = async () => {
    const tokenElement = document.getElementById('token-image')
    if (tokenElement) {
      const canvas = await html2canvas(tokenElement, { backgroundColor: null, width: 240, height: 320, scale: 2 })
      const link = document.createElement('a')
      link.download = `token-${tokenSerial}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  useEffect(() => {
    const redirectStatus = searchParams.get('redirect_status')
    if (redirectStatus === 'succeeded') {
      toast.success('Payment successful! Thank you for your support.')
    } else if (redirectStatus === 'failed') {
      toast.error('Payment failed. Please try again.')
    }
    setIsLoading(false)
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
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Certificate Card */}
        <Card className="border-4 border-[#7c3aed] bg-[#141414] shadow-2xl relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-serif tracking-wide mb-2 bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
              Certificate of Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-2 py-4 font-serif text-white">
              <div id="certificate-image" className="flex flex-col items-center justify-center" style={{ width: 240, height: 320 }}>
                <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 240, height: 320, display: 'block', borderRadius: 24, boxShadow: '0 4px 24px #0008' }}>
                  <defs>
                    <linearGradient id="cert-bg" x1="0" y1="0" x2="1600" y2="2240" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4f46e5" />
                      <stop offset="0.5" stopColor="#7c3aed" />
                      <stop offset="1" stopColor="#ec4899" />
                    </linearGradient>
                    <radialGradient id="cert-shine" cx="50%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect x="40" y="40" width="1520" height="2160" rx="80" fill="url(#cert-bg)" stroke="#fff" strokeWidth="16" />
                  <rect x="40" y="40" width="1520" height="2160" rx="80" fill="url(#cert-shine)" />
                  <text x="50%" y="240" textAnchor="middle" fontSize="160" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="8">CERTIFICATE</text>
                  <text x="50%" y="380" textAnchor="middle" fontSize="72" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif" letterSpacing="8">COVION PARTNERS</text>
                  <circle cx="800" cy="1100" r="400" fill="#141414" stroke="#fff" strokeWidth="12" />
                  <image href={TOKEN_IMAGE_URL} x="500" y="800" width="600" height="600" style={{ filter: 'drop-shadow(0 0 24px #7c3aed88)' }} />
                  <text x="50%" y="1500" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">This certifies that</text>
                  <text x="50%" y="1600" textAnchor="middle" fontSize="64" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{supporterName}</text>
                  <text x="50%" y="1700" textAnchor="middle" fontSize="40" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">has supported {projectName}</text>
                  <text x="50%" y="1800" textAnchor="middle" fontSize="32" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">on {date}</text>
                  <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{certificateNumber}</text>
                  <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif">Certificate Number</text>
                </svg>
              </div>
              <Button className="mt-6 w-full" onClick={handleDownloadCertificate}>
                Download Certificate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Token Card */}
        <Card className="border-4 border-[#7c3aed] bg-[#141414] shadow-2xl relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-serif tracking-wide mb-2 bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
              Digital Token
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <div id="token-image" className="flex flex-col items-center justify-center" style={{ width: 240, height: 320 }}>
              <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 240, height: 320, display: 'block', borderRadius: 24, boxShadow: '0 4px 24px #0008' }}>
                <defs>
                  <linearGradient id="card-bg" x1="0" y1="0" x2="1600" y2="2240" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4f46e5" />
                    <stop offset="0.5" stopColor="#7c3aed" />
                    <stop offset="1" stopColor="#ec4899" />
                  </linearGradient>
                  <radialGradient id="shine" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <rect x="40" y="40" width="1520" height="2160" rx="80" fill="url(#card-bg)" stroke="#fff" strokeWidth="16" />
                <rect x="40" y="40" width="1520" height="2160" rx="80" fill="url(#shine)" />
                <text x="50%" y="240" textAnchor="middle" fontSize="160" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="8">TOKEN</text>
                <text x="50%" y="380" textAnchor="middle" fontSize="72" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif" letterSpacing="8">COVION PARTNERS</text>
                <circle cx="800" cy="1100" r="400" fill="#141414" stroke="#fff" strokeWidth="12" />
                <image href={TOKEN_IMAGE_URL} x="500" y="800" width="600" height="600" style={{ filter: 'drop-shadow(0 0 24px #7c3aed88)' }} />
                <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{tokenSerial}</text>
                <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif">Serial Number</text>
              </svg>
            </div>
            <div className="text-xs text-gray-300 mt-1">
              Serial: {tokenSerial}
            </div>
            <Button className="mt-6 w-full" onClick={handleDownloadToken}>
              Download Token
            </Button>
          </CardContent>
        </Card>
      </div>
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
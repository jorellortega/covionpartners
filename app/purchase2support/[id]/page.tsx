"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Heart,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Project status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "on hold":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getStatusStyles()} border`} variant="outline">
      {status}
    </Badge>
  )
}

function PaymentForm({ clientSecret, onSuccess }: { clientSecret: string, onSuccess: () => void }) {
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
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.')
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
            <LoadingSpinner className="w-4 h-4 mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Heart className="w-4 h-4 mr-2" />
            Complete Support
          </>
        )}
      </Button>
    </form>
  )
}

// Token image URL (handshake logo as token)
const TOKEN_IMAGE_URL = "https://uytqyfpjdevrqmwqfthk.supabase.co/storage/v1/object/public/partnerfiles/branding/handshake.png"

export default function DonationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error } = useProjects()
  const [donationAmount, setDonationAmount] = useState("")
  const [message, setMessage] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [donationSuccess, setDonationSuccess] = useState(false)

  const resolvedParams = use(params)
  const project = projects?.find(p => p.id === resolvedParams.id)

  useEffect(() => {
    if (donationSuccess) {
      router.push("/purchase2support/success")
    }
  }, [donationSuccess, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">Error loading project details</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 2) {
                router.back();
              } else {
                router.push('/purchase2support');
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const handleDonate = async () => {
    if (!donationAmount || isNaN(Number(donationAmount)) || Number(donationAmount) <= 0) {
      toast.error("Please enter a valid donation amount")
      return
    }

    try {
      const response = await fetch('/api/purchase2support/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          amount: parseFloat(donationAmount),
          message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      setClientSecret(data.clientSecret)
    } catch (error) {
      console.error('Payment intent error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to process payment. Please try again.")
    }
  }

  // Calculate fees for summary (user pays exactly the entered amount)
  const supportAmount = parseFloat(donationAmount) || 0
  const stripeFee = supportAmount > 0 ? (supportAmount * 0.029 + 0.30) : 0
  const platformFee = supportAmount > 0 ? (supportAmount * 0.02) : 0
  const netAmount = supportAmount - stripeFee - platformFee

  // Certificate preview data
  const supporterName = user?.name || user?.email || 'Supporter'
  const projectName = project?.name || 'Project'
  const date = new Date().toLocaleDateString()

  const handleDownloadCertificate = async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    doc.setFillColor(20, 20, 20)
    doc.rect(0, 0, 842, 595, 'F')
    doc.setDrawColor('#7c3aed')
    doc.setLineWidth(8)
    doc.roundedRect(30, 30, 782, 535, 24, 24, 'S')
    // Load token image and add to PDF
    const img = new window.Image()
    img.crossOrigin = 'Anonymous'
    img.src = TOKEN_IMAGE_URL
    img.onload = function () {
      doc.addImage(img, 'PNG', 90, 80, 120, 120, undefined, 'FAST')
      doc.setFont('times', 'bold')
      doc.setTextColor('#7c3aed')
      doc.setFontSize(36)
      doc.text('Certificate of Support', 421, 110, { align: 'center' })
      doc.setFont('times', 'italic')
      doc.setFontSize(18)
      doc.setTextColor('#fff')
      doc.text('This certifies that', 421, 170, { align: 'center' })
      doc.setFont('times', 'bold')
      doc.setFontSize(28)
      doc.setTextColor('#fff')
      doc.text(supporterName, 421, 210, { align: 'center' })
      doc.setFont('times', 'italic')
      doc.setFontSize(18)
      doc.setTextColor('#fff')
      doc.text('has generously supported the project', 421, 250, { align: 'center' })
      doc.setFont('times', 'bold')
      doc.setFontSize(24)
      doc.setTextColor('#7c3aed')
      doc.text(projectName, 421, 290, { align: 'center' })
      doc.setFont('times', 'normal')
      doc.setFontSize(18)
      doc.setTextColor('#4f46e5')
      doc.text(`with a contribution of $${supportAmount.toFixed(2)}`, 421, 330, { align: 'center' })
      doc.setFontSize(16)
      doc.setTextColor('#fff')
      doc.text(`on ${date}`, 421, 370, { align: 'center' })
      // Seal
      doc.setFillColor('#7c3aed')
      doc.circle(421, 440, 48, 'F')
      doc.setFont('times', 'bold')
      doc.setFontSize(22)
      doc.setTextColor('#fff')
      doc.text('Thank You', 421, 448, { align: 'center' })
      // Footer
      doc.setFont('times', 'italic')
      doc.setFontSize(14)
      doc.setTextColor('#ec4899')
      doc.text('Covion Partners', 421, 520, { align: 'center' })
      doc.save('thank-you-certificate.pdf')
    }
  }

  // Generate a unique token serial number (timestamp-based for demo)
  const tokenSerial = `CP-${Date.now().toString().slice(-8)}`

  // Download the token as PNG
  const handleDownloadToken = async () => {
    const tokenElement = document.getElementById('covion-token-image')
    if (tokenElement) {
      // Render at 1600x2240 for high-res download
      const canvas = await html2canvas(tokenElement, { backgroundColor: null, width: 1600, height: 2240, scale: 1 })
      const link = document.createElement('a')
      link.download = `${tokenSerial}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-purple-400"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 2) {
                router.back();
              } else {
                router.push('/purchase2support');
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Support This Project</h1>
            <p className="text-gray-400">Make a support to help this project succeed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Information */}
            <Card className="border-gray-800">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                    {project.media_files && project.media_files.length > 0 ? (
                      <Image
                        src={project.media_files[0].url}
                        alt={project.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-purple-400/50" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{project.name}</CardTitle>
                      <StatusBadge status={project.status} />
                    </div>
                    <CardDescription className="text-gray-400">
                      {project.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-pink-500/10 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center text-pink-400">
                      <Heart className="w-4 h-4 mr-2" />
                      <span>Support Progress</span>
                    </div>
                    <span className="text-white font-medium">
                      ${project.current_funding?.toLocaleString() || '0'} / ${project.funding_goal?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-pink-500 h-2 rounded-full"
                      style={{ 
                        width: `${project.funding_goal && project.current_funding 
                          ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Donation Form */}
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle>Purchase to Support</CardTitle>
                <CardDescription>Choose your support amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Large Previews of Certificate and Token, side by side, full width */}
                  <div className="flex items-center justify-center gap-8 mb-4 w-full">
                    {/* Certificate preview */}
                    <div className="flex flex-col items-center">
                      <div className="border-2 border-[#7c3aed] rounded-lg overflow-hidden" style={{ width: 120, height: 84, background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="text-base text-white font-serif">Certificate</span>
                      </div>
                      <span className="text-xs text-gray-300 mt-2 text-center max-w-[120px]">Downloadable Certificate of Support</span>
                    </div>
                    {/* Token preview */}
                    <div className="flex flex-col items-center">
                      <div className="border-2 border-[#7c3aed] rounded-lg overflow-hidden" style={{ width: 96, height: 144, background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="72" height="108" viewBox="0 0 48 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="4" y="4" width="40" height="64" rx="8" fill="url(#tokenCardMini)" stroke="#fff" strokeWidth="3" />
                          <defs>
                            <linearGradient id="tokenCardMini" x1="0" y1="0" x2="48" y2="72" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#4f46e5" />
                              <stop offset="0.5" stopColor="#7c3aed" />
                              <stop offset="1" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                          <circle cx="24" cy="36" r="16" fill="#141414" stroke="#fff" strokeWidth="2" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-300 mt-2 text-center max-w-[96px]">Unique Digital Token Card</span>
                    </div>
                  </div>
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-4">
                    {[10, 25, 50, 100, 250, 500].map((amount) => (
                      <Button
                        key={amount}
                        variant={donationAmount === amount.toString() ? "default" : "outline"}
                        className="border-gray-700"
                        onClick={() => setDonationAmount(amount.toString())}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>

                  {/* Custom Amount Input */}
                  <div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="number"
                        placeholder="Enter custom amount"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <Textarea
                      placeholder="Add a message of support (optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  {/* Payment Form */}
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <PaymentForm 
                        clientSecret={clientSecret} 
                        onSuccess={() => {
                          toast.success(`Thank you for your support of $${donationAmount} to ${project.name}!`)
                          setDonationSuccess(true)
                        }} 
                      />
                    </Elements>
                  ) : (
                    <Button
                      className="w-full gradient-button"
                      onClick={handleDonate}
                      disabled={!donationAmount}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Continue to Payment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Summary */}
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle>Support Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Support Amount</span>
                    <span className="font-medium">${supportAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Stripe Fee</span>
                    <span className="font-medium">-${stripeFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Platform Fee</span>
                    <span className="font-medium">-${platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800 font-bold">
                    <span className="text-white">Project Receives</span>
                    <span className="font-bold">${netAmount > 0 ? netAmount.toFixed(2) : '0.00'}</span>
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-400">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Secure payment processing
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Certificate Preview */}
            <Card className="border-4 border-[#7c3aed] bg-[#141414] shadow-2xl relative overflow-hidden mb-8">
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 400 250" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0">
                  <rect x="10" y="10" width="380" height="230" rx="24" stroke="#7c3aed" strokeWidth="4" fill="none" />
                </svg>
              </div>
              <CardHeader>
                <CardTitle className="text-center text-3xl font-serif tracking-wide mb-2 bg-gradient-to-r from-[#4f46e5] via-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">Certificate of Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-2 py-4 font-serif text-white">
                  <img src={TOKEN_IMAGE_URL} alt="Covion Partners Token" width={96} height={96} className="mx-auto rounded-full border-4 border-[#7c3aed] bg-white object-cover" style={{ width: 96, height: 96 }} />
                  <div className="text-xs text-[#7c3aed] font-bold uppercase tracking-widest">Covion Partners Token</div>
                  <div className="text-lg italic">This certifies that</div>
                  <div className="text-2xl font-bold text-white mt-2">{supporterName}</div>
                  <div className="text-lg italic mt-2">has generously supported the project</div>
                  <div className="text-xl font-semibold text-[#7c3aed] mt-2">{projectName}</div>
                  <div className="text-lg mt-2">with a contribution of <span className="font-bold text-[#4f46e5]">${supportAmount.toFixed(2)}</span></div>
                  <div className="text-base text-gray-300 mt-2">on {date}</div>
                  <div className="flex justify-center mt-6">
                    <div className="rounded-full border-4 border-[#7c3aed] bg-[#f3e8ff] px-6 py-2 text-[#7c3aed] font-bold text-lg shadow">Thank You</div>
                  </div>
                  <div className="text-sm text-[#ec4899] mt-6 font-bold">Covion Partners</div>
                  <Button className="mt-6 w-full" onClick={handleDownloadCertificate} disabled={supportAmount <= 0}>
                    Download Certificate
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Unique Covion Partners Token */}
            <Card className="border-4 border-[#7c3aed] bg-[#141414] shadow-2xl relative overflow-hidden flex flex-col items-center py-8">
              <div id="covion-token-image" className="flex flex-col items-center justify-center" style={{ width: 120, height: 160 }}>
                <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 120, height: 160, display: 'block', borderRadius: 24, boxShadow: '0 4px 24px #0008' }}>
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
                  <text x="50%" y="260" textAnchor="middle" fontSize="120" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="8">Covion Partners</text>
                  <text x="50%" y="400" textAnchor="middle" fontSize="72" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="4">TOKEN</text>
                  <circle cx="800" cy="1100" r="400" fill="#141414" stroke="#fff" strokeWidth="12" />
                  <image href={TOKEN_IMAGE_URL} x="500" y="800" width="600" height="600" style={{ filter: 'drop-shadow(0 0 24px #7c3aed88)' }} />
                  <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{tokenSerial}</text>
                  <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#ec4899" fontFamily="Arial, sans-serif">Serial Number</text>
                </svg>
              </div>
              <div className="text-xs text-[#7c3aed] font-bold uppercase tracking-widest mt-4">Covion Partners Token</div>
              <div className="text-xs text-gray-300 mt-1">Serial: {tokenSerial}</div>
              <Button className="mt-6 w-full" onClick={handleDownloadToken}>Download Token</Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 
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
  Gift,
  Download,
} from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
const TOKEN_IMAGE_URL = "https://uytqyfpjdevrqmwqfthk.supabase.co/storage/v1/object/public/partnerfiles/branding/handshake.png"

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

function PaymentForm({ clientSecret, onSuccess, projectId }: { clientSecret: string, onSuccess: () => void, projectId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDownloadOptions, setShowDownloadOptions] = useState(false)
  const [tokenData, setTokenData] = useState<any>(null)

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
          return_url: `${window.location.origin}/purchase2support/success?project_id=${projectId}`,
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

  const handleDownloadToken = async () => {
    if (!tokenData) return

    const tokenElement = document.getElementById('token-image')
    if (tokenElement) {
      const canvas = await html2canvas(tokenElement, { backgroundColor: null, width: 240, height: 320, scale: 2 })
      const link = document.createElement('a')
      link.download = `token-${tokenData.token_serial}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  const handleDownloadCertificate = async () => {
    if (!tokenData) return

    const certificateElement = document.getElementById('certificate-image')
    if (certificateElement) {
      const canvas = await html2canvas(certificateElement, { backgroundColor: null, width: 240, height: 320, scale: 2 })
      const link = document.createElement('a')
      link.download = `certificate-${tokenData.certificate_number}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

  return (
    <div className="space-y-6">
      {!showDownloadOptions ? (
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
                Complete Purchase
          </>
        )}
      </Button>
    </form>
      ) : (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">Purchase Successful!</h3>
            <p className="text-gray-400">Your token has been created. You can download it below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Token Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Your Token</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadToken}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Token
                </Button>
              </div>
              <div className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden">
                <div id="token-image" className="absolute inset-0">
                  <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
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
                    <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{tokenData?.token_serial || ''}</text>
                    <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif">Serial Number</text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Certificate Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Your Certificate</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCertificate}
                  className="text-purple-400 hover:text-purple-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </Button>
              </div>
              <div className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden">
                <div id="certificate-image" className="absolute inset-0">
                  <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
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
                    <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{tokenData?.certificate_number || ''}</text>
                    <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif">Certificate Number</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/mytokens'}
              className="text-purple-400 hover:text-purple-300"
            >
              View All My Tokens
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DonationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error } = useProjects()
  const [donationAmount, setDonationAmount] = useState("")
  const [message, setMessage] = useState("")
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [donationSuccess, setDonationSuccess] = useState(false)
  const [tokens, setTokens] = useState<any[]>([])
  const [loadingTokens, setLoadingTokens] = useState(true)
  const supabase = createClientComponentClient()

  const resolvedParams = use(params)
  const project = projects?.find(p => p.id === resolvedParams.id)

  useEffect(() => {
    if (donationSuccess) {
      router.push("/purchase2support/success")
    }
  }, [donationSuccess, router])

  useEffect(() => {
    const fetchTokens = async () => {
      if (!project?.id || !user?.id) return
      setLoadingTokens(true)
      try {
        const { data, error } = await supabase
          .from('public_supports')
          .select('id, project_id, certificate_number, token_serial, amount, created_at, metadata, project:projects(name), supporter_name')
          .eq('project_id', project.id)
          .eq('supporter_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setTokens(data || [])
      } catch (error) {
        console.error('Error fetching tokens:', error)
        toast.error('Failed to load tokens')
      } finally {
        setLoadingTokens(false)
      }
    }

    fetchTokens()
  }, [project?.id, user?.id, supabase])

  const handleDownloadToken = async (tokenId: string) => {
    const tokenElement = document.getElementById(`token-image-${tokenId}`)
    if (tokenElement) {
      const canvas = await html2canvas(tokenElement, { backgroundColor: null, width: 240, height: 320, scale: 2 })
      const link = document.createElement('a')
      link.download = `token-${tokenId}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
  }

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
                <CardTitle>Purchase Token</CardTitle>
                <CardDescription>Buy a unique token to support this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Project Tokens */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-purple-400">
                      <Gift className="w-4 h-4" />
                      <span className="font-medium">Available Tokens</span>
                    </div>
                    {loadingTokens ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner className="w-6 h-6" />
                      </div>
                    ) : tokens.length > 0 ? (
                      <div className="grid grid-cols-2 gap-6">
                        {tokens.map((token) => {
                          console.log('DEBUG TOKEN:', token);
                          return (
                            <div key={token.id} className="flex flex-col md:flex-row items-center gap-6">
                              {/* Certificate Card (styled, not SVG) */}
                              <div className="border-4 border-[#7c3aed] bg-[#141414] shadow-2xl rounded-2xl max-w-xs w-full p-4 flex flex-col items-center font-serif text-white">
                                <img 
                                  src={TOKEN_IMAGE_URL} 
                                  alt="Covion Partners Support" 
                                  width={64} 
                                  height={64} 
                                  className="mx-auto rounded-full border-4 border-[#7c3aed] bg-white object-cover mb-2" 
                                />
                                <div className="text-lg italic mt-2">This certifies that</div>
                                <div className="text-2xl font-bold text-white mt-2">
                                  {token.supporter_name || 'Supporter'}
                                </div>
                                <div className="text-lg italic mt-2">has supported Covion Partners</div>
                                <div className="text-xl font-semibold text-[#7c3aed] mt-2">
                                  Certificate Number: <span className="font-bold">{token.certificate_number || token.metadata?.token_number || 'Not set'}</span>
                                </div>
                                <div className="text-base text-gray-300 mt-2">
                                  on {token.created_at ? new Date(token.created_at).toLocaleDateString() : ''}
                                </div>
                                <div className="text-sm text-[#ec4899] mt-6 font-bold">Covion Partners</div>
                                <div className="text-sm text-gray-500 mb-2">Amount: <span className="font-bold text-white">{token.amount}</span></div>
                                <div className="text-xs text-gray-400">Created: {token.created_at ? new Date(token.created_at).toLocaleString() : ''}</div>
                                <div className="text-xs text-gray-300 mt-2 text-center">
                                  {token.project?.name || project?.name}
                                </div>
                              </div>
                              {/* Token Card (SVG) */}
                              <div className="flex flex-col items-center justify-center" style={{ width: 120, height: 160 }}>
                                <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 120, height: 160, display: 'block', borderRadius: 24, boxShadow: '0 4px 24px #0008' }}>
                                  <defs>
                                    <linearGradient id={`card-bg-${token.id}`} x1="0" y1="0" x2="1600" y2="2240" gradientUnits="userSpaceOnUse">
                                      <stop stopColor="#4f46e5" />
                                      <stop offset="0.5" stopColor="#7c3aed" />
                                      <stop offset="1" stopColor="#ec4899" />
                                    </linearGradient>
                                    <radialGradient id={`shine-${token.id}`} cx="50%" cy="30%" r="70%">
                                      <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                                      <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                                    </radialGradient>
                                  </defs>
                                  <rect x="40" y="40" width="1520" height="2160" rx="80" fill={`url(#card-bg-${token.id})`} stroke="#fff" strokeWidth="16" />
                                  <rect x="40" y="40" width="1520" height="2160" rx="80" fill={`url(#shine-${token.id})`} />
                                  <text x="50%" y="240" textAnchor="middle" fontSize="160" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="8">TOKEN</text>
                                  <text x="50%" y="380" textAnchor="middle" fontSize="72" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif" letterSpacing="8">COVION PARTNERS</text>
                                  <circle cx="800" cy="1100" r="400" fill="#141414" stroke="#fff" strokeWidth="12" />
                                  <image href={TOKEN_IMAGE_URL} x="500" y="800" width="600" height="600" style={{ filter: 'drop-shadow(0 0 24px #7c3aed88)' }} />
                                  <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{token.token_serial || token.metadata?.token_number || 'Not set'}</text>
                                  <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif">Serial Number</text>
                                </svg>
                                <div className="text-xs text-gray-300 mt-2 text-center">
                                  {token.project?.name || project?.name}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 text-center py-4">
                        No tokens have been created for this project yet.
                    </div>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="space-y-4">
                    <div className="text-sm text-gray-400 text-center">
                      Choose any amount to receive your unique token
                    </div>
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
                  </div>

                  {/* Custom Amount Input */}
                  <div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        type="number"
                        placeholder="Or enter any custom amount"
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
                      <PaymentForm clientSecret={clientSecret} onSuccess={() => setDonationSuccess(true)} projectId={project.id} />
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
                    <span className="font-medium text-xs text-gray-400">-${stripeFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Platform Fee</span>
                    <span className="font-medium text-xs text-gray-400">-${platformFee.toFixed(2)}</span>
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
          </div>
        </div>
      </main>
    </div>
  )
} 
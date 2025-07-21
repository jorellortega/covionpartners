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
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
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
      if (!project?.id) return
      setLoadingTokens(true)
      try {
        const { data, error } = await supabase
          .from('public_supports')
          .select('id, project_id, certificate_number, token_serial, amount, created_at, metadata, project:projects(name), supporter_name')
          .eq('project_id', project.id)
          .not('certificate_number', 'is', null) // Only fetch entries that have certificate data
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        console.log('Fetched tokens:', data)
        
        setTokens(data || [])
      } catch (error) {
        console.error('Error fetching tokens:', error)
        toast.error('Failed to load tokens')
      } finally {
        setLoadingTokens(false)
      }
    }

    fetchTokens()
  }, [project?.id, supabase])

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

        <div className="flex flex-col md:flex-row gap-8">
          {/* Vertical Stepper */}
          <div className="flex flex-row md:flex-col gap-4 md:gap-8 items-center md:items-start md:w-48">
            {[1, 2, 3].map((step) => {
              // Step enable logic
              const canGoToStep =
                step === 1 ||
                (step === 2 && selectedTokenId) ||
                (step === 3 && selectedTokenId && donationAmount && !isNaN(Number(donationAmount)) && Number(donationAmount) > 0);
              const isActive = currentStep === step;
              return (
                <div key={step} className="flex items-center md:flex-col gap-2 md:gap-0">
                  <button
                    type="button"
                    disabled={!canGoToStep}
                    onClick={() => canGoToStep && setCurrentStep(step)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full border-2 font-bold text-lg transition-all focus:outline-none
                      ${isActive ? 'bg-purple-500 text-white border-purple-500' : 'bg-gray-900 text-gray-400 border-gray-700'}
                      ${canGoToStep ? 'cursor-pointer hover:border-purple-400 hover:text-purple-300' : 'cursor-not-allowed opacity-60'}`}
                    aria-current={isActive ? 'step' : undefined}
                    tabIndex={canGoToStep ? 0 : -1}
                  >
                    {step}
                  </button>
                  <button
                    type="button"
                    disabled={!canGoToStep}
                    onClick={() => canGoToStep && setCurrentStep(step)}
                    className={`ml-2 md:ml-0 md:mt-2 text-xs md:text-sm font-medium text-left bg-transparent border-none p-0 m-0
                      ${isActive ? 'text-purple-400' : 'text-gray-400'}
                      ${canGoToStep ? 'cursor-pointer hover:text-purple-300' : 'cursor-not-allowed opacity-60'}`}
                    tabIndex={canGoToStep ? 0 : -1}
                  >
                    {step === 1 ? 'Select Token' : step === 2 ? 'Select Price' : 'Continue to Payment'}
                  </button>
                  {step < 3 && <div className="hidden md:block w-1 h-8 bg-gray-700 mx-auto" />}
                </div>
              );
            })}
          </div>
          {/* Step Content */}
          <div className="flex-1">
            {currentStep === 1 && (
              <>
                <div className="mb-6 text-lg font-semibold text-purple-400">Step 1: Select a Token</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                  {tokens.map((token) => {
                    const isSelected = selectedTokenId === token.id;
                    const fullSerial = token.token_serial || token.metadata?.token_number || 'Not set';
                    const shortSerial = fullSerial.length > 3 ? `${'*'.repeat(fullSerial.length - 3)}${fullSerial.slice(-3)}` : fullSerial;
                    return (
                      <div
                        key={token.id}
                        className={`flex flex-col items-center cursor-pointer transition-all duration-150 ${isSelected ? 'ring-4 ring-purple-400 scale-105' : 'hover:ring-2 hover:ring-purple-300'} rounded-2xl`}
                        onClick={() => {
                          setSelectedTokenId(token.id);
                          setCurrentStep(2);
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                      >
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
                            <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{shortSerial}</text>
                            <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif">Serial Number</text>
                          </svg>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end mt-6">
                  <Button
                    onClick={() => selectedTokenId && setCurrentStep(2)}
                    disabled={!selectedTokenId}
                    className="bg-purple-500 text-white"
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
            {currentStep === 2 && (
              <>
                <div className="mb-6 text-lg font-semibold text-purple-400">Step 2: Select a Price</div>
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
                        onClick={() => {
                          setDonationAmount(amount.toString());
                          setCurrentStep(3);
                        }}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
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
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => donationAmount && setCurrentStep(3)}
                    disabled={!donationAmount || isNaN(Number(donationAmount)) || Number(donationAmount) <= 0}
                    className="bg-purple-500 text-white"
                  >
                    Next
                  </Button>
                </div>
              </>
            )}
            {currentStep === 3 && !clientSecret && (
              <>
                <div className="mb-6 text-lg font-semibold text-purple-400">Step 3: Review & Continue to Payment</div>
                <div className="w-full max-w-2xl mx-auto mt-4 bg-[#18132a] rounded-xl shadow-lg p-6 flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* Token on the left */}
                  {tokens.filter(t => t.id === selectedTokenId).map(token => {
                    const fullSerial = token.token_serial || token.metadata?.token_number || 'Not set';
                    const shortSerial = fullSerial.length > 3 ? `${'*'.repeat(fullSerial.length - 3)}${fullSerial.slice(-3)}` : fullSerial;
                    // Use /mytokens logic for certificate number
                    const fullCertNumber = token.certificate_number || (token.token_serial ? `CP-${token.token_serial}` : '');
                    const shortCertNumber = fullCertNumber.length > 3 ? `${'*'.repeat(fullCertNumber.length - 3)}${fullCertNumber.slice(-3)}` : fullCertNumber;
                    const supporter = token.supporter_name || 'Supporter';
                    const issued = token.issued_at ? new Date(token.issued_at).toLocaleDateString() : token.created_at ? new Date(token.created_at).toLocaleDateString() : 'N/A';
                    return (
                      <div key={token.id} className="flex flex-col items-center mb-4 md:mb-0">
                        <div className="flex flex-col items-center justify-center" style={{ width: 100, height: 133 }}>
                          <svg width="1600" height="2240" viewBox="0 0 1600 2240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 100, height: 133, display: 'block', borderRadius: 24, boxShadow: '0 4px 24px #0008' }}>
                            <defs>
                              <linearGradient id={`card-bg-review-${token.id}`} x1="0" y1="0" x2="1600" y2="2240" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#4f46e5" />
                                <stop offset="0.5" stopColor="#7c3aed" />
                                <stop offset="1" stopColor="#ec4899" />
                              </linearGradient>
                              <radialGradient id={`shine-review-${token.id}`} cx="50%" cy="30%" r="70%">
                                <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                              </radialGradient>
                            </defs>
                            <rect x="40" y="40" width="1520" height="2160" rx="80" fill={`url(#card-bg-review-${token.id})`} stroke="#fff" strokeWidth="16" />
                            <rect x="40" y="40" width="1520" height="2160" rx="80" fill={`url(#shine-review-${token.id})`} />
                            <text x="50%" y="240" textAnchor="middle" fontSize="160" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif" letterSpacing="8">TOKEN</text>
                            <text x="50%" y="380" textAnchor="middle" fontSize="72" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif" letterSpacing="8">COVION PARTNERS</text>
                            <circle cx="800" cy="1100" r="400" fill="#141414" stroke="#fff" strokeWidth="12" />
                            <image href={TOKEN_IMAGE_URL} x="500" y="800" width="600" height="600" style={{ filter: 'drop-shadow(0 0 24px #7c3aed88)' }} />
                            <text x="50%" y="2000" textAnchor="middle" fontSize="80" fontWeight="bold" fill="#fff" fontFamily="Arial, sans-serif">{shortSerial}</text>
                            <text x="50%" y="2100" textAnchor="middle" fontSize="48" fontWeight="bold" fill="#000" fontFamily="Arial, sans-serif">Serial Number</text>
                          </svg>
                        </div>
                        <div className="mt-2 text-base text-gray-300">Serial: <span className="font-bold text-white">{shortSerial}</span></div>
                        {/* Mini certificate preview under token, matching /mytokens */}
                        <div
                          className="mt-4 rounded-xl shadow border-2 border-purple-500 bg-[#18132a] flex flex-col items-center justify-center relative"
                          style={{ width: 120, height: 60, padding: 4 }}
                        >
                          <div className="absolute inset-0 rounded-xl border-2 border-purple-500 pointer-events-none" style={{ zIndex: 1 }} />
                          <div className="absolute left-2 top-2" style={{ zIndex: 2 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="12" fill="#141414" />
                              <path d="M7.5 13.5L10 16C10.5 16.5 11.5 16.5 12 16L16.5 11.5C17 11 17 10 16.5 9.5L15 8C14.5 7.5 13.5 7.5 13 8L8.5 12.5C8 13 8 13.5 7.5 13.5Z" stroke="#a78bfa" strokeWidth="1.2" fill="none"/>
                            </svg>
                          </div>
                          <div className="flex flex-col items-center justify-center w-full h-full" style={{ zIndex: 2 }}>
                            <div className="text-[9px] font-bold text-purple-400 text-center mb-0.5">Certificate of Support</div>
                            <div className="text-[7px] italic text-white text-center">This certifies that</div>
                            <div className="text-[8px] font-bold text-white text-center mt-0.5">{supporter}</div>
                            <div className="text-[7px] italic text-white text-center mt-0.5">has supported Covion Partners</div>
                            <div className="text-[8px] font-bold text-purple-400 text-center mt-0.5">{shortCertNumber}</div>
                            <div className="text-[7px] text-white text-center mt-0.5">{issued}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Summary details on the right */}
                  <div className="flex-1 w-full">
                    <div className="mb-2 text-lg font-semibold text-white">Summary</div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-gray-400">Selected Price</span>
                      <span className="font-bold text-green-400 text-lg">${donationAmount}</span>
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
                    <div className="flex items-center justify-center text-sm text-gray-400 mt-2">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Secure payment processing
                    </div>
                    <div className="flex justify-center mt-8">
                      <Button
                        className="bg-purple-500 text-white text-xl px-8 py-4 rounded-2xl shadow-lg"
                        style={{ fontSize: '1.5rem', fontWeight: 700 }}
                        onClick={handleDonate}
                        disabled={!selectedTokenId || !donationAmount}
                      >
                        Continue to Payment
                      </Button>
                    </div>
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {currentStep === 3 && clientSecret && (
              <>
                <div className="mb-6 text-lg font-semibold text-purple-400">Step 3: Complete Payment</div>
                <div className="w-full max-w-2xl mx-auto">
                  <Card className="leonardo-card border-gray-800">
                    <CardHeader>
                      <CardTitle>Payment Details</CardTitle>
                      <CardDescription>Enter your payment information to complete the purchase</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm 
                          clientSecret={clientSecret} 
                          onSuccess={() => setDonationSuccess(true)}
                          projectId={project.id}
                        />
                      </Elements>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 
"use client"

import { useState } from "react"
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
  CreditCard,
  Banknote,
  Bitcoin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import PaymentMethodSelector from "../../components/payments/PaymentMethodSelector"

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

export default function DonationPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error } = useProjects()
  const [donationAmount, setDonationAmount] = useState("")
  const [message, setMessage] = useState("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const resolvedParams = use(params)
  const project = projects?.find(p => p.id === resolvedParams.id)

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
            onClick={() => router.back()}
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

    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    setIsProcessing(true)
    try {
      const fees = calculateFees(donationAmount)
      
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          amount: parseFloat(donationAmount),
          processingFee: parseFloat(fees.stripeFee),
          platformFee: parseFloat(fees.platformFee),
          totalAmount: parseFloat(fees.total),
          paymentMethodId: selectedPaymentMethod,
          message,
          isAnonymous: !user // Mark as anonymous if user is not logged in
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process donation')
      }

      toast.success(`Thank you for your donation of $${donationAmount} to ${project.name}!`)
      router.push("/donate")
    } catch (error) {
      console.error('Donation error:', error)
      toast.error(error instanceof Error ? error.message : "Failed to process donation. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate fees based on donation amount
  const calculateFees = (amount: string) => {
    const donationAmount = parseFloat(amount) || 0;
    
    // Stripe fee: 2.9% + $0.30
    const stripeFee = donationAmount > 0 ? (donationAmount * 0.029) + 0.30 : 0;
    
    // Platform fee: 2%
    const platformFee = donationAmount * 0.02;
    
    // Total amount including fees
    const total = donationAmount + stripeFee + platformFee;
    
    return {
      stripeFee: stripeFee.toFixed(2),
      platformFee: platformFee.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const fees = calculateFees(donationAmount);

  return (
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-purple-400"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Support This Project</h1>
            <p className="text-gray-400">Make a donation to help this project succeed</p>
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
                      <span>Funding Progress</span>
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
                <CardTitle>Make a Donation</CardTitle>
                <CardDescription>Choose your donation amount and payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
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

                  {/* Payment Methods */}
                  <PaymentMethodSelector 
                    onPaymentMethodSelected={setSelectedPaymentMethod}
                    selectedMethod={selectedPaymentMethod}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Summary */}
            <Card className="border-gray-800">
              <CardHeader>
                <CardTitle>Donation Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-gray-400">Donation Amount</span>
                    <span className="font-medium">${donationAmount || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <div className="flex items-center">
                      <span className="text-gray-400">Processing Fee</span>
                      <span className="text-xs text-gray-500 ml-1">(2.9% + $0.30)</span>
                    </div>
                    <span className="font-medium">${fees.stripeFee}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-800">
                    <div className="flex items-center">
                      <span className="text-gray-400">Platform Fee</span>
                      <span className="text-xs text-gray-500 ml-1">(2%)</span>
                    </div>
                    <span className="font-medium">${fees.platformFee}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Total</span>
                    <span className="font-medium text-lg">${fees.total}</span>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-400 mb-1">Fee Breakdown</h4>
                        <p className="text-sm text-gray-300">
                          The processing fee covers secure payment handling, while the platform fee helps maintain and improve our services.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    onClick={handleDonate}
                    disabled={isProcessing || !donationAmount || !selectedPaymentMethod}
                  >
                    {isProcessing ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-2" />
                        Complete Donation
                      </>
                    )}
                  </Button>

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
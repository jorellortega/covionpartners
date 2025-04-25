"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { DevelopmentBanner } from "@/components/ui/development-banner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Building2,
  CreditCard,
  DollarSign,
  Lock,
  Shield,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

// Mock data - in production, this would come from your backend
const mockListings = [
  {
    id: "1",
    name: "Tech Innovation Hub",
    description: "A thriving technology innovation center with established partnerships and growing revenue stream.",
    askingPrice: 2500000,
    monthlyRevenue: 75000,
    roi: 28,
    industry: "Technology",
    teamSize: 15,
    established: "2021",
    location: "San Francisco, CA",
    thumbnail: null,
  },
  {
    id: "2",
    name: "Green Energy Solutions",
    description: "Renewable energy consulting firm with strong market presence and recurring client base.",
    askingPrice: 1800000,
    monthlyRevenue: 45000,
    roi: 22,
    industry: "Clean Energy",
    teamSize: 8,
    established: "2020",
    location: "Austin, TX",
    thumbnail: null,
  },
  {
    id: "3",
    name: "HealthTech Platform",
    description: "Digital health platform connecting patients with healthcare providers, featuring AI-driven diagnostics.",
    askingPrice: 3500000,
    monthlyRevenue: 120000,
    roi: 32,
    industry: "Healthcare",
    teamSize: 20,
    established: "2019",
    location: "Boston, MA",
    thumbnail: null,
  }
]

function BuyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    name: ""
  })

  const listingId = searchParams.get("listing")
  const listing = mockListings.find(l => l.id === listingId)

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <DevelopmentBanner />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Listing Not Found</CardTitle>
            <CardDescription>The project you're looking for doesn't exist or has been removed.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => router.push('/forsale')}
            >
              Back to Listings
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const handlePurchase = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setShowConfirmDialog(true)
    } catch (error) {
      toast.error("Failed to process purchase")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmPurchase = () => {
    toast.success("Purchase successful! Our team will contact you shortly.")
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <DevelopmentBanner />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-2xl font-bold text-white">Purchase Project</h1>
            <p className="text-gray-400">Complete your purchase securely</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Summary */}
          <Card className="border-gray-800">
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
              <CardDescription>Review the details before purchase</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="w-full aspect-video relative bg-gray-800/50 rounded-lg overflow-hidden">
                {listing.thumbnail ? (
                  <Image
                    src={listing.thumbnail}
                    alt={listing.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-purple-400/50" />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-2">{listing.name}</h2>
                <p className="text-gray-400">{listing.description}</p>
              </div>

              <Separator className="bg-gray-800" />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Asking Price</span>
                  <span className="text-xl font-bold text-white">${listing.askingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Monthly Revenue</span>
                  <span className="text-white">${listing.monthlyRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">ROI</span>
                  <span className="text-green-400">{listing.roi}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Location</span>
                  <span className="text-white">{listing.location}</span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-400 mb-1">Purchase Protection</h4>
                    <p className="text-gray-300 text-sm">
                      Your purchase is protected by our secure escrow service. Funds will only be released once all terms are met.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="border-gray-800">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Enter your payment information securely</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input
                    id="cardName"
                    placeholder="John Smith"
                    value={paymentDetails.name}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentDetails.cardNumber}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                    />
                    <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={paymentDetails.expiryDate}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      type="password"
                      value={paymentDetails.cvv}
                      onChange={(e) => setPaymentDetails(prev => ({ ...prev, cvv: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Purchase Price</span>
                  <span className="text-white">${listing.askingPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Processing Fee (2%)</span>
                  <span className="text-white">${(listing.askingPrice * 0.02).toLocaleString()}</span>
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total</span>
                  <span className="text-xl font-bold text-white">
                    ${(listing.askingPrice * 1.02).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Lock className="w-4 h-4" />
                <span>Your payment information is encrypted and secure</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Complete Purchase
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Purchase</DialogTitle>
              <DialogDescription>
                You are about to purchase {listing.name} for ${(listing.askingPrice * 1.02).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-400 mb-1">Important Notice</h4>
                    <p className="text-gray-300 text-sm">
                      This purchase will be processed through our secure escrow service. Our team will contact you to facilitate the transfer of ownership.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-400 mb-1">What's Next</h4>
                    <p className="text-gray-300 text-sm">
                      After confirming, you'll receive detailed instructions about the next steps in your email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleConfirmPurchase}
              >
                Confirm Purchase
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default function BuyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <BuyPageContent />
    </Suspense>
  )
} 
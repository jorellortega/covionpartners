"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  DollarSign,
  Building2,
  Clock,
  AlertCircle,
  ArrowLeft,
  BarChart2,
  TrendingUp,
  Wallet,
  Calculator,
  FileText,
  CreditCard,
  Banknote,
  Bitcoin,
  FileCheck,
  Shield,
  Users,
  LineChart,
  FileSpreadsheet,
  FileSignature,
} from "lucide-react"
import { toast } from "sonner"
import { DevelopmentBanner } from "@/components/ui/development-banner"

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

export default function InvestmentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error } = useProjects()
  const [investmentAmount, setInvestmentAmount] = useState("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [roiYears, setRoiYears] = useState("5")
  const [estimatedRoi, setEstimatedRoi] = useState<number | null>(null)
  const [documentsSigned, setDocumentsSigned] = useState(false)
  const [riskAssessmentCompleted, setRiskAssessmentCompleted] = useState(false)

  const resolvedParams = use(params)
  const project = projects?.find(p => p.id === resolvedParams.id)

  // Note: This page is accessible to all users for viewing investment details
  // Authentication will be required when actually submitting an investment

  // Calculate ROI when investment amount or years change
  useEffect(() => {
    if (investmentAmount && project?.roi) {
      const amount = Number(investmentAmount)
      const years = Number(roiYears)
      const roi = project.roi / 100 // Convert percentage to decimal
      const estimated = amount * Math.pow(1 + roi, years)
      setEstimatedRoi(estimated)
    } else {
      setEstimatedRoi(null)
    }
  }, [investmentAmount, roiYears, project?.roi])

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
        </div>
      </div>
    )
  }

  const handleInvest = async () => {
    // Check if user is authenticated
    if (!user) {
      toast.error("Please log in to make an investment")
      router.push("/login")
      return
    }

    // Check if user has permission to invest
    if (!["investor", "partner", "admin"].includes(user.role)) {
      toast.error("You need to have an investor account to make investments")
      return
    }

    if (!investmentAmount || isNaN(Number(investmentAmount)) || Number(investmentAmount) <= 0) {
      toast.error("Please enter a valid investment amount")
      return
    }

    if (!selectedPaymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    if (!documentsSigned) {
      toast.error("Please review and sign all required documents")
      return
    }

    if (!riskAssessmentCompleted) {
      toast.error("Please complete the risk assessment")
      return
    }

    // TODO: Implement investment logic here
    toast.success(`Successfully invested $${investmentAmount} in ${project?.name}`)
    router.push("/invest")
  }

  return (
    <>
      <DevelopmentBanner />
    <div className="min-h-screen">
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-purple-400"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Investment Details</h1>
              <p className="text-gray-400">Review and confirm your investment</p>
            </div>
          </div>
        </div>

        {/* Project Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              {project.media_files && project.media_files.length > 0 ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={project.media_files[0].url} 
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Building2 className="w-12 h-12 text-purple-400" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>{project.name}</CardTitle>
                </div>
                <CardDescription>{project.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Status</Label>
                <div className="text-white font-medium">
                  <StatusBadge status={project.status} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Funding Goal</Label>
                <div className="text-white font-medium">
                  ${project.funding_goal?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Current Funding</Label>
                <div className="text-white font-medium">
                  ${project.current_funding?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400">Projected ROI</Label>
                <div className="text-white font-medium">
                  {project.roi ? `${project.roi}%` : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* ROI Calculator */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-400" />
                <CardTitle>ROI Calculator</CardTitle>
              </div>
              <CardDescription>Estimate your potential returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investmentAmount">Investment Amount ($)</Label>
                    <Input
                      id="investmentAmount"
                      type="number"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roiYears">Investment Period (Years)</Label>
                    <Input
                      id="roiYears"
                      type="number"
                      value={roiYears}
                      onChange={(e) => setRoiYears(e.target.value)}
                      min="1"
                      max="10"
                      className="mt-1"
                    />
                  </div>
                </div>
                {estimatedRoi !== null && (
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="text-gray-400 mb-1">Estimated Return</div>
                    <div className="text-2xl font-bold text-purple-400">
                      ${estimatedRoi.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Based on {roiYears} year{Number(roiYears) > 1 ? 's' : ''} at {project.roi}% ROI
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <CardTitle>Risk Assessment</CardTitle>
              </div>
              <CardDescription>Evaluate investment risks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-gray-400">Risk Level</div>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                      Moderate
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    This project carries moderate risk. Please review the risk factors below.
                  </div>
                  <Button
                    variant={riskAssessmentCompleted ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setRiskAssessmentCompleted(!riskAssessmentCompleted)}
                  >
                    {riskAssessmentCompleted ? "Assessment Completed" : "Complete Assessment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-purple-400" />
              <CardTitle>Market Analysis</CardTitle>
            </div>
            <CardDescription>Review market trends and projections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Market Trends</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="text-sm">Financial Projections</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-4">
                  <Users className="w-5 h-5" />
                  <span className="text-sm">Competitor Analysis</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Documents */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-purple-400" />
              <CardTitle>Legal Documents</CardTitle>
            </div>
            <CardDescription>Review and sign required documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-purple-400" />
                    <div>
                      <div className="font-medium">Investment Agreement</div>
                      <div className="text-sm text-gray-400">Required for all investments</div>
                    </div>
                  </div>
                  <Button
                    variant={documentsSigned ? "default" : "outline"}
                    onClick={() => setDocumentsSigned(!documentsSigned)}
                  >
                    {documentsSigned ? "Signed" : "Review & Sign"}
                  </Button>
                </div>
                <div className="text-sm text-gray-400">
                  By signing this agreement, you acknowledge that you have read and understood all terms and conditions.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-purple-400" />
              <CardTitle>Payment Method</CardTitle>
            </div>
            <CardDescription>Choose how you want to invest</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant={selectedPaymentMethod === "credit" ? "default" : "outline"}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSelectedPaymentMethod("credit")}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-sm">Credit Card</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === "bank" ? "default" : "outline"}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSelectedPaymentMethod("bank")}
              >
                <Banknote className="w-5 h-5" />
                <span className="text-sm">Bank Transfer</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === "crypto" ? "default" : "outline"}
                className="flex flex-col items-center gap-2 h-auto py-4"
                onClick={() => setSelectedPaymentMethod("crypto")}
              >
                <Bitcoin className="w-5 h-5" />
                <span className="text-sm">Cryptocurrency</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvest}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!documentsSigned || !riskAssessmentCompleted}
          >
            Confirm Investment
          </Button>
        </div>
      </main>
    </div>
    </>
  )
} 
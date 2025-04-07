"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Home, DollarSign, PieChart, BarChart2, Check, Info, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ReinvestPage() {
  const router = useRouter()
  const [availableBalance, setAvailableBalance] = useState(5000000)
  const [remainingBalance, setRemainingBalance] = useState(5000000)
  const [allocations, setAllocations] = useState<{ [key: string]: number }>({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Mock projects data - in a real app, this would come from an API
  const [recommendedProjects] = useState([
    {
      id: "proj-004",
      name: "Quantum Computing Research",
      type: "Research",
      status: "Open",
      minInvestment: 500000,
      targetROI: 28,
      riskLevel: "High",
      industry: "Technology",
      deadline: "2025-09-15",
      funded: 3500000,
      fundingGoal: 10000000,
      description: "Cutting-edge research into quantum computing applications for financial modeling and cryptography.",
    },
    {
      id: "proj-005",
      name: "Sustainable Agriculture Platform",
      type: "Startup",
      status: "Open",
      minInvestment: 250000,
      targetROI: 22,
      riskLevel: "Medium",
      industry: "Agriculture",
      deadline: "2025-07-30",
      funded: 1800000,
      fundingGoal: 5000000,
      description:
        "Platform connecting sustainable farmers with consumers and providing analytics for optimizing crop yields.",
    },
    {
      id: "proj-006",
      name: "Medical Diagnostics AI",
      type: "Expansion",
      status: "Open",
      minInvestment: 750000,
      targetROI: 25,
      riskLevel: "Medium-High",
      industry: "Healthcare",
      deadline: "2025-08-20",
      funded: 4200000,
      fundingGoal: 8000000,
      description: "AI-powered diagnostic tools for early detection of chronic diseases using non-invasive methods.",
    },
  ])

  const [allProjects] = useState([
    ...recommendedProjects,
    {
      id: "proj-007",
      name: "Renewable Energy Storage",
      type: "Infrastructure",
      status: "Open",
      minInvestment: 1000000,
      targetROI: 18,
      riskLevel: "Low",
      industry: "Energy",
      deadline: "2025-10-10",
      funded: 7500000,
      fundingGoal: 15000000,
      description: "Development of next-generation energy storage solutions for renewable energy sources.",
    },
    {
      id: "proj-008",
      name: "Smart City Infrastructure",
      type: "Government",
      status: "Open",
      minInvestment: 500000,
      targetROI: 15,
      riskLevel: "Low",
      industry: "Infrastructure",
      deadline: "2025-11-30",
      funded: 12000000,
      fundingGoal: 20000000,
      description: "Implementation of IoT sensors and data analytics for urban planning and resource management.",
    },
  ])

  // Update remaining balance when allocations change
  useEffect(() => {
    const totalAllocated = Object.values(allocations).reduce((sum, value) => sum + value, 0)
    setRemainingBalance(availableBalance - totalAllocated)
  }, [allocations, availableBalance])

  // Handle allocation change for a project
  const handleAllocationChange = (projectId: string, value: number[]) => {
    const newValue = value[0]

    // Calculate total allocated excluding this project
    const otherAllocations = Object.entries(allocations)
      .filter(([id]) => id !== projectId)
      .reduce((sum, [, value]) => sum + value, 0)

    // Ensure we don't exceed available balance
    const maxAllocation = availableBalance - otherAllocations
    const safeValue = Math.min(newValue, maxAllocation)

    setAllocations((prev) => ({
      ...prev,
      [projectId]: safeValue,
    }))
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate funding percentage
  const calculateFundingPercentage = (funded: number, goal: number) => {
    return Math.min(Math.round((funded / goal) * 100), 100)
  }

  // Handle form submission
  const handleSubmit = () => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setShowConfirmation(false)
      setShowSuccess(true)

      // Reset allocations
      setAllocations({})

      // In a real app, you would update the available balance after reinvestment
      setAvailableBalance(remainingBalance)
    }, 1500)
  }

  // Handle success dialog close
  const handleSuccessClose = () => {
    setShowSuccess(false)
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Reinvest Your Returns</h1>
          </div>
          <Link href="/" className="inline-flex items-center text-white hover:text-blue-300 transition-colors">
            <Home className="w-5 h-5 mr-2" />
            Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Balance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Available to Reinvest</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <DollarSign className="w-6 h-6 mr-2 text-green-400" />
                <span className="text-2xl font-bold text-green-400">{formatCurrency(availableBalance)}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">Total balance available for reinvestment</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Allocated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <PieChart className="w-6 h-6 mr-2 text-blue-400" />
                <span className="text-2xl font-bold text-blue-400">
                  {formatCurrency(availableBalance - remainingBalance)}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">Amount allocated to projects</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <BarChart2 className="w-6 h-6 mr-2 text-purple-400" />
                <span className="text-2xl font-bold text-purple-400">{formatCurrency(remainingBalance)}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">Balance remaining after allocation</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Selection */}
        <Tabs defaultValue="recommended" className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Select Projects to Reinvest In</h2>
            <TabsList className="bg-gray-800">
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="all">All Projects</TabsTrigger>
            </TabsList>
          </div>

          <Alert className="mb-6 bg-blue-900/20 border-blue-800">
            <Info className="h-4 w-4" />
            <AlertTitle>Investment Strategy</AlertTitle>
            <AlertDescription>
              Diversifying your reinvestments across multiple projects can help balance risk and potential returns. We
              recommend allocating no more than 40% of your funds to high-risk projects.
            </AlertDescription>
          </Alert>

          <TabsContent value="recommended">
            <div className="grid grid-cols-1 gap-6">
              {recommendedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  allocation={allocations[project.id] || 0}
                  onAllocationChange={(value) => handleAllocationChange(project.id, value)}
                  remainingBalance={remainingBalance}
                  formatCurrency={formatCurrency}
                  calculateFundingPercentage={calculateFundingPercentage}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="all">
            <div className="grid grid-cols-1 gap-6">
              {allProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  allocation={allocations[project.id] || 0}
                  onAllocationChange={(value) => handleAllocationChange(project.id, value)}
                  remainingBalance={remainingBalance}
                  formatCurrency={formatCurrency}
                  calculateFundingPercentage={calculateFundingPercentage}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary and Submit */}
        <Card className="leonardo-card border-gray-800 mb-8">
          <CardHeader>
            <CardTitle>Reinvestment Summary</CardTitle>
            <CardDescription>Review your allocations before confirming</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.keys(allocations).length > 0 ? (
                <>
                  <div className="space-y-2">
                    {Object.entries(allocations)
                      .filter(([, amount]) => amount > 0)
                      .map(([projectId, amount]) => {
                        const project = allProjects.find((p) => p.id === projectId)
                        return project ? (
                          <div
                            key={projectId}
                            className="flex justify-between items-center py-2 border-b border-gray-700"
                          >
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <div className="flex items-center mt-1">
                                <Badge variant="outline" className="mr-2 bg-gray-800 border-gray-700">
                                  {project.industry}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`
                                  ${
                                    project.riskLevel === "Low"
                                      ? "bg-green-500/20 text-green-400 border-green-500/50"
                                      : project.riskLevel === "Medium"
                                        ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                                        : "bg-red-500/20 text-red-400 border-red-500/50"
                                  }
                                  border
                                `}
                                >
                                  {project.riskLevel} Risk
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(amount)}</p>
                              <p className="text-sm text-gray-400">Target ROI: {project.targetROI}%</p>
                            </div>
                          </div>
                        ) : null
                      })}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <p className="font-bold">Total Allocated</p>
                    <p className="font-bold text-xl text-blue-400">
                      {formatCurrency(availableBalance - remainingBalance)}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <p className="font-medium">Remaining Balance</p>
                    <p className="font-medium text-purple-400">{formatCurrency(remainingBalance)}</p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">No allocations made yet</p>
                  <p className="text-sm mt-2">Use the sliders above to allocate funds to projects</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 mb-8">
          <Button
            variant="outline"
            className="border-gray-700 bg-gray-800/30 text-white"
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </Button>
          <Button
            className="gradient-button"
            disabled={Object.keys(allocations).filter((key) => allocations[key] > 0).length === 0}
            onClick={() => setShowConfirmation(true)}
          >
            Confirm Reinvestment
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="leonardo-card border-gray-800">
            <DialogHeader>
              <DialogTitle>Confirm Reinvestment</DialogTitle>
              <DialogDescription>
                You are about to reinvest {formatCurrency(availableBalance - remainingBalance)} across{" "}
                {Object.keys(allocations).filter((key) => allocations[key] > 0).length} projects.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Alert className="bg-yellow-900/20 border-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Once confirmed, these funds will be allocated to the selected projects and cannot be immediately
                  withdrawn. Returns will be based on project performance.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button className="gradient-button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="leonardo-card border-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Check className="w-6 h-6 mr-2 text-green-400" />
                Reinvestment Successful
              </DialogTitle>
              <DialogDescription>
                Your funds have been successfully reinvested across your selected projects.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="mb-2">
                Total Reinvested:{" "}
                <span className="font-bold text-blue-400">{formatCurrency(availableBalance - remainingBalance)}</span>
              </p>
              <p>You can track the performance of your investments in your portfolio dashboard.</p>
            </div>

            <DialogFooter>
              <Button className="gradient-button" onClick={handleSuccessClose}>
                Return to Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

// Project Card Component
function ProjectCard({
  project,
  allocation,
  onAllocationChange,
  remainingBalance,
  formatCurrency,
  calculateFundingPercentage,
}: {
  project: any
  allocation: number
  onAllocationChange: (value: number[]) => void
  remainingBalance: number
  formatCurrency: (amount: number) => string
  calculateFundingPercentage: (funded: number, goal: number) => number
}) {
  // Calculate max allocation for this project
  const maxAllocation = remainingBalance + allocation

  // Get risk color
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "Medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "Medium-High":
      case "High":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Card className="leonardo-card border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <Badge variant="outline" className={`${getRiskColor(project.riskLevel)} border`}>
            {project.riskLevel} Risk
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="outline" className="bg-gray-800 border-gray-700">
            {project.type}
          </Badge>
          <Badge variant="outline" className="bg-gray-800 border-gray-700">
            {project.industry}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-300">{project.description}</p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Min Investment</p>
              <p className="font-medium">{formatCurrency(project.minInvestment)}</p>
            </div>
            <div>
              <p className="text-gray-400">Target ROI</p>
              <p className="font-medium text-green-400">{project.targetROI}%</p>
            </div>
            <div>
              <p className="text-gray-400">Deadline</p>
              <p className="font-medium">
                {new Date(project.deadline).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Status</p>
              <p className="font-medium">{project.status}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Funding Progress</span>
              <span className="text-white">
                {formatCurrency(project.funded)} / {formatCurrency(project.fundingGoal)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                style={{ width: `${calculateFundingPercentage(project.funded, project.fundingGoal)}%` }}
              ></div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Your Allocation</span>
              <span className="font-bold">{formatCurrency(allocation)}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Slider
                value={[allocation]}
                max={Math.max(maxAllocation, project.minInvestment)}
                step={10000}
                onValueChange={onAllocationChange}
                className="flex-grow"
                disabled={maxAllocation < project.minInvestment}
              />
              <span className="text-sm w-24 text-right">
                {allocation > 0
                  ? formatCurrency(allocation)
                  : maxAllocation < project.minInvestment
                    ? "Insufficient funds"
                    : "None"}
              </span>
            </div>
            {allocation > 0 && allocation < project.minInvestment && (
              <p className="text-xs text-red-400 mt-1">Minimum investment is {formatCurrency(project.minInvestment)}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Calculator, DollarSign, Clock, BarChart2, ArrowRight, Target, PieChart } from "lucide-react"

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
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
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

// Risk level badge component
function RiskBadge({ level }: { level: string }) {
  const getRiskStyles = () => {
    switch (level.toLowerCase()) {
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getRiskStyles()} border`} variant="outline">
      {level}
    </Badge>
  )
}

// Progress bar component
function ProgressBar({ value, max, color = "blue" }: { value: number; max: number; color?: string }) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">Progress</span>
        <span className="text-white">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`bg-gradient-to-r from-${color}-500 to-purple-500 h-2 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  )
}

// Growth chart component
function GrowthChart({
  initialAmount,
  targetAmount,
  years,
  roi,
}: {
  initialAmount: number
  targetAmount: number
  years: number
  roi: number
}) {
  const yearlyData = []
  let currentAmount = initialAmount

  for (let i = 0; i <= years; i++) {
    yearlyData.push({
      year: i,
      amount: currentAmount,
    })
    currentAmount = currentAmount * (1 + roi / 100)
  }

  const maxValue = Math.max(targetAmount, ...yearlyData.map((d) => d.amount))
  const height = 200

  return (
    <div className="relative h-[250px] w-full mt-6">
      {/* Target line */}
      <div
        className="absolute border-t-2 border-dashed border-red-400 w-full z-10"
        style={{ top: `${height - (targetAmount / maxValue) * height}px` }}
      >
        <span className="absolute right-0 -top-6 text-red-400 text-xs">Target: ${targetAmount.toLocaleString()}</span>
      </div>

      {/* Chart bars */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-[200px]">
        {yearlyData.map((data, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className={`w-[80%] rounded-t-md ${data.amount >= targetAmount ? "bg-green-500" : "bg-blue-500"}`}
              style={{
                height: `${(data.amount / maxValue) * height}px`,
                minHeight: "4px",
              }}
            ></div>
            <div className="mt-2 text-xs text-gray-400">Year {data.year}</div>
            <div className="mt-1 text-xs font-medium truncate w-full text-center">
              ${Math.round(data.amount).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function InvestmentCalculatorPage() {
  // Form state
  const [initialAmount, setInitialAmount] = useState<number>(1000)
  const [targetAmount, setTargetAmount] = useState<number>(2000)
  const [timeframe, setTimeframe] = useState<string>("any")
  const [riskTolerance, setRiskTolerance] = useState<string>("medium")
  const [calculationPerformed, setCalculationPerformed] = useState<boolean>(false)

  // Results state
  const [growthNeeded, setGrowthNeeded] = useState<number>(0)
  const [recommendedProjects, setRecommendedProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<string>("all")

  // Mock projects data
  const projects = [
    {
      id: "proj-001",
      name: "AI Integration Platform",
      description: "Enterprise AI integration solution for financial services",
      status: "Active",
      progress: 65,
      deadline: "2025-06-15",
      minInvestment: 5000,
      maxInvestment: 500000,
      roi: 22,
      timeToMaturity: 24, // months
      risk: "medium",
      industry: "Technology",
      type: "Investment",
    },
    {
      id: "proj-002",
      name: "Healthcare Analytics Solution",
      description: "Data analytics platform for healthcare providers",
      status: "Active",
      progress: 40,
      deadline: "2025-05-30",
      minInvestment: 10000,
      maxInvestment: 750000,
      roi: 18,
      timeToMaturity: 18, // months
      risk: "low",
      industry: "Healthcare",
      type: "Collaboration",
    },
    {
      id: "proj-003",
      name: "Sustainable Energy Storage",
      description: "Next-generation energy storage solutions",
      status: "Pending",
      progress: 10,
      deadline: "2025-08-01",
      minInvestment: 25000,
      maxInvestment: 2000000,
      roi: 25,
      timeToMaturity: 36, // months
      risk: "high",
      industry: "Energy",
      type: "Investment",
    },
    {
      id: "proj-004",
      name: "E-commerce Platform Redesign",
      description: "Complete UX/UI overhaul and performance optimization",
      status: "Active",
      progress: 50,
      deadline: "2025-04-15",
      minInvestment: 7500,
      maxInvestment: 300000,
      roi: 15,
      timeToMaturity: 12, // months
      risk: "low",
      industry: "Retail",
      type: "Collaboration",
    },
    {
      id: "proj-005",
      name: "Blockchain Payment Solution",
      description: "Secure cross-border payment system using blockchain",
      status: "Active",
      progress: 35,
      deadline: "2025-07-20",
      minInvestment: 15000,
      maxInvestment: 1000000,
      roi: 30,
      timeToMaturity: 30, // months
      risk: "high",
      industry: "Finance",
      type: "Investment",
    },
    {
      id: "proj-006",
      name: "Mobile App Development",
      description: "Cross-platform mobile application for service providers",
      status: "Active",
      progress: 75,
      deadline: "2025-03-10",
      minInvestment: 5000,
      maxInvestment: 250000,
      roi: 20,
      timeToMaturity: 10, // months
      risk: "medium",
      industry: "Technology",
      type: "Collaboration",
    },
  ]

  // Calculate investment growth and find recommended projects
  const calculateInvestment = () => {
    // Calculate growth percentage needed
    const growthPercent = (targetAmount / initialAmount - 1) * 100
    setGrowthNeeded(growthPercent)

    // Filter projects based on criteria
    let filteredProjects = [...projects]

    // Filter by minimum investment amount
    filteredProjects = filteredProjects.filter((project) => project.minInvestment <= initialAmount)

    // Filter by risk tolerance
    if (riskTolerance !== "any") {
      filteredProjects = filteredProjects.filter((project) => {
        if (riskTolerance === "low") return project.risk === "low"
        if (riskTolerance === "medium") return project.risk === "low" || project.risk === "medium"
        return true // high risk tolerance accepts all
      })
    }

    // Filter by timeframe
    if (timeframe !== "any") {
      const timeframeMonths = Number.parseInt(timeframe)
      filteredProjects = filteredProjects.filter((project) => project.timeToMaturity <= timeframeMonths)
    }

    // Sort projects by how well they match the growth needed
    filteredProjects.sort((a, b) => {
      // Calculate time needed to reach target with each project
      const timeToTargetA = Math.log(targetAmount / initialAmount) / Math.log(1 + a.roi / 100)
      const timeToTargetB = Math.log(targetAmount / initialAmount) / Math.log(1 + b.roi / 100)

      // Prefer projects that can reach the target within their maturity period
      const aCanReachTarget = timeToTargetA <= a.timeToMaturity / 12
      const bCanReachTarget = timeToTargetB <= b.timeToMaturity / 12

      if (aCanReachTarget && !bCanReachTarget) return -1
      if (!aCanReachTarget && bCanReachTarget) return 1

      // If both can reach target (or both can't), sort by ROI
      return b.roi - a.roi
    })

    setRecommendedProjects(filteredProjects)
    setCalculationPerformed(true)

    // Select the first project by default
    if (filteredProjects.length > 0) {
      setSelectedProjectId(filteredProjects[0].id)
      setSelectedProject(filteredProjects[0])
    } else {
      setSelectedProjectId(null)
      setSelectedProject(null)
    }
  }

  // Update selected project when selectedProjectId changes
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find((p) => p.id === selectedProjectId)
      setSelectedProject(project || null)
    }
  }, [selectedProjectId])

  // Calculate years to reach target with selected project
  const calculateYearsToTarget = () => {
    if (!selectedProject) return 0

    // Formula: time = log(target/initial) / log(1 + roi/100)
    const years = Math.log(targetAmount / initialAmount) / Math.log(1 + selectedProject.roi / 100)
    return Math.ceil(years * 10) / 10 // Round to 1 decimal place
  }

  // Calculate final amount after project maturity
  const calculateFinalAmount = () => {
    if (!selectedProject) return initialAmount

    // Formula: final = initial * (1 + roi/100)^years
    const years = selectedProject.timeToMaturity / 12
    const finalAmount = initialAmount * Math.pow(1 + selectedProject.roi / 100, years)
    return Math.round(finalAmount)
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
              <Home className="w-6 h-6 mr-2" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Investment Calculator</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="leonardo-card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Calculator className="w-6 h-6 mr-2 text-blue-400" />
            Investment Growth Calculator
          </h2>
          <p className="text-gray-300">
            Use this calculator to determine which projects can help you reach your investment goals. Enter your initial
            investment amount and target amount, and we'll recommend suitable projects.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calculator Form */}
          <div className="lg:col-span-1">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Investment Parameters</CardTitle>
                <CardDescription className="text-gray-400">Enter your investment goals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="initial-amount" className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1 text-gray-400" />
                    Initial Investment
                  </Label>
                  <Input
                    id="initial-amount"
                    type="number"
                    min="100"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(Number(e.target.value))}
                    className="leonardo-input"
                  />
                  <p className="text-xs text-gray-400">Minimum investment varies by project</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-amount" className="flex items-center">
                    <Target className="w-4 h-4 mr-1 text-gray-400" />
                    Target Amount
                  </Label>
                  <Input
                    id="target-amount"
                    type="number"
                    min={initialAmount + 1}
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="leonardo-input"
                  />
                  <p className="text-xs text-gray-400">Your investment goal</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe" className="flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    Timeframe
                  </Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="leonardo-input">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="any">Any timeframe</SelectItem>
                      <SelectItem value="12">Up to 1 year</SelectItem>
                      <SelectItem value="24">Up to 2 years</SelectItem>
                      <SelectItem value="36">Up to 3 years</SelectItem>
                      <SelectItem value="60">Up to 5 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk-tolerance" className="flex items-center">
                    <BarChart2 className="w-4 h-4 mr-1 text-gray-400" />
                    Risk Tolerance
                  </Label>
                  <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                    <SelectTrigger className="leonardo-input">
                      <SelectValue placeholder="Select risk level" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="any">Any Risk Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full gradient-button"
                  onClick={calculateInvestment}
                  disabled={!initialAmount || !targetAmount || initialAmount >= targetAmount}
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  Calculate Investment
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {calculationPerformed ? (
              <>
                {/* Growth Summary */}
                <Card className="leonardo-card border-gray-800 mb-6">
                  <CardHeader>
                    <CardTitle>Investment Growth Summary</CardTitle>
                    <CardDescription className="text-gray-400">
                      {growthNeeded > 0
                        ? `You need ${growthNeeded.toFixed(2)}% growth to reach your target`
                        : "Please enter valid investment parameters"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Initial Investment</p>
                        <p className="text-2xl font-bold">${initialAmount.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Target Amount</p>
                        <p className="text-2xl font-bold">${targetAmount.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-400">Growth Needed</p>
                        <p className="text-2xl font-bold">{growthNeeded.toFixed(2)}%</p>
                      </div>
                    </div>

                    {recommendedProjects.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-medium mb-4">Recommended Projects</h3>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                          <TabsList className="leonardo-tabs">
                            <TabsTrigger value="all" className="leonardo-tab">
                              All
                            </TabsTrigger>
                            <TabsTrigger value="low" className="leonardo-tab">
                              Low Risk
                            </TabsTrigger>
                            <TabsTrigger value="medium" className="leonardo-tab">
                              Medium Risk
                            </TabsTrigger>
                            <TabsTrigger value="high" className="leonardo-tab">
                              High Risk
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="all" className="space-y-4">
                            {recommendedProjects.map((project) => (
                              <div
                                key={project.id}
                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                  selectedProjectId === project.id
                                    ? "bg-blue-500/20 border-blue-500/50"
                                    : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                                }`}
                                onClick={() => setSelectedProjectId(project.id)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-medium">{project.name}</h4>
                                    <p className="text-sm text-gray-400">{project.description}</p>
                                  </div>
                                  <RiskBadge level={project.risk} />
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm mt-4">
                                  <div>
                                    <span className="text-gray-400">ROI:</span>
                                    <span className="ml-1 text-white">{project.roi}%</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Min:</span>
                                    <span className="ml-1 text-white">${project.minInvestment.toLocaleString()}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400">Time:</span>
                                    <span className="ml-1 text-white">{project.timeToMaturity} months</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </TabsContent>

                          <TabsContent value="low" className="space-y-4">
                            {recommendedProjects
                              .filter((p) => p.risk === "low")
                              .map((project) => (
                                <div
                                  key={project.id}
                                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                    selectedProjectId === project.id
                                      ? "bg-blue-500/20 border-blue-500/50"
                                      : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                                  }`}
                                  onClick={() => setSelectedProjectId(project.id)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-medium">{project.name}</h4>
                                      <p className="text-sm text-gray-400">{project.description}</p>
                                    </div>
                                    <RiskBadge level={project.risk} />
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-sm mt-4">
                                    <div>
                                      <span className="text-gray-400">ROI:</span>
                                      <span className="ml-1 text-white">{project.roi}%</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Min:</span>
                                      <span className="ml-1 text-white">${project.minInvestment.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Time:</span>
                                      <span className="ml-1 text-white">{project.timeToMaturity} months</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {recommendedProjects.filter((p) => p.risk === "low").length === 0 && (
                              <p className="text-center text-gray-400 py-4">No low risk projects match your criteria</p>
                            )}
                          </TabsContent>

                          <TabsContent value="medium" className="space-y-4">
                            {recommendedProjects
                              .filter((p) => p.risk === "medium")
                              .map((project) => (
                                <div
                                  key={project.id}
                                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                    selectedProjectId === project.id
                                      ? "bg-blue-500/20 border-blue-500/50"
                                      : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                                  }`}
                                  onClick={() => setSelectedProjectId(project.id)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-medium">{project.name}</h4>
                                      <p className="text-sm text-gray-400">{project.description}</p>
                                    </div>
                                    <RiskBadge level={project.risk} />
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-sm mt-4">
                                    <div>
                                      <span className="text-gray-400">ROI:</span>
                                      <span className="ml-1 text-white">{project.roi}%</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Min:</span>
                                      <span className="ml-1 text-white">${project.minInvestment.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Time:</span>
                                      <span className="ml-1 text-white">{project.timeToMaturity} months</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {recommendedProjects.filter((p) => p.risk === "medium").length === 0 && (
                              <p className="text-center text-gray-400 py-4">
                                No medium risk projects match your criteria
                              </p>
                            )}
                          </TabsContent>

                          <TabsContent value="high" className="space-y-4">
                            {recommendedProjects
                              .filter((p) => p.risk === "high")
                              .map((project) => (
                                <div
                                  key={project.id}
                                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                                    selectedProjectId === project.id
                                      ? "bg-blue-500/20 border-blue-500/50"
                                      : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50"
                                  }`}
                                  onClick={() => setSelectedProjectId(project.id)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h4 className="font-medium">{project.name}</h4>
                                      <p className="text-sm text-gray-400">{project.description}</p>
                                    </div>
                                    <RiskBadge level={project.risk} />
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 text-sm mt-4">
                                    <div>
                                      <span className="text-gray-400">ROI:</span>
                                      <span className="ml-1 text-white">{project.roi}%</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Min:</span>
                                      <span className="ml-1 text-white">${project.minInvestment.toLocaleString()}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Time:</span>
                                      <span className="ml-1 text-white">{project.timeToMaturity} months</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {recommendedProjects.filter((p) => p.risk === "high").length === 0 && (
                              <p className="text-center text-gray-400 py-4">
                                No high risk projects match your criteria
                              </p>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    ) : (
                      <div className="text-center p-6 bg-gray-800/30 rounded-lg border border-gray-700">
                        <p className="text-lg font-medium mb-2">No matching projects found</p>
                        <p className="text-gray-400 mb-4">
                          Try adjusting your investment parameters or risk tolerance to find suitable projects.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Selected Project Details */}
                {selectedProject && (
                  <Card className="leonardo-card border-gray-800">
                    <CardHeader>
                      <CardTitle>Investment Projection</CardTitle>
                      <CardDescription className="text-gray-400">
                        Detailed analysis for {selectedProject.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                          <p className="text-sm text-gray-400">Expected ROI</p>
                          <p className="text-2xl font-bold">{selectedProject.roi}%</p>
                        </div>
                        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                          <p className="text-sm text-gray-400">Years to Target</p>
                          <p className="text-2xl font-bold">{calculateYearsToTarget()}</p>
                        </div>
                        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                          <p className="text-sm text-gray-400">Final Amount</p>
                          <p className="text-2xl font-bold">${calculateFinalAmount().toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                          <PieChart className="w-5 h-5 mr-2 text-blue-400" />
                          Growth Projection
                        </h3>
                        <GrowthChart
                          initialAmount={initialAmount}
                          targetAmount={targetAmount}
                          years={Math.ceil(calculateYearsToTarget())}
                          roi={selectedProject.roi}
                        />
                      </div>

                      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700 mb-6">
                        <h3 className="text-lg font-medium mb-2">Project Details</h3>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-400">Status:</span>
                            <StatusBadge status={selectedProject.status} />
                          </div>
                          <div>
                            <span className="text-gray-400">Industry:</span>
                            <span className="ml-1 text-white">{selectedProject.industry}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Type:</span>
                            <span className="ml-1 text-white">{selectedProject.type}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Deadline:</span>
                            <span className="ml-1 text-white">
                              {new Date(selectedProject.deadline).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <h3 className="text-lg font-medium">Project Progress</h3>
                        <ProgressBar value={selectedProject.progress} max={100} />
                      </div>

                      <div className="flex justify-end">
                        <Link href={`/marketplace/apply/${selectedProject.id}?amount=${initialAmount}`}>
                          <Button className="gradient-button">
                            Invest in This Project
                            <ArrowRight className="ml-2 w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="leonardo-card border-gray-800 h-full flex flex-col justify-center items-center p-8">
                <CardContent className="text-center">
                  <Calculator className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Investment Calculator</h3>
                  <p className="text-gray-400 mb-6">
                    Enter your investment parameters on the left to calculate potential growth and see recommended
                    projects.
                  </p>
                  <div className="flex flex-col space-y-4 max-w-md mx-auto">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                        <span className="font-bold">1</span>
                      </div>
                      <p className="text-gray-300">Enter your initial investment amount</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                        <span className="font-bold">2</span>
                      </div>
                      <p className="text-gray-300">Set your target amount</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                        <span className="font-bold">3</span>
                      </div>
                      <p className="text-gray-300">Choose your timeframe and risk tolerance</p>
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                        <span className="font-bold">4</span>
                      </div>
                      <p className="text-gray-300">Get personalized investment recommendations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}


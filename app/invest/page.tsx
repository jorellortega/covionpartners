"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
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
  Search,
  Building2,
  Clock,
  Key,
  AlertCircle,
  ArrowLeft,
  BarChart2,
  TrendingUp,
  Wallet,
  Calculator,
  FileText,
  Target,
} from "lucide-react"
import { toast } from "sonner"

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

export default function InvestorDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <InvestorDashboardContent />
    </Suspense>
  )
}

function InvestorDashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { projects, loading, error } = useProjects()
  const [selectedProject, setSelectedProject] = useState("")
  const [investmentAmount, setInvestmentAmount] = useState("")
  const [projectKey, setProjectKey] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInvestmentType, setSelectedInvestmentType] = useState("")

  // Check if user has access to this page and handle project pre-selection
  useEffect(() => {
    if (user && !["investor", "partner", "admin"].includes(user.role)) {
      router.push("/")
      toast.error("You don't have access to this page")
      return
    }

    // Handle project pre-selection from URL
    const projectId = searchParams.get('project')
    if (projectId && projects?.some(p => p.id === projectId)) {
      setSelectedProject(projectId)
      // Scroll to investment section
      const investmentSection = document.getElementById('investment-section')
      if (investmentSection) {
        investmentSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [user, router, projects, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">Error loading projects: {error}</p>
        </div>
      </div>
    )
  }

  const handleInvest = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first")
      return
    }

    if (!investmentAmount || isNaN(Number(investmentAmount)) || Number(investmentAmount) <= 0) {
      toast.error("Please enter a valid investment amount")
      return
    }

    // TODO: Implement investment logic here
    toast.success(`Successfully invested $${investmentAmount} in ${projects?.find(p => p.id === selectedProject)?.name}`)
    setSelectedProject("")
    setInvestmentAmount("")
  }

  const handleProjectKeySubmit = () => {
    const project = projects?.find(p => p.id === projectKey)
    if (project) {
      setSelectedProject(project.id)
    } else {
      toast.error("Project not found. Please check the project key.")
    }
  }

  // Filter projects based on search query and public visibility
  const filteredProjects = projects?.filter(project =>
    project.visibility === 'public' && (
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || []

  return (
    <>
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
              <h1 className="text-2xl font-bold">Investor Dashboard</h1>
              <p className="text-gray-400">Browse and invest in projects</p>
            </div>
          </div>
        </div>

        {/* Project Key Input */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-400" />
              <CardTitle>Project Key</CardTitle>
            </div>
            <CardDescription>Enter a project key to invest directly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Enter project key..."
                    value={projectKey}
                    onChange={(e) => setProjectKey(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button 
                onClick={handleProjectKeySubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Submit
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Project Selection */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              <CardTitle>Select Project</CardTitle>
            </div>
            <CardDescription>Choose a project to invest in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search public projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Search Results or Select Dropdown */}
              {searchQuery ? (
                // Search Results
                <div className="space-y-2">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg cursor-pointer hover:bg-gray-700/30 transition-colors"
                        onClick={() => setSelectedProject(project.id)}
                      >
                        <div className="flex items-center gap-3">
                          {project.media_files && project.media_files.length > 0 ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={project.media_files[0].url}
                                alt={project.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <Building2 className="w-12 h-12 text-purple-400" />
                          )}
                          <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-gray-400 line-clamp-1">
                              {project.description || 'No description available'}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={project.status} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-400">
                      No projects found matching your search
                    </div>
                  )}
                </div>
              ) : (
                // Select Dropdown
                <div className="space-y-2">
                  <Label htmlFor="project">Or select from all public projects</Label>
                  <select
                    id="project"
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full rounded-md border border-gray-700 bg-gray-800/30 px-3 py-2 text-white"
                    disabled={loading}
                  >
                    <option value="">Select a public project</option>
                    {projects?.filter(p => p.visibility === 'public').map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {loading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <LoadingSpinner className="w-4 h-4" />
                      Loading projects...
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Investment Details */}
        <Card id="investment-section" className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              <CardTitle>Investment Details</CardTitle>
            </div>
            <CardDescription>Enter your investment amount and review details</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const project = projects?.find(p => p.id === selectedProject)
              if (!project) return null

              return (
                <div className="space-y-6">
                  {/* Project Information */}
                  <div className="flex items-center gap-4 mb-6">
                    {project.media_files && project.media_files.length > 0 ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={project.media_files[0].url}
                          alt={project.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg bg-gray-800/50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-12 h-12 text-purple-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">{project.name}</h3>
                      <p className="text-gray-400 mt-1">{project.description}</p>
                    </div>
                  </div>

                  {/* Funding Progress */}
                  <div className="space-y-2">
                    <Label className="text-gray-400">Funding Progress</Label>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ 
                          width: `${project.funding_goal && project.current_funding 
                            ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-right text-sm text-purple-400">
                      {project.funding_goal && project.current_funding 
                        ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                        : 0}% funded
                    </div>
                  </div>

                  {/* Investment Types */}
                  <div className="space-y-4">
                    <Label className="text-gray-400">Available Investment Types</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        variant={selectedInvestmentType === "equity" ? "default" : "outline"}
                        className={`flex flex-col items-center gap-2 h-auto py-4 relative group ${
                          selectedInvestmentType === "equity" ? "border-purple-400" : ""
                        }`}
                        onClick={() => setSelectedInvestmentType("equity")}
                      >
                        <div className="absolute top-2 right-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          Available
                        </div>
                        <DollarSign className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-medium">Equity</span>
                        <span className="text-xs text-gray-400">Min: $10,000</span>
                      </Button>
                      <Button 
                        variant={selectedInvestmentType === "debt" ? "default" : "outline"}
                        className={`flex flex-col items-center gap-2 h-auto py-4 relative group ${
                          selectedInvestmentType === "debt" ? "border-purple-400" : ""
                        }`}
                        onClick={() => setSelectedInvestmentType("debt")}
                      >
                        <div className="absolute top-2 right-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                          Available
                        </div>
                        <Building2 className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-medium">Debt</span>
                        <span className="text-xs text-gray-400">Min: $5,000</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center gap-2 h-auto py-4 relative group opacity-50 cursor-not-allowed"
                      >
                        <div className="absolute top-2 right-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                          Coming Soon
                        </div>
                        <Target className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-medium">Revenue Share</span>
                        <span className="text-xs text-gray-400">Min: $1,000</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex flex-col items-center gap-2 h-auto py-4 relative group opacity-50 cursor-not-allowed"
                      >
                        <div className="absolute top-2 right-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                          Coming Soon
                        </div>
                        <Wallet className="w-5 h-5 text-purple-400" />
                        <span className="text-sm font-medium">Convertible Note</span>
                        <span className="text-xs text-gray-400">Min: $25,000</span>
                      </Button>
                    </div>
                    {!selectedInvestmentType && (
                      <div className="flex items-center text-yellow-500 text-sm mt-2">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span>Please select an investment type to proceed</span>
                      </div>
                    )}
                  </div>

                  {/* Investment Form */}
                  <div className="space-y-4">
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
                    <div className="flex items-center text-yellow-500 text-sm">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span>Funding goal: ${project.funding_goal?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProject("")
                        setInvestmentAmount("")
                        setSelectedInvestmentType("")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => router.push(`/invest/${selectedProject}?type=${selectedInvestmentType}`)}
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!selectedInvestmentType}
                    >
                      View Investment Details
                    </Button>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </main>
    </div>
    </>
  )
} 
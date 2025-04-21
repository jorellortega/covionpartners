"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
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
  Building2,
  ArrowLeft,
  TrendingUp,
  LineChart,
  FileText,
  Users,
  Bell,
  MessageSquare,
  Calendar,
  DollarSign,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
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

export default function InvestedProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error } = useProjects()
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'documents' | 'team'>('overview')

  const resolvedParams = use(params)
  const project = projects?.find(p => p.id === resolvedParams.id)

  // Mock data (replace with real data from API)
  const mockInvestmentDetails = {
    investmentAmount: 15000,
    investmentDate: "2024-02-15",
    investmentType: "Equity",
    sharePercentage: "3.5%",
    currentValue: 16500,
    returnRate: 10,
    nextPayoutDate: "2024-06-15",
  }

  const mockUpdates = [
    {
      id: 1,
      date: "2024-03-01",
      title: "Quarterly Progress Report",
      type: "report",
      description: "Project milestones achieved, financial performance review",
    },
    {
      id: 2,
      date: "2024-02-15",
      title: "New Partnership Announcement",
      type: "announcement",
      description: "Strategic partnership formed with key industry player",
    },
  ]

  // Check if user has access to this page
  useEffect(() => {
    if (user && !["investor", "partner", "admin"].includes(user.role)) {
      router.push("/")
      toast.error("You don't have access to this page")
    }
  }, [user, router])

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

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-purple-400"
              onClick={() => router.push('/portfolio')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portfolio
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            <Button variant="outline" className="gap-2">
              <Bell className="w-4 h-4" />
              Subscribe to Updates
            </Button>
          </div>
        </div>

        {/* Project Header */}
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
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Your Investment</div>
                    <div className="text-2xl font-bold text-purple-400">
                      ${mockInvestmentDetails.investmentAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-400">
                      {mockInvestmentDetails.sharePercentage} Ownership
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Investment Performance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                ${mockInvestmentDetails.currentValue.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm mt-1">
                <TrendingUp className="w-4 h-4" />
                <span>+{mockInvestmentDetails.returnRate}% Return</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(mockInvestmentDetails.nextPayoutDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                <Calendar className="w-4 h-4" />
                <span>Quarterly Distribution</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investment Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockInvestmentDetails.investmentType}
              </div>
              <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                <DollarSign className="w-4 h-4" />
                <span>Invested on {new Date(mockInvestmentDetails.investmentDate).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="rounded-none border-b-2 border-transparent"
            style={activeTab === 'overview' ? { borderColor: 'rgb(168, 85, 247)' } : {}}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'updates' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('updates')}
            className="rounded-none border-b-2 border-transparent"
            style={activeTab === 'updates' ? { borderColor: 'rgb(168, 85, 247)' } : {}}
          >
            Updates
          </Button>
          <Button
            variant={activeTab === 'documents' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('documents')}
            className="rounded-none border-b-2 border-transparent"
            style={activeTab === 'documents' ? { borderColor: 'rgb(168, 85, 247)' } : {}}
          >
            Documents
          </Button>
          <Button
            variant={activeTab === 'team' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('team')}
            className="rounded-none border-b-2 border-transparent"
            style={activeTab === 'team' ? { borderColor: 'rgb(168, 85, 247)' } : {}}
          >
            Team
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-400">Total Funding</div>
                    <div className="text-2xl font-bold">
                      ${project.current_funding?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-400">
                      of ${project.funding_goal?.toLocaleString() || '0'} goal
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Project Timeline</div>
                    <div className="text-2xl font-bold">
                      {new Date(project.deadline).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-400">Estimated completion</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Project Type</div>
                    <div className="text-2xl font-bold">{project.type}</div>
                    <div className="text-sm text-gray-400">Category</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border border-gray-800 rounded-lg">
                  <div className="text-gray-400">Performance chart will be displayed here</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-4">
            {mockUpdates.map(update => (
              <Card key={update.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {update.type === 'report' ? (
                        <FileText className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Bell className="w-5 h-5 text-purple-400" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{update.title}</CardTitle>
                        <CardDescription>{new Date(update.date).toLocaleDateString()}</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{update.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Investment Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="font-medium">Investment Agreement</div>
                        <div className="text-sm text-gray-400">Signed on {mockInvestmentDetails.investmentDate}</div>
                      </div>
                    </div>
                    <Button variant="outline">Download</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="font-medium">Financial Reports</div>
                        <div className="text-sm text-gray-400">Last updated: March 2024</div>
                      </div>
                    </div>
                    <Button variant="outline">Download</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.team_members?.map((member, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="font-medium">{member.role}</div>
                          <div className="text-sm text-gray-400">Joined {new Date(member.joined_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <Button variant="ghost">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  BarChart2,
  Briefcase,
  LogOut,
  Globe,
  ArrowRight,
  Calendar,
  DollarSign,
  Clock,
  Lightbulb,
  Calculator,
  Plus,
  BarChart3,
  Building2,
  FileText,
  Settings,
  Users,
  Bell,
  TrendingUp,
  PieChart,
  Target,
  ExternalLink,
  Wallet,
  PlusCircle,
  MoreHorizontal,
  BanknoteIcon as Bank,
  CreditCard,
  Check,
  Bitcoin,
  MessageCircle,
  Search,
  Filter,
  SortAsc,
  Handshake,
  Star,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { ErrorMessage } from "@/components/ui/error-message"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ProjectCardSkeleton } from "@/components/ui/loading-skeleton"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { Project, ProjectRole } from "@/types"

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

// Add a new component for disabled buttons
function DisabledButton({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className="relative pt-3">
      <Button 
        className={`w-full gradient-button opacity-50 cursor-not-allowed ${className}`}
        disabled={true}
      >
        {children}
      </Button>
      <div className="absolute -top-1 right-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full z-[100]">
        Under Development
      </div>
    </div>
  )
}

// Add a new component for disabled cards
function DisabledCard({ title, icon, children, className = "" }: { 
  title: string, 
  icon: React.ReactNode, 
  children: React.ReactNode,
  className?: string 
}) {
  return (
    <div className="relative pt-3">
      <Card className={`leonardo-card border-gray-800 ${className}`}>
        <div className="absolute -top-1 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full z-[100]">
          Under Development
        </div>
        <CardHeader className="pb-2 opacity-50">
          <CardTitle className="flex items-center">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="opacity-50">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

interface ProjectWithRole extends Project {
  role: ProjectRole
}

export default function PartnerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { projects } = useProjects(user?.id || '')
  const [searchQuery, setSearchQuery] = useState("")
  const [myProjects, setMyProjects] = useState<ProjectWithRole[]>([])
  const [loadingMyProjects, setLoadingMyProjects] = useState(true)

  // Mock data for demonstration
  const [totalRevenue] = useState(0)
  const [teamMembers] = useState([])
  const [growthRate] = useState(0)
  const [documents] = useState([])
  const [availableBalance] = useState(0)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")

  useEffect(() => {
    if (!loading) {
      if (!user) {
         console.log('Dashboard: Auth check complete, no user found. Redirecting to login.')
         router.push('/login')
      } else {
        console.log('Dashboard: Auth check complete, user found:', user.email)
      }
    } else {
      console.log('Dashboard: Auth check in progress...')
    }
  }, [user, loading, router])

  // Fetch projects where user has a role
  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!user) return

      try {
        // First get the user's roles
        const { data: roles, error: rolesError } = await supabase
          .from('project_roles')
          .select(`
            *,
            project:projects(*)
          `)
          .eq('user_id', user.id)

        if (rolesError) throw rolesError

        // Transform the data to match our interface
        const projectsWithRoles = roles.map(role => ({
          ...role.project,
          role: {
            name: role.role_name,
            description: role.description,
            status: role.status
          }
        }))

        setMyProjects(projectsWithRoles)
      } catch (err) {
        console.error('Error fetching my projects:', err)
      } finally {
        setLoadingMyProjects(false)
      }
    }

    fetchMyProjects()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Checking authentication...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    console.warn('Dashboard: Rendered without user after loading completed. Should have redirected.')
    return null
  }

  const handleWithdraw = () => {
    // Implement withdraw logic here
    console.log("Withdrawing", amount, paymentMethod)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold">Partner Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
            {user.role !== 'viewer' && (
              <>
                <Button className="gradient-button w-full sm:w-auto" onClick={() => router.push("/projects/new")}>
                  <Plus className="w-5 h-5 mr-2" />
                  New Project
                </Button>
                <Button className="gradient-button w-full sm:w-auto" onClick={() => router.push("/team")}>
                  <Users className="w-5 h-5 mr-2" />
                  Manage Team
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-red-900/20 hover:text-red-400 w-full sm:w-auto"
              onClick={() => {
                router.push("/login")
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="leonardo-card p-4 sm:p-6 mb-4 sm:mb-6">
          <h2 className="text-xl font-bold mb-4">Welcome back, {user.name}</h2>
          <p className="text-gray-300">
            Here's an overview of your projects, revenue, and team performance.
          </p>
        </div>

        <div className="space-y-8">
          {/* Updates Section */}
          {user.role !== 'viewer' && (
            <Card className="leonardo-card border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-yellow-400" />
                  Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium">System Updates Available</p>
                        <p className="text-xs text-gray-400">Check out our latest platform updates</p>
                      </div>
                    </div>
                    <Link href="/updates">
                      <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Withdraw Card - Keep this enabled */}
          {user.role !== 'viewer' && (
            <Card className="leonardo-card border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-red-400" />
                  Withdraw
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-sm text-gray-400">Available Balance</p>
                  </div>
                  <Link href="/payments">
                    <Button variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Withdraw Funds
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Partner Type & Ownership Card - Disabled */}
          {user.role !== 'viewer' && (
            <DisabledCard 
              title="Partnership Details" 
              icon={<Building2 className="w-5 h-5 mr-2 text-purple-400" />}
            >
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-400">Current Role</div>
                  <div className="text-2xl font-bold text-white">Managing Partner</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-400">Ownership Stake</div>
                  <div className="text-4xl font-bold text-blue-400">0%</div>
                </div>
              </div>
            </DisabledCard>
          )}

          {/* Quick Stats - Disabled */}
          {user.role !== 'viewer' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                {
                  title: "Active Projects",
                  value: "0",
                  change: "+0 this month",
                  icon: <Building2 className="w-6 h-6 text-blue-400" />
                },
                {
                  title: "Total Revenue",
                  value: "$0.00",
                  change: "+0% from last month",
                  icon: <DollarSign className="w-6 h-6 text-green-400" />
                },
                {
                  title: "Team Members",
                  value: "0",
                  change: "+0 this month",
                  icon: <Users className="w-6 h-6 text-purple-400" />
                },
                {
                  title: "Growth Rate",
                  value: "+0%",
                  change: "+0% from last month",
                  icon: <BarChart3 className="w-6 h-6 text-yellow-400" />
                }
              ].map((stat, index) => (
                <DisabledCard
                  key={index}
                  title={stat.title}
                  icon={stat.icon}
                >
                  <div>
                    <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                    <div className="mt-4 flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                      <span className="text-green-400 text-sm">{stat.change}</span>
                    </div>
                  </div>
                </DisabledCard>
              ))}
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity - Disabled */}
            {user.role !== 'viewer' && (
              <DisabledCard 
                title="Recent Activity"
                icon={<Clock className="w-5 h-5 mr-2 text-blue-400" />}
                className="lg:col-span-2"
              >
                <div className="space-y-4">
                  <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                    <p className="text-gray-400">Activity feed is under development</p>
                  </div>
                </div>
              </DisabledCard>
            )}

            {/* Quick Actions */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.role === 'viewer' ? (
                    <Button 
                      className="w-full gradient-button"
                      onClick={() => router.push('/publicprojects')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Public Projects
                    </Button>
                  ) : (
                    <>
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/projects')}
                      >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Projects
                      </Button>
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/publicprojects')}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Public Projects
                      </Button>
                      <DisabledButton>
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Project
                      </DisabledButton>
                      <DisabledButton>
                        <Building2 className="w-4 h-4 mr-2" />
                        Create Organization
                      </DisabledButton>
                      <DisabledButton>
                        <Users className="w-4 h-4 mr-2" />
                        Manage Team
                      </DisabledButton>
                      <DisabledButton>
                        <DollarSign className="w-4 h-4 mr-2" />
                        View Revenue
                      </DisabledButton>
                      <DisabledButton>
                        <BarChart2 className="w-4 h-4 mr-2" />
                        View Analytics
                      </DisabledButton>
                      <DisabledButton>
                        <Globe className="w-4 h-4 mr-2" />
                        Browse Opportunities
                      </DisabledButton>
                      <DisabledButton>
                        <FileText className="w-4 h-4 mr-2" />
                        View Documents
                      </DisabledButton>
                      {/* Keep Payments enabled */}
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/payments')}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Manage Payments
                      </Button>
                      <DisabledButton>
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Submit Project Request
                      </DisabledButton>
                      {/* Keep Updates enabled */}
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/updates')}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Updates
                      </Button>
                      {/* Keep Withdraw enabled */}
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/payments')}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Withdraw Funds
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Overview - Already disabled */}
          {user.role !== 'viewer' && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Active Projects</h2>
                <div className="relative pt-3">
                  <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white opacity-50 cursor-not-allowed" disabled>
                    View All
                  </Button>
                  <div className="absolute -top-1 right-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full z-[100]">
                    Under Development
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="relative pt-3">
                  <Card className="leonardo-card border-gray-800 p-8 text-center">
                    <div className="absolute -top-1 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full z-[100]">
                      Under Development
                    </div>
                    <CardContent className="opacity-50">
                      <p className="text-gray-400">Project management features are currently under development.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* My Projects Section */}
          {user.role !== 'viewer' && (
            <div className="col-span-full">
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    My Projects
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Projects where you have an assigned role
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingMyProjects ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : myProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">You haven't been assigned to any projects yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myProjects.map((project) => (
                        <div key={project.id} className="p-4 bg-gray-800/30 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-medium text-white">{project.name}</h3>
                                <StatusBadge status={project.status} />
                              </div>
                              <div className="flex items-center text-gray-400">
                                <Briefcase className="w-4 h-4 mr-2" />
                                <span>Your Role: {project.role.name}</span>
                              </div>
                              <p className="text-sm text-gray-400">{project.description}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center text-gray-400">
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  <span>Investment: ${project.invested?.toLocaleString() || '0'}</span>
                                </div>
                                <div className="flex items-center text-gray-400">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push(`/projects/${project.id}/team`)}
                              >
                                View Team
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-gray-700"
                                onClick={() => router.push(`/projects/${project.id}`)}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                View Details
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Opportunities Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">Get Involved</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <DisabledCard 
              title="Become an Investor"
              icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
            >
              <p className="text-sm text-white/60 mb-4">
                Join our network of investors and get access to exclusive investment opportunities in innovative projects.
              </p>
            </DisabledCard>

            <DisabledCard 
              title="Join as Team Member"
              icon={<Users className="w-5 h-5 text-purple-400" />}
            >
              <p className="text-sm text-white/60 mb-4">
                Work with talented professionals on exciting projects and grow your career.
              </p>
            </DisabledCard>

            <DisabledCard 
              title="Join an Organization"
              icon={<Building2 className="w-5 h-5 text-green-400" />}
            >
              <p className="text-sm text-white/60 mb-4">
                Connect with established organizations and collaborate on projects.
              </p>
            </DisabledCard>

            <DisabledCard 
              title="Partnership"
              icon={<Handshake className="w-5 h-5 text-yellow-400" />}
            >
              <p className="text-sm text-white/60 mb-4">
                Form strategic partnerships to grow your business and expand your network.
              </p>
            </DisabledCard>

            <DisabledCard 
              title="Create Organization"
              icon={<PlusCircle className="w-5 h-5 text-red-400" />}
            >
              <p className="text-sm text-white/60 mb-4">
                Launch your own organization and manage projects under your brand.
              </p>
            </DisabledCard>

            <DisabledCard 
              title="Project Actions"
              icon={<Briefcase className="w-5 h-5 text-indigo-400" />}
            >
              <div className="space-y-3">
                <p className="text-sm text-white/60">
                  Create, manage, or fund projects
                </p>
              </div>
            </DisabledCard>
          </div>
        </div>
      </main>
    </div>
  )
}
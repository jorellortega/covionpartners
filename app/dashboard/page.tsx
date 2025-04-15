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
  Zap,
  FolderKanban,
  UserPlus,
  CheckCircle,
  XCircle,
  Lock,
  Shield
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

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

// Add this function after the StatusBadge component
function getTierName(role: string) {
  switch (role.toLowerCase()) {
    case "admin":
      return "Enterprise Account"
    case "partner":
      return "Partner Account"
    case "investor":
      return "Investor Account"
    case "viewer":
      return "Public Account"
    default:
      return role
  }
}

// Add role check for DisabledButton
function DisabledButton({ children, className = "", icon, userRole }: { children: React.ReactNode, className?: string, icon?: React.ReactNode, userRole: string }) {
  if (userRole !== 'admin') return null;
  return (
    <div className="relative pt-3">
      <Button 
        className={`w-full gradient-button opacity-50 cursor-not-allowed ${className}`}
        disabled={true}
      >
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Button>
      <div className="absolute -top-1 right-0 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full z-[100]">
        Under Development
      </div>
    </div>
  )
}

// Add role check for DisabledCard
function DisabledCard({ title, icon, children, className = "", userRole }: { 
  title: string, 
  icon: React.ReactNode, 
  children: React.ReactNode,
  className?: string,
  userRole: string
}) {
  if (userRole !== 'admin') return null;
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

interface Deal {
  id: string
  title: string
  description: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  confidentiality_level: 'public' | 'private' | 'confidential'
  participants: {
    id: string
    user_id: string
    status: 'pending' | 'accepted' | 'rejected'
    role: string
    user: {
      name: string
      avatar_url: string
    }
  }[]
}

export default function PartnerDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { projects } = useProjects(user?.id || '')
  const [searchQuery, setSearchQuery] = useState("")
  const [myProjects, setMyProjects] = useState<ProjectWithRole[]>([])
  const [loadingMyProjects, setLoadingMyProjects] = useState(true)
  const [projectKey, setProjectKey] = useState("")
  const [joinError, setJoinError] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deals, setDeals] = useState<Deal[]>([])

  // Mock data for demonstration
  const [totalRevenue] = useState(0)
  const [teamMembers] = useState([])
  const [growthRate] = useState(0)
  const [documents] = useState([])
  const [availableBalance] = useState(0)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
         console.log('Dashboard: Auth check complete, no user found. Redirecting to login.')
         router.push('/login')
      } else {
        console.log('Dashboard: Auth check complete, user found:', user.email)
      }
    } else {
      console.log('Dashboard: Auth check in progress...')
    }
  }, [user, authLoading, router])

  // Fetch projects where user has a role
  useEffect(() => {
    const fetchMyProjects = async () => {
      if (!user) return

      try {
        // Get both owned projects and projects where user has a role
        const { data: ownedProjects, error: ownedError } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id)

        if (ownedError) throw ownedError

        // Get projects where user has a role
        const { data: roles, error: rolesError } = await supabase
          .from('project_roles')
          .select(`
            *,
            project:projects(*)
          `)
          .eq('user_id', user.id)

        if (rolesError) throw rolesError

        // Transform the data to match our interface
        const projectsWithRoles = roles
          .filter(r => r.project) // Ensure project data is not null
          .map(role => ({
            ...(role.project as unknown as Project),
            role: {
              name: role.role_name,
              description: role.description,
              status: role.status
            }
          }))

        // Combine owned projects and projects with roles
        const allProjects = [
          ...(ownedProjects || []).map(project => ({
            ...project,
            role: {
              name: 'Owner',
              description: 'Project Owner',
              status: 'active'
            }
          })),
          ...projectsWithRoles
        ]

        // Remove duplicates based on project ID
        const uniqueProjects = allProjects.filter((project, index, self) =>
          index === self.findIndex(p => p.id === project.id)
        )

        setMyProjects(uniqueProjects)
      } catch (err) {
        console.error('Error fetching my projects:', err)
        toast({
          title: "Error",
          description: "Failed to load your projects",
          variant: "destructive"
        })
      } finally {
        setLoadingMyProjects(false)
      }
    }

    fetchMyProjects()
  }, [user, toast])

  useEffect(() => {
    if (!user) {
      console.log('No user found, skipping deals fetch')
      return
    }

    const fetchDeals = async () => {
      try {
        console.log('Fetching deals for user:', user.id)
        const { data, error } = await supabase
          .from('deals')
          .select(`
            *,
            participants:deal_participants(
              id,
              user_id,
              status,
              role,
              user:users(
                name,
                avatar_url
              )
            )
          `)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          throw error
        }
        
        console.log('Fetched deals:', data)
        setDeals(data || [])
      } catch (error) {
        console.error('Error fetching deals:', error)
        toast({
          title: "Error",
          description: "Failed to fetch deals. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [user, toast])

  if (authLoading) {
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
    // Implement withdrawal logic here
    console.log("Withdrawing", amount, paymentMethod)
  }

  const handleJoinProject = async () => {
    if (!projectKey.trim() || !user?.id) return;
    
    setIsJoining(true)
    setJoinError("")
    
    try {
      // Find the project with this key
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('project_key', projectKey.trim())
        .single()

      if (projectError || !projectData) {
        throw new Error('Invalid project key')
      }

      // Add user as team member
      const { error: joinError } = await supabase
        .from('team_members')
        .insert([{
          project_id: projectData.id,
          user_id: user.id,
          role: 'member',
          status: 'pending',
          joined_at: new Date().toISOString()
        }])

      if (joinError) throw joinError

      // Clear the input and close dialog
      setProjectKey("")
      const dialog = document.querySelector('[data-state="open"]')
      if (dialog) {
        const closeButton = dialog.querySelector('button[aria-label="Close"]') as HTMLButtonElement
        if (closeButton) {
          closeButton.click()
        }
      }

      // Show success message using toast
      toast({
        title: "Success",
        description: "Successfully joined project! Redirecting..."
      })
      
      // Redirect to the project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectData.id}`)
      }, 1000)
    } catch (error: any) {
      console.error('Error joining project:', error)
      setJoinError(error.message || 'Failed to join project')
      toast({
        title: "Error",
        description: "Failed to join project",
        variant: "destructive"
      })
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold">Partner Dashboard</h1>
            <Badge className="ml-3 bg-gray-800/30 text-gray-300 border-gray-700">
              {getTierName(user?.role || '')}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
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
          <h2 className="text-xl font-bold mb-4">Welcome, {user?.name || user?.email}!</h2>
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

          {/* My Projects */}
          {user?.role !== 'viewer' && (
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FolderKanban className="w-5 h-5 mr-2" />
                  My Projects
                </CardTitle>
                <CardDescription>Projects you own or are a member of</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Projects list */}
                <div className="space-y-4">
                  {myProjects.map((project) => (
                    <div key={project.id} className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2 mb-4 sm:mb-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-white">{project.name}</h3>
                            <StatusBadge status={project.status} />
                          </div>
                          <div className="flex items-center text-gray-400">
                            <Briefcase className="w-4 h-4 mr-2" />
                            <span>Your Role: {project.role.name}</span>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {project.description || 'No description available'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0 mt-4 sm:mt-0 sm:ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-gray-700 w-full sm:w-auto"
                            onClick={() => router.push(`/projects/${project.id}/team`)}
                          >
                            <Users className="w-3 h-3 mr-1" />
                            View Team
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="text-xs w-full sm:w-auto"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Withdraw Card */}
          {user?.role === 'admin' && (
            <DisabledCard 
              userRole={user.role}
              title="Withdraw"
              icon={<DollarSign className="w-5 h-5 mr-2" />}
            >
              <p className="text-sm text-white/60 mb-4">
                Manage your funds and transactions securely.
              </p>
            </DisabledCard>
          )}

          {/* Quick Action: Withdraw Funds Button */}
          {user?.role === 'admin' && (
            <DisabledButton 
              userRole={user.role}
              icon={<DollarSign className="w-4 h-4 mr-2" />}
            >
              Withdraw Funds
            </DisabledButton>
          )}

          {/* Quick Action: Manage Payments Button */}
          {user?.role === 'admin' && (
            <DisabledButton 
              userRole={user.role}
              icon={<CreditCard className="w-4 h-4 mr-2" />}
            >
              Manage Payments
            </DisabledButton>
          )}

          {/* Make a Deal Button */}
          {user?.role === 'admin' && (
            <DisabledButton 
              userRole={user.role}
              icon={<Handshake className="w-4 h-4 mr-2" />}
            >
              Make a Deal
            </DisabledButton>
          )}

          {/* Schedule & Tasks */}
          {user?.role === 'admin' && (
            <DisabledCard 
              userRole={user.role}
              title="Schedule & Tasks"
              icon={<Calendar className="w-5 h-5 mr-2" />}
            >
              <p className="text-sm text-white/60 mb-4">
                Plan and manage your tasks efficiently.
              </p>
            </DisabledCard>
          )}

          {/* Partner Type & Ownership Card - Disabled */}
          {user.role === 'admin' && (
            <DisabledCard 
              userRole={user.role}
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
          {user.role === 'admin' && (
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
                  userRole={user.role}
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
            {user.role === 'admin' && (
              <DisabledCard 
                userRole={user.role}
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
                  <Button
                    className="w-full gradient-button hover:bg-purple-500"
                    onClick={() => router.push('/projects')}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Projects
                  </Button>
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
                        className="w-full gradient-button hover:bg-purple-500"
                        onClick={() => router.push('/publicprojects')}
                      >
                        <Globe className="w-4 h-4 mr-2" />
                        Public Projects
                      </Button>
                      {user.role === 'admin' && (
                        <DisabledButton userRole={user.role}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create New Project
                        </DisabledButton>
                      )}
                      {user.role === 'admin' && (
                        <DisabledButton userRole={user.role}>
                          <Building2 className="w-4 h-4 mr-2" />
                          Create Organization
                        </DisabledButton>
                      )}
                      {user.role === 'admin' && (
                        <DisabledButton userRole={user.role}>
                          <Users className="w-4 h-4 mr-2" />
                          Manage Team
                        </DisabledButton>
                      )}
                      {user.role === 'admin' && (
                        <DisabledButton userRole={user.role}>
                          <DollarSign className="w-4 h-4 mr-2" />
                          View Revenue
                        </DisabledButton>
                      )}
                      {user.role === 'admin' && (
                        <DisabledButton userRole={user.role}>
                          <BarChart2 className="w-4 h-4 mr-2" />
                          View Analytics
                        </DisabledButton>
                      )}
                      {user.role === 'admin' && (
                        <DisabledButton userRole={user.role}>
                          <Globe className="w-4 h-4 mr-2" />
                          Browse Opportunities
                        </DisabledButton>
                      )}
                      {user.role === 'admin' && (
                        <DisabledButton userRole={user.role}>
                          <FileText className="w-4 h-4 mr-2" />
                          View Documents
                        </DisabledButton>
                      )}
                      {user.role === 'admin' && (
                        <DisabledButton userRole={user.role} icon={<DollarSign className="w-5 h-5 mr-2" />}>
                          Financial Dashboard
                        </DisabledButton>
                      )}
                      {/* Keep Payments enabled */}
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/payments')}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Manage Payments
                      </Button>
                      <DisabledButton userRole={user.role}>
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
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/schedule')}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Schedule & Tasks
                      </Button>
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/makedeal')}
                      >
                        <Handshake className="w-4 h-4 mr-2" />
                        Make Deal
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opportunities Section */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">Get Involved</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <DisabledCard 
                userRole={user.role}
                title="Become an Investor"
                icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
              >
                <p className="text-sm text-white/60 mb-4">
                  Join our network of investors and get access to exclusive investment opportunities in innovative projects.
                </p>
              </DisabledCard>

              <Card className="leonardo-card border-gray-800">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center">
                    <UserPlus className="w-5 h-5 text-green-400 mr-2" />
                    Join a Project
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/60 mb-4">
                    Have a project key? Enter it below to request access and join the team.
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter project key (e.g., COV-ABC12)"
                        value={projectKey}
                        onChange={(e) => setProjectKey(e.target.value)}
                      />
                    </div>
                    {joinError && (
                      <div className="text-sm text-red-500">{joinError}</div>
                    )}
                    <Button 
                      className="w-full gradient-button" 
                      onClick={handleJoinProject}
                      disabled={isJoining || !projectKey.trim()}
                    >
                      {isJoining ? 'Requesting Access...' : 'Request to Join'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <DisabledCard 
                userRole={user.role}
                title="Join as Team Member"
                icon={<Users className="w-5 h-5 text-purple-400" />}
              >
                <p className="text-sm text-white/60 mb-4">
                  Work with talented professionals on exciting projects and grow your career.
                </p>
              </DisabledCard>

              <DisabledCard 
                userRole={user.role}
                title="Join an Organization"
                icon={<Building2 className="w-5 h-5 text-green-400" />}
              >
                <p className="text-sm text-white/60 mb-4">
                  Connect with established organizations and collaborate on projects.
                </p>
              </DisabledCard>

              <DisabledCard 
                userRole={user.role}
                title="Partnership"
                icon={<Handshake className="w-5 h-5 text-yellow-400" />}
              >
                <p className="text-sm text-white/60 mb-4">
                  Form strategic partnerships to grow your business and expand your network.
                </p>
              </DisabledCard>

              <DisabledCard 
                userRole={user.role}
                title="Create Organization"
                icon={<PlusCircle className="w-5 h-5 text-red-400" />}
              >
                <p className="text-sm text-white/60 mb-4">
                  Launch your own organization and manage projects under your brand.
                </p>
              </DisabledCard>

              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Project Actions
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Create, manage, or view projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user && user.role !== 'investor' && user.role !== 'viewer' && (
                    <Link href="/projects/new" className="block">
                      <Button className="w-full gradient-button">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        New Project
                      </Button>
                    </Link>
                  )}
                  <Link href="/projects" className="block">
                     <Button variant="outline" className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400">
                      <FolderKanban className="w-4 h-4 mr-2" />
                      View All Projects
                    </Button>
                  </Link>

                  {/* Join a Project Button & Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join a Project
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Join a Project</DialogTitle>
                        <DialogDescription>
                          Enter the project key to request access.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Project Key</Label>
                          <Input
                            placeholder="Enter project key (e.g., COV-ABC12)"
                            value={projectKey}
                            onChange={(e) => setProjectKey(e.target.value)}
                          />
                        </div>
                        {joinError && (
                          <div className="text-sm text-red-500">{joinError}</div>
                        )}
                        <Button 
                          className="w-full gradient-button" 
                          onClick={handleJoinProject}
                          disabled={isJoining || !projectKey.trim()}
                        >
                          {isJoining ? 'Requesting Access...' : 'Request to Join'}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Manage Team Button */}
                  {user && user.role !== 'investor' && user.role !== 'viewer' && (
                    <Button className="w-full gradient-button" onClick={() => router.push("/team")}>
                      <Users className="w-5 h-5 mr-2" />
                      Manage Team
                    </Button>
                  )}
                  {/* Add other relevant actions here if needed */}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Deal Actions Section */}
          {user?.role === 'admin' && (
            <div className="col-span-full">
              <DisabledCard 
                userRole={user.role}
                title="Deal Actions"
                icon={<Handshake className="w-5 h-5 mr-2" />}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/makedeal')}
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    Make Deal
                  </Button>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push('/deals')}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    View All Deals
                  </Button>
                  <DisabledButton userRole={user.role} icon={<DollarSign className="w-5 h-5 mr-2" />}>
                    Financial Dashboard
                  </DisabledButton>
                </div>
              </DisabledCard>
            </div>
          )}

          {/* Recent Deals Section */}
          {user?.role === 'admin' && (
            <div className="col-span-full">
              <DisabledCard 
                userRole={user.role}
                title="Recent Deals"
                icon={<Handshake className="w-5 h-5 mr-2" />}
              >
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400">Loading deals...</p>
                    </div>
                  ) : deals.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400">No deals found</p>
                      <Button 
                        variant="outline" 
                        className="mt-2 border-gray-700"
                        onClick={() => router.push('/makedeal')}
                      >
                        <Handshake className="w-4 h-4 mr-2" />
                        Create Your First Deal
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deals.slice(0, 5).map((deal) => (
                        <div 
                          key={deal.id}
                          className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/deals/${deal.id}`)}
                        >
                          <div className="flex items-center gap-3">
                            {deal.confidentiality_level === 'public' ? (
                              <Globe className="w-4 h-4 text-blue-500" />
                            ) : deal.confidentiality_level === 'private' ? (
                              <Lock className="w-4 h-4 text-gray-500" />
                            ) : (
                              <Shield className="w-4 h-4 text-purple-500" />
                            )}
                            <div>
                              <p className="font-medium">{deal.title}</p>
                              <p className="text-sm text-gray-400">
                                {deal.participants.length} participants
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {deal.status === 'pending' ? (
                              <Clock className="w-4 h-4 text-yellow-500" />
                            ) : deal.status === 'accepted' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                            <Badge variant="outline" className="capitalize">
                              {deal.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DisabledCard>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
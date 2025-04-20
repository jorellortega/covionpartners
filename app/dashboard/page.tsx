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
  Shield,
  Megaphone,
  MessageSquare,
  Wrench,
  Workflow
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
  DialogFooter
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { useUpdates, Update } from "@/hooks/useUpdates"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

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
  const { updates, loading: updatesLoading, createUpdate } = useUpdates()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [availableProjects, setAvailableProjects] = useState<{ id: string; name: string }[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    description: '',
    status: 'new',
    date: new Date().toISOString().split('T')[0],
    category: '',
    full_content: '',
    project_id: '',
    project_name: ''
  })

  // Mock data for demonstration
  const [totalRevenue] = useState(0)
  const [teamMembers] = useState([])
  const [growthRate] = useState(0)
  const [documents] = useState([])
  const [availableBalance] = useState(0)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")

  const [unreadMessages, setUnreadMessages] = useState(0)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)

  const [editingMember, setEditingMember] = useState<ProjectWithRole | null>(null)
  const [selectedRole, setSelectedRole] = useState('member')

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

  // Add function to fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return
      
      try {
        // First get projects where user is the owner
        const { data: ownedProjects, error: ownedError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('owner_id', user.id)
          .order('name')
        
        if (ownedError) throw ownedError

        // Then get projects where user is a team member
        const { data: teamMemberships, error: teamError } = await supabase
          .from('team_members')
          .select('project_id')
          .eq('user_id', user.id)
        
        if (teamError) throw teamError
        
        const teamProjectIds = teamMemberships?.map(p => p.project_id) || []
        
        if (teamProjectIds.length > 0) {
          const { data: teamProjects, error: teamProjectsError } = await supabase
            .from('projects')
            .select('id, name')
            .in('id', teamProjectIds)
            .order('name')
          
          if (teamProjectsError) throw teamProjectsError
          
          // Combine and deduplicate projects
          const allProjects = [...(ownedProjects || []), ...(teamProjects || [])]
          const uniqueProjects = allProjects.filter((project, index, self) =>
            index === self.findIndex(p => p.id === project.id)
          )
          
          setAvailableProjects(uniqueProjects)
        } else {
          setAvailableProjects(ownedProjects || [])
        }
      } catch (err) {
        console.error('Error fetching projects:', err)
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive"
        })
      } finally {
        setLoadingProjects(false)
      }
    }
    
    fetchProjects()
  }, [user, toast])

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true)
      // Step 1: Fetch messages without joins
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })
        .limit(5)

      if (messagesError) throw messagesError

      // Count unread messages where user is the receiver
      const unread = messagesData?.filter(msg => !msg.read && msg.receiver_id === user?.id).length || 0
      setUnreadMessages(unread)

      // Collect unique user IDs
      const userIds = new Set<string>()
      messagesData?.forEach(message => {
        userIds.add(message.sender_id)
        userIds.add(message.receiver_id)
      })

      // Step 2: Fetch user details
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', Array.from(userIds))

      if (usersError) throw usersError

      // Create a map of user details
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || [])

      // Combine messages with user details
      const messagesWithUsers = messagesData?.map(message => ({
        ...message,
        sender: usersMap.get(message.sender_id) || null,
        receiver: usersMap.get(message.receiver_id) || null
      })) || []

      setRecentMessages(messagesWithUsers)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleCreateUpdate = async () => {
    if (newUpdate.category === 'project' && !newUpdate.project_id) {
      toast({
        title: "Error",
        description: "Please select a project for the project update",
        variant: "destructive"
      })
      return
    }

    const { data, error } = await createUpdate({
      title: newUpdate.title,
      description: newUpdate.description,
      status: newUpdate.status,
      date: newUpdate.date,
      category: newUpdate.category,
      full_content: newUpdate.full_content,
      created_by: user?.id,
      project_id: newUpdate.category === 'project' ? newUpdate.project_id : null
    })
    
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Success",
        description: "Update created successfully"
      })
      setShowCreateDialog(false)
      setNewUpdate({
        title: '',
        description: '',
        status: 'new',
        date: new Date().toISOString().split('T')[0],
        category: '',
        full_content: '',
        project_id: '',
        project_name: ''
      })
    }
  }

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

  const handleUpdateRole = async () => {
    if (!editingMember) return;

    try {
      const { data, error } = await supabase
        .from('team_members')
        .update({ role: selectedRole })
        .eq('id', editingMember.id)

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member role updated successfully"
      })

      setEditingMember(null)
    } catch (error) {
      console.error('Error updating team member role:', error)
      toast({
        title: "Error",
        description: "Failed to update team member role",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <span className="bg-gradient-to-r from-purple-500 to-purple-900 rounded-full p-1.5 mr-3">
                <Handshake className="w-6 h-6 text-white" />
              </span>
              Dashboard
            </h1>
            <Badge className="ml-3 bg-gray-800/30 text-gray-300 border-gray-700 flex items-center justify-center h-7 px-3">
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Welcome, {user?.name || user?.email}!</h2>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-yellow-400 hover:bg-transparent relative"
                onClick={() => router.push('/updates')}
              >
                <Bell className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {unreadMessages}
                  </span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-purple-400 hover:bg-transparent relative"
                onClick={() => router.push('/messages')}
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {unreadMessages}
                  </span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-yellow-400 hover:bg-transparent"
                onClick={() => router.push('/projects')}
              >
                <Briefcase className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-green-400 hover:bg-transparent"
                onClick={() => router.push('/payments')}
              >
                <DollarSign className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-blue-400 hover:bg-transparent"
                onClick={() => router.push('/workflow')}
              >
                <Workflow className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines Section */}
        <Card className="leonardo-card border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                Upcoming Deadlines
              </div>
              <Button
                variant="ghost"
                className="text-blue-400 hover:text-blue-300"
                onClick={() => router.push('/deadlines')}
              >
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loadingMyProjects ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <>
                  {/* Project Deadlines */}
                  {myProjects
                    .filter(project => project.deadline)
                    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                    .slice(0, 3)
                    .map(project => (
                      <div 
                        key={project.id}
                        className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{project.name}</p>
                              <p className="text-xs text-gray-400">Project Deadline</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">
                              {new Date(project.deadline!).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {Math.ceil((new Date(project.deadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  }

                  {/* Recent Updates */}
                  {updates
                    .filter(update => update.date)
                    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
                    .slice(0, 3)
                    .map(update => (
                      <div 
                        key={update.id}
                        className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => router.push(`/updates/${update.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <Bell className="w-4 h-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{update.title}</p>
                              <p className="text-xs text-gray-400">Update Due</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">
                              {new Date(update.date!).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {Math.ceil((new Date(update.date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  }

                  {/* Messages with Due Dates */}
                  {recentMessages
                    .filter(message => message.due_date)
                    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                    .slice(0, 3)
                    .map(message => (
                      <div 
                        key={message.id}
                        className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => router.push(`/messages/${message.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{message.subject}</p>
                              <p className="text-xs text-gray-400">Message Response Due</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">
                              {new Date(message.due_date!).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {Math.ceil((new Date(message.due_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  }

                  {(myProjects.filter(p => p.deadline).length === 0 && 
                    updates.filter(u => u.date).length === 0 && 
                    recentMessages.filter(m => m.due_date).length === 0) && (
                    <div className="text-center py-4 text-gray-400">
                      No upcoming deadlines
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Updates Section */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-yellow-400" />
                  Updates
                </div>
                <Link href="/updates">
                  <Button variant="ghost" className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updatesLoading ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : updates.length > 0 ? (
                  updates.slice(0, 3).map((update: Update) => (
                    <div 
                      key={update.id} 
                      className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => router.push(`/updates/${update.id}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {update.created_by === user?.id ? 
                              (user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U') : 
                              (update.user_name?.split(' ').map((n: string) => n[0]).join('') || 'U')}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium">
                              {update.created_by === user?.id ? user?.name || 'You' : update.user_name || 'Unknown User'}
                            </p>
                            <span className="text-xs text-gray-400">
                              {new Date(update.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-1">{update.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    No updates yet
                  </div>
                )}
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full gradient-button">
                      <Plus className="w-4 h-4 mr-2" />
                      New Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Update</DialogTitle>
                      <DialogDescription>
                        Create a new update to share with your team.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">Title</label>
                        <Input
                          value={newUpdate.title}
                          onChange={(e) => setNewUpdate(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Enter a descriptive title for your update"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Category</label>
                        <select
                          value={newUpdate.category}
                          onChange={(e) => setNewUpdate(prev => ({ ...prev, category: e.target.value }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select a category</option>
                          <option value="project">Project Update</option>
                          <option value="general">General Update</option>
                          <option value="announcement">Announcement</option>
                        </select>
                      </div>
                      {newUpdate.category === 'project' && (
                        <div>
                          <label className="text-sm font-medium">Select Project</label>
                          <select
                            value={newUpdate.project_id}
                            onChange={(e) => {
                              const project = availableProjects.find(p => p.id === e.target.value)
                              setNewUpdate(prev => ({
                                ...prev,
                                project_id: e.target.value,
                                project_name: project ? project.name : ''
                              }))
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <option value="">Select a project</option>
                            {availableProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium">Brief Description</label>
                        <Input
                          value={newUpdate.description}
                          onChange={(e) => setNewUpdate(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter a short summary of the update"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Full Content</label>
                        <textarea
                          value={newUpdate.full_content}
                          onChange={(e) => setNewUpdate(prev => ({ ...prev, full_content: e.target.value }))}
                          placeholder="Enter the complete details of your update"
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateUpdate}>
                        Create Update
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Messages Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Messages</h2>
              <Button
                onClick={() => router.push('/messages')}
                variant="ghost"
                className="text-purple-400 hover:text-purple-300"
              >
                View All
              </Button>
            </div>

            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-purple-400" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                  ) : recentMessages.length > 0 ? (
                    <>
                      <div className="grid gap-4">
                        {recentMessages.map((message) => (
                          <Card 
                            key={message.id} 
                            className="bg-gray-900/50 border-gray-800 cursor-pointer hover:bg-gray-900"
                            onClick={() => router.push(`/messages/${message.id}`)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-medium text-white truncate">
                                      {message.subject}
                                    </h3>
                                    {!message.read && message.receiver_id === user?.id && (
                                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                                        New
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-gray-400 text-xs line-clamp-1">
                                    {message.content}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                    <span>From: {message.sender_id === user?.id ? 'You' : message.sender?.name || 'Unknown'}</span>
                                    <span>•</span>
                                    <span>{new Date(message.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <div className="flex justify-center pt-2">
                        <Button
                          onClick={() => router.push('/messages/new')}
                          className="w-full gradient-button"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          New Message
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No messages yet</h3>
                      <p className="text-gray-500 mb-4">Start a conversation with your team</p>
                      <Button
                        onClick={() => router.push('/messages/new')}
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Message
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* My Projects */}
          {user?.role !== 'viewer' && (
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FolderKanban className="w-5 h-5 mr-2" />
                    My Projects
                  </div>
                  <Button
                    variant="ghost"
                    className="text-blue-400 hover:text-blue-300"
                    onClick={() => router.push('/projects')}
                  >
                    View All
                  </Button>
                </CardTitle>
                <CardDescription>Projects you own or are a member of</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Projects list */}
                <div className="space-y-4">
                  {myProjects.slice(0, 5).map((project) => (
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
                  {myProjects.length > 5 && (
                    <div className="flex justify-center pt-4">
                      <Button
                        variant="outline"
                        className="border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                        onClick={() => router.push('/projects')}
                      >
                        View All Projects
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                  {myProjects.length === 0 && (
                    <div className="text-center py-6">
                      <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-300 mb-2">No projects yet</h3>
                      <p className="text-gray-500 mb-4">Create or join a project to get started</p>
                      <Button
                        variant="outline"
                        className="border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                        onClick={() => router.push('/projects/new')}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Project
                      </Button>
                    </div>
                  )}
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
            <Button 
              className="w-full gradient-button"
              onClick={() => router.push('/makedeal')}
            >
              <Handshake className="w-4 h-4 mr-2" />
              Make a Deal
            </Button>
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
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Quick access to common actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/projects" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <FolderKanban className="w-4 h-4 mr-2" />
                    View All Projects
                  </Button>
                </Link>
                <Link href="/create-project" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                </Link>
                <Link href="/deals" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    Deals
                  </Button>
                </Link>
                <Link href="/publicprojects" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Public Projects
                  </Button>
                </Link>
                <Link href="/managepayments" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Manage Payments
                  </Button>
                </Link>
                <Link href="/updates" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Updates
                  </Button>
                </Link>
                <Link href="/payments" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </Link>
                <Link href="/schedule" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule & Tasks
                  </Button>
                </Link>
                <Link href="/makedeal" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    Make Deal
                  </Button>
                </Link>
                <Link href="/marketing" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Megaphone className="w-4 h-4 mr-2" />
                    Marketing
                  </Button>
                </Link>
                <Link href="/settings" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </Link>
                <Link href="/funding-settings" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Funding Settings
                  </Button>
                </Link>
                <Link href="/team" className="block">
                  <Button 
                    variant="outline" 
                    className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Manage Team
                  </Button>
                </Link>
                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hover:bg-rose-900/20 hover:text-rose-400"
                      onClick={() => router.push('/admin/marketing')}
                    >
                      <Megaphone className="mr-2 h-4 w-4" />
                      <span>Marketing</span>
                    </Button>
                  </div>
                )}
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

          {/* Deals Section */}
          {user?.role && ['admin', 'partner'].includes(user.role) && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Deals</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" className="text-purple-400 hover:text-purple-300 cursor-not-allowed opacity-50">
                        View All
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Coming Soon</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Handshake className="w-5 h-5 mr-2 text-purple-400" />
                    Deals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Wrench className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-300 mb-2">Under Development</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      The deals feature is currently being developed. Check back soon for updates!
                    </p>
                  </div>
                </CardContent>
              </Card>
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
        </div>
      </main>
    </div>
  )
}
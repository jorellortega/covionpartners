"use client"

import { useState, useEffect, useRef } from "react"
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
  Workflow,
  User,
  Cog,
  Code,
  RefreshCw,
  Store,
  PenSquare,
  LineChart,
  CheckSquare,
  ExternalLink as LinkIcon,
  Heart,
  ArrowDownToLine,
  History,
  StickyNote,
  UploadCloud,

  List,
  Layout,
  Bot,
  Send,
  X,
  Key
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
import { toast } from "sonner"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
      return "Business Account"
    case "partner":
      return "Manager Account"
    case "investor":
      return "Partner Account"
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
  const [showLabels, setShowLabels] = useState(false)
  const labelTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [dashboardView, setDashboardView] = useState<'default' | 'compact' | 'grid' | 'ai'>('default')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const autoCycleIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('')
  const [dashboardSearchResults, setDashboardSearchResults] = useState<any[]>([])
  const [isDashboardSearching, setIsDashboardSearching] = useState(false)

  // Show labels for 10 seconds on page load
  useEffect(() => {
    // Show labels immediately when component mounts
    setShowLabels(true)
    
    // Hide labels after 10 seconds
    const timeout = setTimeout(() => {
      setShowLabels(false)
    }, 10000)
    
    labelTimeoutRef.current = timeout
    
    // Cleanup timeout on unmount
    return () => {
      if (labelTimeoutRef.current) {
        clearTimeout(labelTimeoutRef.current)
      }
    }
  }, [])

  // Handle auto-hide labels after 10 seconds when hovered
  useEffect(() => {
    if (showLabels && labelTimeoutRef.current) {
      // Clear any existing timeout
      clearTimeout(labelTimeoutRef.current)
      
      // Set new timeout to hide labels after 10 seconds
      const timeout = setTimeout(() => {
        setShowLabels(false)
      }, 10000)
      
      labelTimeoutRef.current = timeout
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (labelTimeoutRef.current) {
        clearTimeout(labelTimeoutRef.current)
      }
    }
  }, [showLabels])

  // Auto-cycle through categories in compact mode every 10 seconds
  useEffect(() => {
    if (dashboardView === 'compact') {
      const categories = ['projects', 'deals', 'finance', 'communication', 'organization', 'workflow', 'join-project', 'business-client', 'job-board']
      let currentIndex = 0
      let inactivityTimeout: NodeJS.Timeout | null = null
      
      // Start immediately with first category
      setSelectedCategory(categories[currentIndex])
      currentIndex = 1
      
      const startAutoCycle = () => {
        autoCycleIntervalRef.current = setInterval(() => {
          setSelectedCategory(categories[currentIndex])
          currentIndex = (currentIndex + 1) % categories.length
        }, 10000)
      }
      
      const pauseAutoCycle = () => {
        if (autoCycleIntervalRef.current) {
          clearInterval(autoCycleIntervalRef.current)
          autoCycleIntervalRef.current = null
        }
      }
      
      const resumeAfterInactivity = () => {
        if (inactivityTimeout) {
          clearTimeout(inactivityTimeout)
        }
        inactivityTimeout = setTimeout(() => {
          startAutoCycle()
        }, 60000) // Resume after 1 minute of inactivity
      }
      
      // Start auto-cycle
      startAutoCycle()
      
      // Set up activity detection
      const handleActivity = () => {
        pauseAutoCycle()
        resumeAfterInactivity()
      }
      
      // Add event listeners for user activity
      const contentArea = document.querySelector('main')
      if (contentArea) {
        contentArea.addEventListener('scroll', handleActivity)
        contentArea.addEventListener('mousemove', handleActivity)
        contentArea.addEventListener('click', handleActivity)
      }
      
      return () => {
        if (autoCycleIntervalRef.current) clearInterval(autoCycleIntervalRef.current)
        if (inactivityTimeout) clearTimeout(inactivityTimeout)
        if (contentArea) {
          contentArea.removeEventListener('scroll', handleActivity)
          contentArea.removeEventListener('mousemove', handleActivity)
          contentArea.removeEventListener('click', handleActivity)
        }
      }
    }
  }, [dashboardView])

  // Handle manual category selection (turns off auto-cycle)
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    
    // Turn off auto-cycle when user manually selects
    if (autoCycleIntervalRef.current) {
      clearInterval(autoCycleIntervalRef.current)
      autoCycleIntervalRef.current = null
    }
  }

  // Dashboard search functionality
  const handleDashboardSearch = async (query: string) => {
    if (!query.trim()) {
      setDashboardSearchResults([])
      return
    }

    setIsDashboardSearching(true)
    try {
      // Search through projects, deals, updates, etc.
      const results = []
      
      // Search projects
      if (myProjects && myProjects.length > 0) {
        const projectResults = myProjects.filter(project => 
          project.name.toLowerCase().includes(query.toLowerCase()) ||
          project.description?.toLowerCase().includes(query.toLowerCase())
        ).map(project => ({ ...project, type: 'project' }))
        results.push(...projectResults)
      }
      
      // Search deals
      if (deals && deals.length > 0) {
        const dealResults = deals.filter(deal => 
          deal.title.toLowerCase().includes(query.toLowerCase()) ||
          deal.description?.toLowerCase().includes(query.toLowerCase())
        ).map(deal => ({ ...deal, type: 'deal' }))
        results.push(...dealResults)
      }
      
      // Search updates
      if (updates && updates.length > 0) {
        const updateResults = updates.filter(update => 
          update.title.toLowerCase().includes(query.toLowerCase()) ||
          update.description.toLowerCase().includes(query.toLowerCase())
        ).map(update => ({ ...update, type: 'update' }))
        results.push(...updateResults)
      }
      
      setDashboardSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      toast({
        title: 'Search Error',
        description: 'Failed to perform search',
        variant: 'destructive'
      })
    } finally {
      setIsDashboardSearching(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (dashboardSearchQuery) {
        handleDashboardSearch(dashboardSearchQuery)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [dashboardSearchQuery])

  // Mock data for demonstration
  const [totalRevenue] = useState(0)
  const [teamMembers] = useState([])
  const [growthRate] = useState(0)
  const [documents] = useState([])
  const [availableBalance] = useState(0)
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")

  const [unreadMessages, setUnreadMessages] = useState(0)
  const [approvedPositionsCount, setApprovedPositionsCount] = useState(0)
  const [recentMessages, setRecentMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)

  const [editingMember, setEditingMember] = useState<ProjectWithRole | null>(null)
  const [selectedRole, setSelectedRole] = useState('member')

  const [balance, setBalance] = useState<number | null>(null)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isAiLoading, setIsAiLoading] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
         console.log('Dashboard: Auth check complete, no user found. Redirecting to login.')
        // Force a hard redirect to ensure session is cleared
        window.location.href = '/login'
        return
      } else {
        console.log('Dashboard: Auth check complete, user found:', user.email)
        // Check for approved positions when user is loaded
        checkApprovedPositions()
      }
    } else {
      console.log('Dashboard: Auth check in progress...')
    }
  }, [user, authLoading])

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
          throw new Error(error.message || 'Failed to fetch deals')
        }
        
        console.log('Fetched deals:', data)
        setDeals(data || [])
      } catch (error: any) {
        console.error('Error fetching deals:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to fetch deals. Please try again later.",
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

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('cvnpartners_user_balances')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        setBalance(0);
      } else {
        setBalance(data?.balance ?? 0);
      }
    };
    if (user) fetchBalance();
  }, [user, supabase]);

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

  const checkApprovedPositions = async () => {
    if (!user) return;
    
    try {
      // Count approved job applications
      let jobCount = 0;
      try {
        const { count, error: jobError } = await supabase
          .from("job_applications")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", user.id)
          .eq("status", "accepted");

        if (!jobError) {
          jobCount = count || 0;
        }
      } catch (error) {
        // Continue with jobCount = 0
      }

      // Count approved project role applications  
      const { count: roleCount, error: roleError } = await supabase
        .from("project_role_applications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("status", "approved");

      // Count work assignments that need attention (new system)
      let workAssignmentCount = 0;
      try {
        const { count: workCount, error: workError } = await supabase
          .from("project_role_work_assignments")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", user.id)
          .in("status", ["assigned", "active"]);

        if (!workError) {
          workAssignmentCount = workCount || 0;
        }
      } catch (error) {
        // Continue with workAssignmentCount = 0
      }

      if (!roleError) {
        const totalApproved = (jobCount || 0) + (roleCount || 0) + (workAssignmentCount || 0);
        setApprovedPositionsCount(totalApproved);
      }
    } catch (error) {
      console.error("Error checking approved positions:", error);
    }
  };

  const handleAI = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsAiLoading(true);
    setAiResponse("");
    
    try {
      // Simulate AI response - replace with actual AI API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Development message with user's name
      const developmentResponse = `Hello ${user?.name || user?.email || 'there'}! I'm under development. Come back soon!`;
      
      setAiResponse(developmentResponse);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAiResponse("Sorry, I encountered an error while processing your request. Please try again.");
    } finally {
      setIsAiLoading(false);
      setAiPrompt('');
    }
  };

  // Dashboard View Components
  const renderCompactView = () => (
    <div className="space-y-4">
      {/* Expandable Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {/* Project Hub */}
        <Card 
          className={`leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 transition-all duration-300 hover:scale-105 cursor-pointer ${
            selectedCategory === 'projects' ? 'ring-2 ring-blue-500/50' : ''
          }`}
          onClick={() => handleCategorySelect('projects')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Projects</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

                {/* Deal Hub */}
        <Card 
          className={`leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 transition-all duration-300 hover:scale-105 cursor-pointer ${
            selectedCategory === 'deals' ? 'ring-2 ring-green-500/50' : ''
          }`}
          onClick={() => handleCategorySelect('deals')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                  <Handshake className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Deals</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

                {/* Financial Hub */}
        <Card 
          className={`leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 transition-all duration-300 hover:scale-105 cursor-pointer ${
            selectedCategory === 'finance' ? 'ring-2 ring-yellow-500/50' : ''
          }`}
          onClick={() => handleCategorySelect('finance')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                </div>
                <h3 className="font-semibold text-white">Finance</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

                {/* Communication Hub */}
        <Card 
          className={`leonardo-card border-gray-800 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 transition-all duration-300 hover:scale-105 cursor-pointer ${
            selectedCategory === 'communication' ? 'ring-2 ring-cyan-500/50' : ''
          }`}
          onClick={() => handleCategorySelect('communication')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mr-3">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white">Messages</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Organization Hub */}
        <Card 
          className={`leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 transition-all duration-300 hover:scale-105 cursor-pointer ${
            selectedCategory === 'organization' ? 'ring-2 ring-indigo-500/50' : ''
          }`}
          onClick={() => handleCategorySelect('organization')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="font-semibold text-white">Organization</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Workflow Hub */}
        <Card 
          className={`leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10 transition-all duration-300 hover:scale-105 cursor-pointer ${
            selectedCategory === 'workflow' ? 'ring-2 ring-purple-500/50' : ''
          }`}
          onClick={() => handleCategorySelect('workflow')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                  <Workflow className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Workflow</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Join Project Hub */}
        <Card 
          className={`leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10 transition-all duration-300 hover:scale-105 cursor-pointer ${
            selectedCategory === 'join-project' ? 'ring-2 ring-purple-500/50' : ''
          }`}
          onClick={() => handleCategorySelect('join-project')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Join Project</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Business & Client Pages Hub */}
        <Card 
          className={`leonardo-card border-gray-800 bg-gradient-to-br from-pink-500/10 to-purple-500/10 transition-all duration-300 hover:scale-105 cursor-pointer ${
            selectedCategory === 'business-client' ? 'ring-2 ring-pink-500/50' : ''
          }`}
          onClick={() => handleCategorySelect('business-client')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center mr-3">
                  <Briefcase className="w-4 h-4 text-pink-400" />
                </div>
                <h3 className="font-semibold text-white">Business & Client</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Job Board Hub */}
        <Card 
          className={`leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 transition-all duration-300 hover:scale-105 cursor-pointer ${
            selectedCategory === 'job-board' ? 'ring-2 ring-blue-500/50' : ''
          }`}
          onClick={() => handleCategorySelect('job-board')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Job Board</h3>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Content Section */}
      {selectedCategory && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              {selectedCategory === 'projects' && 'Project Management'}
              {selectedCategory === 'deals' && 'Deal Management'}
              {selectedCategory === 'finance' && 'Financial Management'}
              {selectedCategory === 'communication' && 'Communication Tools'}
              {selectedCategory === 'organization' && 'Organization Management'}
              {selectedCategory === 'workflow' && 'Workflow & Tasks'}
              {selectedCategory === 'join-project' && 'Join a Project'}
              {selectedCategory === 'business-client' && 'Business & Client Management'}
              {selectedCategory === 'job-board' && 'Job Board Management'}
            </h2>
            <Button 
              variant="outline" 
              className="border-gray-700 hover:bg-gray-800"
              onClick={() => setSelectedCategory(null)}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>

          {/* Projects Content */}
          {selectedCategory === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.role === 'viewer' ? (
                <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                  <CardContent className="p-6 text-center">
                    <Briefcase className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
                    <p className="text-gray-400 mb-4">Upgrade your account to access project management features</p>
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                      onClick={() => router.push('/account-types')}
                    >
                      Upgrade Account
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/projects/new')}>
                      <Plus className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">New Project</h3>
                      <p className="text-gray-400">Create a new project</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/projects')}>
                      <FolderKanban className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">View Projects</h3>
                      <p className="text-gray-400">Manage your projects</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/projectfiles')}>
                      <FileText className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Project Files</h3>
                      <p className="text-gray-400">Access project documents</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/team')}>
                      <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Team Management</h3>
                      <p className="text-gray-400">Manage project team</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/publicprojects')}>
                      <Globe className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Public Projects</h3>
                      <p className="text-gray-400">Browse public projects</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/workmode')}>
                      <Workflow className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Workspace</h3>
                      <p className="text-gray-400">Access your workspace</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Deals Content */}
          {selectedCategory === 'deals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.role === 'viewer' ? (
                <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                  <CardContent className="p-6 text-center">
                    <Handshake className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
                    <p className="text-gray-400 mb-4">Upgrade your account to access deal features</p>
                    <Button 
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                      onClick={() => router.push('/account-types')}
                    >
                      Upgrade Account
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/makedeal')}>
                      <Handshake className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Make Deal</h3>
                      <p className="text-gray-400">Create a new deal</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/deals')}>
                      <Globe className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">View Deals</h3>
                      <p className="text-gray-400">Browse all deals</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/dealsrequest')}>
                      <Handshake className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Deal Requests</h3>
                      <p className="text-gray-400">Manage deal requests</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/negotiate')}>
                      <MessageSquare className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Negotiate</h3>
                      <p className="text-gray-400">Negotiate deals</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/publicprojects')}>
                      <Globe className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Public Projects</h3>
                      <p className="text-gray-400">Browse public projects</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/invest')}>
                      <DollarSign className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Invest</h3>
                      <p className="text-gray-400">Investment opportunities</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/portfolio')}>
                      <BarChart2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
                      <p className="text-gray-400">View your portfolio</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/forsale')}>
                      <Store className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">For Sale</h3>
                      <p className="text-gray-400">Items for sale</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/buy')}>
                      <Store className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Buy</h3>
                      <p className="text-gray-400">Purchase items</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Finance Content */}
          {selectedCategory === 'finance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.role === 'viewer' ? (
                <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                  <CardContent className="p-6 text-center">
                    <DollarSign className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
                    <p className="text-gray-400 mb-4">Upgrade your account to access financial features</p>
                    <Button 
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-500"
                      onClick={() => router.push('/account-types')}
                    >
                      Upgrade Account
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/managepayments')}>
                      <Calculator className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Manage Payments</h3>
                      <p className="text-gray-400">Handle payments</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/withdraw')}>
                      <DollarSign className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Withdraw</h3>
                      <p className="text-gray-400">Withdraw funds</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/pay')}>
                      <DollarSign className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Pay</h3>
                      <p className="text-gray-400">Make payments</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/project/invest')}>
                      <Settings className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Investment Settings</h3>
                      <p className="text-gray-400">Configure investment settings</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/payments')}>
                      <Wallet className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Payments</h3>
                      <p className="text-gray-400">Payment history</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/savepayments')}>
                      <CheckSquare className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Saved Payments</h3>
                      <p className="text-gray-400">Manage saved payments</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/funding-settings')}>
                      <Settings className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Funding Settings</h3>
                      <p className="text-gray-400">Configure funding settings</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/calculator')}>
                      <Calculator className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Calculator</h3>
                      <p className="text-gray-400">Investment calculator</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/portfolio')}>
                      <BarChart2 className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Portfolio</h3>
                      <p className="text-gray-400">Financial portfolio</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/invest')}>
                      <TrendingUp className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Invest</h3>
                      <p className="text-gray-400">Investment opportunities</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Join Project Content */}
          {selectedCategory === 'join-project' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <CardContent className="p-6">
                  <UserPlus className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-4 text-center">Join a Project</h3>
                  <p className="text-gray-400 mb-4 text-center">
                    Have a project key? Enter it below to request access and join the team.
                  </p>
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter project key (e.g., COV-ABC12)"
                      value={projectKey}
                      onChange={(e) => setProjectKey(e.target.value)}
                      className="bg-gray-800/30 border-gray-700"
                    />
                    {joinError && (
                      <div className="text-sm text-red-500">{joinError}</div>
                    )}
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      onClick={handleJoinProject}
                      disabled={isJoining || !projectKey.trim()}
                    >
                      {isJoining ? 'Requesting Access...' : 'Request to Join'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Job Board Content */}
          {selectedCategory === 'job-board' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/jobs')}>
                  <Briefcase className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">View Job Board</h3>
                  <p className="text-gray-400">Browse all job postings</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/jobs/post')}>
                  <Plus className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Post a Job</h3>
                  <p className="text-gray-400">Create a new job posting</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/buildbusiness')}>
                  <Briefcase className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Create Organization</h3>
                  <p className="text-gray-400">Set up a new organization</p>
                </CardContent>
              </Card>
                                <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <CardContent className="p-6 text-center">
                      <Users className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">My Organizations</h3>
                      <p className="text-gray-400 mb-4">Manage your organizations</p>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-gray-700/50"
                          onClick={() => router.push('/myorganizations')}
                        >
                          View Organizations
                        </Button>
                        <Button
                          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                          onClick={() => router.push('/guest-management')}
                        >
                          <Key className="w-4 h-4 mr-2" />
                          Guest Management
                        </Button>
                        <Link href="/contract-library">
                          <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                            <FileText className="w-4 h-4 mr-2" /> Contract Library
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                    <CardContent className="p-6 text-center">
                      <FileText className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Contract Library</h3>
                      <p className="text-gray-400 mb-4">Manage contracts and templates</p>
                      <div className="flex flex-col gap-2">
                        <Button
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                          onClick={() => router.push('/contract-library')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Contract Library
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/approved-positions')}>
                  <CheckCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Approved Positions</h3>
                  <p className="text-gray-400">View approved work positions</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/work-dashboard')}>
                  <FolderKanban className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Work Dashboard</h3>
                  <p className="text-gray-400">Access work management</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/jobportal')}>
                  <Briefcase className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Job Portal Dashboard</h3>
                  <p className="text-gray-400">Job portal management</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Business & Client Content */}
          {selectedCategory === 'business-client' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {user?.role === 'viewer' ? (
                <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-pink-500/10 to-purple-500/10">
                  <CardContent className="p-6 text-center">
                    <Briefcase className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upgrade Required</h3>
                    <p className="text-gray-400 mb-4">Upgrade your account to access business features</p>
                    <Button 
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
                      onClick={() => router.push('/account-types')}
                    >
                      Upgrade Account
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-pink-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/businessprofile')}>
                      <Briefcase className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Create/Edit Business Profile</h3>
                      <p className="text-gray-400">Manage your business profile</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-pink-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/business/123')}>
                      <Briefcase className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">View Business Profile</h3>
                      <p className="text-gray-400">View your business profile</p>
                    </CardContent>
                  </Card>
                  <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-pink-500/10 to-purple-500/10 cursor-pointer hover:scale-105 transition-transform">
                    <CardContent className="p-6 text-center" onClick={() => router.push('/client/123')}>
                      <Users className="w-12 h-12 text-pink-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Client Booking Page</h3>
                      <p className="text-gray-400">Manage client bookings</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* Communication Content */}
          {selectedCategory === 'communication' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/messages')}>
                  <MessageSquare className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Messages</h3>
                  <p className="text-gray-400">View your messages</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/updates')}>
                  <Bell className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Updates Center</h3>
                  <p className="text-gray-400">Check for updates</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/groupchat')}>
                  <Users className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Group Chat</h3>
                  <p className="text-gray-400">Join group conversations</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/feed')}>
                  <Users className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Activity Feed</h3>
                  <p className="text-gray-400">View activity feed</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/notes')}>
                  <StickyNote className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-gray-400">Manage your notes</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/profiles')}>
                  <User className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Profiles</h3>
                  <p className="text-gray-400">View user profiles</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/contacts')}>
                  <Users className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Contacts</h3>
                  <p className="text-gray-400">Manage contacts</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Organization Content */}
          {selectedCategory === 'organization' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/myorganizations')}>
                  <Users className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">My Organizations</h3>
                  <p className="text-gray-400">View your organizations</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/createorganization')}>
                  <Building2 className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Create Organization</h3>
                  <p className="text-gray-400">Create a new organization</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/business-expense')}>
                  <Briefcase className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Business Expenses</h3>
                  <p className="text-gray-400">Manage business expenses</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/work-dashboard')}>
                  <FolderKanban className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Work Dashboard</h3>
                  <p className="text-gray-400">Access work management</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/approved-positions')}>
                  <CheckCircle className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Approved Positions</h3>
                  <p className="text-gray-400">View approved positions</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/work-submission')}>
                  <PenSquare className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Work for Hire Submission</h3>
                  <p className="text-gray-400">Submit work for hire</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/admin/work-submissions')}>
                  <Shield className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Work Submissions</h3>
                  <p className="text-gray-400">Manage work submissions</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/open-roles')}>
                  <Briefcase className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Open Roles</h3>
                  <p className="text-gray-400">View open roles</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/organization-staff')}>
                  <Users className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Organization Staff</h3>
                  <p className="text-gray-400">Manage organization staff</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/company/my/documents')}>
                  <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Organization Documents</h3>
                  <p className="text-gray-400">Manage documents</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/workmode')}>
                  <Workflow className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Workspace</h3>
                  <p className="text-gray-400">Access workspace</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Workflow Content */}
          {selectedCategory === 'workflow' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/workflow')}>
                  <Workflow className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tasks</h3>
                  <p className="text-gray-400">Manage your tasks</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/workmode')}>
                  <FolderKanban className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Workspace</h3>
                  <p className="text-gray-400">Access your workspace</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/approved-positions')}>
                  <CheckCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Approved Positions</h3>
                  <p className="text-gray-400">View approved positions</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10 cursor-pointer hover:scale-105 transition-transform">
                <CardContent className="p-6 text-center" onClick={() => router.push('/work-submission')}>
                  <PenSquare className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Work Submission</h3>
                  <p className="text-gray-400">Submit work</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Add more category content sections as needed */}
        </div>
      )}

    </div>
  )



  const renderAIView = () => (
    <div className="max-w-2xl mx-auto pt-8">
      {/* Simple Header */}
      <div className="text-center mb-8">
        {/* Coming Soon Badge */}
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-4">
          <span className="text-xs font-medium text-purple-300">Coming Soon</span>
        </div>
        
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4 group cursor-pointer">
          <Bot className="w-8 h-8 text-white group-hover:hidden" />
          <span className="text-white font-bold text-lg hidden group-hover:block">JOR</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">AI Assistant</h1>
        <p className="text-gray-400">Ask me anything about your projects or business</p>
      </div>

      {/* Prompt Input */}
      <div className="space-y-4">
                <div className="flex-1">
          <div className="leonardo-card border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-4 relative">
            {/* Binary Code Border */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Binary text along borders */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] text-purple-400 font-mono select-none opacity-60">01001010 01001111 01010010</div>
              <div className="absolute bottom-1 right-1 text-xs text-purple-400 font-mono select-none opacity-60">JOR</div>
            </div>
            <textarea
              placeholder="Ask me anything..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAI()}
              className="flex min-h-[120px] w-full rounded-lg border border-gray-700 bg-gray-900/50 px-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all duration-200 relative z-10"
              disabled={isAiLoading}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleAI}
            disabled={isAiLoading || !aiPrompt.trim()}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-6 h-12"
          >
            {isAiLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Response */}
      {aiResponse && (
        <div className="mt-6 leonardo-card border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-semibold text-white">AI Response</h3>
                <span className="text-sm text-purple-400 font-medium">by JOR</span>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
            <header className={`leonardo-header transition-all duration-500 ${dashboardView === 'ai' ? 'opacity-100' : 'opacity-100'}`}>
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {dashboardView === 'ai' ? (
            <>
              {/* AI view: Logo, title, and controls */}
              <div className="flex items-center">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
                  <span 
                    className="bg-gradient-to-r from-purple-500 to-purple-900 rounded-full p-1.5 mr-3 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => router.push('/')}
                  >
                    <Handshake className="w-6 h-6 text-white" />
                  </span>
                  <span className="hidden sm:inline">Dashboard</span>
                </h1>
                <Badge className="ml-3 bg-gray-800/30 text-gray-300 border-gray-700 flex items-center justify-center h-7 px-3">
                  {getTierName(user?.role || '')}
                </Badge>
              </div>
              
              {/* User profile for AI view */}
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push(`/profile/${user?.id}`)}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center transition-transform group-hover:scale-105">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </>
          ) : dashboardView !== 'compact' ? (
            <>
              <div className="flex items-center">
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
                  <span 
                    className="bg-gradient-to-r from-purple-500 to-purple-900 rounded-full p-1.5 mr-3 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => router.push('/')}
                  >
                    <Handshake className="w-6 h-6 text-white" />
                  </span>
                  <span className="hidden sm:inline">Dashboard</span>
                </h1>
                <Badge className="ml-3 bg-gray-800/30 text-gray-300 border-gray-700 flex items-center justify-center h-7 px-3">
                  {getTierName(user?.role || '')}
                </Badge>
              </div>
              
              {/* Welcome Banner moved to header */}
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push(`/profile/${user?.id}`)}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center transition-transform group-hover:scale-105">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold group-hover:text-purple-400 transition-colors">Welcome, {user?.name || user?.email}!</h2>
                  <p className="text-sm text-gray-400">Here's what's happening in your workspace</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Compact view: Just logo and account icon */}
              <div className="flex items-center">
                <span 
                  className="bg-gradient-to-r from-purple-500 to-purple-900 rounded-full p-1.5 mr-3 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => router.push('/')}
                >
                  <Handshake className="w-6 h-6 text-white" />
                </span>
              </div>
              
              {/* Account icon for compact view */}
              <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => router.push(`/profile/${user?.id}`)}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center transition-transform group-hover:scale-105">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
            </>
          )}
          
          <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Dashboard View Selector */}
            <div className="flex items-center gap-2 bg-gray-800/30 rounded-lg p-1 border border-gray-700">
              <Button
                variant={dashboardView === 'default' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 ${dashboardView === 'default' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-gray-700/50'}`}
                onClick={() => setDashboardView('default')}
              >
                <Layout className="w-4 h-4 mr-1" />
                Default
              </Button>
              <Button
                variant={dashboardView === 'compact' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 ${dashboardView === 'compact' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-gray-700/50'}`}
                onClick={() => setDashboardView('compact')}
              >
                <List className="w-4 h-4 mr-1" />
                Compact
              </Button>
              
              <Button
                variant={dashboardView === 'ai' ? 'default' : 'ghost'}
                size="sm"
                className={`h-8 px-3 ${dashboardView === 'ai' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-gray-700/50'}`}
                onClick={() => setDashboardView('ai')}
              >
                <Bot className="w-4 h-4 mr-1" />
                AI
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-red-900/20 hover:text-red-400 w-full sm:w-auto"
              onClick={async () => {
                try {
                  // Clear all local storage and session storage
                  if (typeof window !== 'undefined') {
                    window.localStorage.clear()
                    window.sessionStorage.clear()
                    // Clear all cookies
                    document.cookie.split(";").forEach(function(c) { 
                      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                    })
                  }
                  
                  // Sign out from Supabase
                  const { error } = await supabase.auth.signOut()
                  if (error) throw error
                  
                  // Clear any remaining auth state
                  await supabase.auth.setSession({
                    access_token: '',
                    refresh_token: ''
                  })
                  
                  // Force a hard redirect to login page with cache busting
                  window.location.href = '/login?' + new Date().getTime()
                } catch (error) {
                  console.error('Error signing out:', error)
                  toast({
                    title: 'Error',
                    description: 'Failed to sign out',
                    variant: 'destructive'
                  })
                }
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Search Bar - Hidden in AI view */}
      {dashboardView !== 'ai' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="leonardo-card p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search projects, deals, updates..."
                value={dashboardSearchQuery}
                onChange={(e) => setDashboardSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/30 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>
            {isDashboardSearching && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
            )}
            {dashboardSearchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDashboardSearchQuery('')
                  setDashboardSearchResults([])
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}

          </div>
          
          {/* Search Results */}
          {dashboardSearchResults.length > 0 && (
            <div className="mt-4 p-3 bg-gray-800/30 border border-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2">
                Found {dashboardSearchResults.length} result{dashboardSearchResults.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {dashboardSearchResults.map((result, index) => (
                  <div
                    key={`${result.type}-${result.id || index}`}
                    className="flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded cursor-pointer transition-colors"
                    onClick={() => {
                      if (result.type === 'project') {
                        router.push(`/projects/${result.id}`)
                      } else if (result.type === 'deal') {
                        router.push(`/deals/${result.id}`)
                      } else if (result.type === 'update') {
                        router.push(`/updates/${result.id}`)
                      }
                    }}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      result.type === 'project' ? 'bg-blue-400' :
                      result.type === 'deal' ? 'bg-green-400' :
                      'bg-purple-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {result.name || result.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {result.type.charAt(0).toUpperCase() + result.type.slice(1)} • {result.description?.substring(0, 60)}...
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {/* Approved Positions Alert */}
        {approvedPositionsCount > 0 && (
          <div className="leonardo-card p-4 sm:p-6 mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-200">
                    {approvedPositionsCount} Work Assignment{approvedPositionsCount > 1 ? 's' : ''} Ready
                  </h2>
                  <p className="text-sm text-yellow-300/80">You have approved positions and work assignments to review</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/work-dashboard')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                View Work
              </Button>
            </div>
          </div>
        )}

        {/* Render different dashboard views */}
        {dashboardView === 'compact' && renderCompactView()}
        {dashboardView === 'ai' && renderAIView()}
        {dashboardView === 'default' && (
          <>
            {/* Quick Access Icons */}
        <div 
          className="leonardo-card p-4 sm:p-6 mb-6 bg-gradient-to-r from-gray-800/50 to-gray-900/50"
          onMouseEnter={() => {
            setShowLabels(true)
            // Reset the 10-second timer when hovering
            if (labelTimeoutRef.current) {
              clearTimeout(labelTimeoutRef.current)
            }
            const timeout = setTimeout(() => {
              setShowLabels(false)
            }, 10000)
            labelTimeoutRef.current = timeout
          }}
          onMouseLeave={() => {
            // Don't hide labels immediately on mouse leave, let the timer handle it
          }}
        >
          <div className="flex justify-center items-center">
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 sm:gap-6 lg:gap-8 w-full max-w-4xl">
              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-yellow-500/20 hover:bg-yellow-500/30 hover:text-yellow-400 p-2 sm:p-3 lg:p-4 rounded-lg border border-yellow-500/30 transition-transform duration-200 hover:-translate-y-1"
                  onClick={() => router.push('/updates')}
                >
                  <Bell className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </Button>
                <span className={`text-xs text-gray-400 font-bold uppercase tracking-wide transition-all duration-200 transform ${showLabels ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} sm:block`}>Updates</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-purple-500/20 hover:bg-purple-500/30 hover:text-purple-400 p-2 sm:p-3 lg:p-4 rounded-lg border border-purple-500/30 transition-transform duration-200 hover:-translate-y-1"
                  onClick={() => router.push('/messages')}
                >
                  <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </Button>
                <span className={`text-xs text-gray-400 font-bold uppercase tracking-wide transition-all duration-200 transform ${showLabels ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} sm:block`}>Messages</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-blue-500/20 hover:bg-blue-500/30 hover:text-blue-400 p-2 sm:p-3 lg:p-4 rounded-lg border border-blue-500/30 transition-transform duration-200 hover:-translate-y-1"
                  onClick={() => router.push('/projects')}
                >
                  <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                </Button>
                <span className={`text-xs text-gray-400 font-bold uppercase tracking-wide transition-all duration-200 transform ${showLabels ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} sm:block`}>Projects</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-green-500/20 hover:bg-green-500/30 hover:text-green-400 p-2 sm:p-3 lg:p-4 rounded-lg border border-green-500/30 transition-transform duration-200 hover:-translate-y-1"
                  onClick={() => router.push('/withdraw')}
                >
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                </Button>
                <span className={`text-xs text-gray-400 font-bold uppercase tracking-wide transition-all duration-200 transform ${showLabels ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} sm:block`}>Withdraw</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-purple-500/20 hover:bg-purple-500/30 hover:text-purple-400 p-2 sm:p-3 lg:p-4 rounded-lg border border-purple-500/30 transition-transform duration-200 hover:-translate-y-1"
                  onClick={() => router.push('/workflow')}
                >
                  <Workflow className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                </Button>
                <span className={`text-xs text-gray-400 font-bold uppercase tracking-wide transition-all duration-200 transform ${showLabels ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} sm:block`}>Tasks</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-orange-500/20 hover:bg-orange-500/30 hover:text-orange-400 p-2 sm:p-3 lg:p-4 rounded-lg border border-orange-500/30 transition-transform duration-200 hover:-translate-y-1"
                  onClick={() => router.push('/feed')}
                >
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                </Button>
                <span className={`text-xs text-gray-400 font-bold uppercase tracking-wide transition-all duration-200 transform ${showLabels ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} sm:block`}>Activity Feed</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-indigo-500/20 hover:bg-indigo-500/30 hover:text-indigo-400 p-2 sm:p-3 lg:p-4 rounded-lg border border-indigo-500/30 transition-transform duration-200 hover:-translate-y-1"
                  onClick={() => router.push('/workmode')}
                >
                  <FolderKanban className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                </Button>
                <span className={`text-xs text-gray-400 font-bold uppercase tracking-wide transition-all duration-200 transform ${showLabels ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} sm:block`}>Workspace</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
          <Card 
            className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10 cursor-pointer hover:border-blue-500/50 transition-colors"
            onClick={() => router.push('/projects')}
          >
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Active Projects</p>
                  <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{myProjects.length}</h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10 cursor-pointer hover:border-green-500/50 transition-colors group"
            onClick={() => router.push('/managepayments')}
          >
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Balance</p>
                  <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 group-hover:hidden text-gray-400">
                    Balance
                  </h3>
                  <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1 hidden group-hover:block">
                    {balance === null ? '—' : `$${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Link href="/messages">
            <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10 cursor-pointer hover:border-purple-500/50 transition-colors">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Unread Messages</p>
                  <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{unreadMessages}</h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>

          <Link href="/updates">
            <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 cursor-pointer hover:border-yellow-500/50 transition-colors">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Updates</p>
                  <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{updates.length}</h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Action Hubs - Left Column */}
          <div className="col-span-12 lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Hub */}
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                    Project Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {user?.role === 'viewer' ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                          <Plus className="w-4 h-4 mr-2" />
                          New Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Upgrade Required</DialogTitle>
                          <DialogDescription>
                            You must upgrade your account to create and manage projects.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3">
                          <DialogTrigger asChild>
                            <Button variant="outline">Close</Button>
                          </DialogTrigger>
                          <Button 
                            className="bg-[#7C3AED] hover:bg-[#6D28D9]"
                            onClick={() => router.push('/account-types')}
                          >
                            Upgrade Account
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                  <Link href="/projects/new">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      <Plus className="w-4 h-4 mr-2" />
                      New Project
                    </Button>
                  </Link>
                  )}
                  <Link href="/projects">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-blue-900/20 hover:text-blue-400">
                      <FolderKanban className="w-4 h-4 mr-2" />
                      View Projects
                    </Button>
                  </Link>
                  <Link href="/projectfiles">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-blue-900/20 hover:text-blue-400">
                      <FolderKanban className="w-4 h-4 mr-2" /> Project Files
                    </Button>
                  </Link>
                  <Link href="/team">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-blue-900/20 hover:text-blue-400">
                      <Users className="w-4 h-4 mr-2" />
                      Team Management
                    </Button>
                  </Link>
                  <Link href="http://localhost:3000/userprojects/e0704fc5-b3f5-4f80-82e2-7d3ec76f3b2e" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-blue-900/20 hover:text-blue-400">
                      <Globe className="w-4 h-4 mr-2" />
                      Public Projects
                    </Button>
                  </Link>
                  <Link href="/workmode">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-blue-900/20 hover:text-blue-400">
                      <Workflow className="w-4 h-4 mr-2" /> Workspace
                    </Button>
                  </Link>
                  <Link href="/open-roles">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-blue-900/20 hover:text-blue-400">
                      <Briefcase className="w-4 h-4 mr-2" /> View All Open Roles
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Join a Project Card */}
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-purple-500/5 to-pink-500/5 hover:from-purple-500/10 hover:to-pink-500/10 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                      <UserPlus className="w-5 h-5 text-purple-400" />
                    </div>
                    Join a Project
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 mb-4">
                    Have a project key? Enter it below to request access and join the team.
                  </p>
                  <div className="space-y-3">
                    <Input
                      placeholder="Enter project key (e.g., COV-ABC12)"
                      value={projectKey}
                      onChange={(e) => setProjectKey(e.target.value)}
                    />
                    {joinError && (
                      <div className="text-sm text-red-500">{joinError}</div>
                    )}
                    <Button 
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" 
                      onClick={handleJoinProject}
                      disabled={isJoining || !projectKey.trim()}
                    >
                      {isJoining ? 'Requesting Access...' : 'Request to Join'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* My Organization Card */}
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 hover:from-indigo-500/10 hover:to-blue-500/10 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    My Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/myorganizations">
                    <Button className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 mb-2">
                      <Users className="w-4 h-4 mr-2" /> View My Organizations
                    </Button>
                  </Link>
                  <Link href="/createorganization">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <Building2 className="w-4 h-4 mr-2" /> Create Organization
                    </Button>
                  </Link>
                  <Link href="/business-expense">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <Briefcase className="w-4 h-4 mr-2" /> Business Expenses
                    </Button>
                  </Link>
                  <Link href="/work-dashboard">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <FolderKanban className="w-4 h-4 mr-2" /> Work Dashboard
                    </Button>
                  </Link>
                  <Link href="/approved-positions">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <CheckCircle className="w-4 h-4 mr-2" /> Approved Positions
                    </Button>
                  </Link>
                  <Link href="/work-submission">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <PenSquare className="w-4 h-4 mr-2" /> Work for Hire Submission
                    </Button>
                  </Link>
                  <Link href="/admin/work-submissions">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <Shield className="w-4 h-4 mr-2" /> Work Submissions
                    </Button>
                  </Link>
                  <Link href="/open-roles">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <Briefcase className="w-4 h-4 mr-2" /> Open Roles
                    </Button>
                  </Link>
                  {/* Add Organization Staff Management */}
                  <Link href="/organization-staff">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <Users className="w-4 h-4 mr-2" /> Organization Staff
                    </Button>
                  </Link>
                  <Link href="/guest-management">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <Key className="w-4 h-4 mr-2" /> Guest Management
                    </Button>
                  </Link>
                  <Link href="/contract-library">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <FileText className="w-4 h-4 mr-2" /> Contract Library
                    </Button>
                  </Link>
                  {/* TODO: Replace 'my' with the actual organization slug dynamically */}
                  <Link href="/company/my/documents">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <UploadCloud className="w-4 h-4 mr-2" /> Organization Documents
                    </Button>
                  </Link>
                  <Link href="/workmode">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-indigo-900/20 hover:text-indigo-400">
                      <Workflow className="w-4 h-4 mr-2" /> Workspace
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Deal Hub */}
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:from-green-500/10 hover:to-emerald-500/10 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                      <Handshake className="w-5 h-5 text-green-400" />
                    </div>
                    Deal Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {user?.role === 'viewer' ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400 mb-4">Upgrade your account to access deal features</p>
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/account-types')}
                      >
                        Upgrade Account
                      </Button>
                    </div>
                  ) : (
                    <>
                  <Link href="/makedeal">
                    <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                      <Handshake className="w-4 h-4 mr-2" />
                      Make Deal
                    </Button>
                  </Link>
                  <Link href="/deals">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <Globe className="w-4 h-4 mr-2" />
                      Deals
                    </Button>
                  </Link>
                  <Link href="/dealsrequest">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <Handshake className="w-4 h-4 mr-2" />
                      Deal Requests
                    </Button>
                  </Link>
                  <Link href="/negotiate">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Negotiate
                    </Button>
                  </Link>
                  <Link href="/publicprojects">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <Globe className="w-4 h-4 mr-2" />
                      Public Projects
                    </Button>
                  </Link>
                  <Link href="/invest">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Invest
                    </Button>
                  </Link>
                  <Link href="/forsale">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <Store className="w-4 h-4 mr-2" />
                      For Sale
                    </Button>
                  </Link>
                  <Link href="/buy">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <Store className="w-4 h-4 mr-2" />
                      Buy
                    </Button>
                  </Link>
                  <Link href="/portfolio">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <BarChart2 className="w-4 h-4 mr-2" />
                      Portfolio
                    </Button>
                  </Link>
                  <Link href="/opendeals">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400">
                      <Globe className="w-4 h-4 mr-2" />
                      Open Deals
                    </Button>
                  </Link>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Financial Hub */}
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 hover:from-yellow-500/10 hover:to-orange-500/10 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-3">
                      <DollarSign className="w-5 h-5 text-yellow-400" />
                    </div>
                    Financial Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {user?.role === 'viewer' ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400 mb-4">Upgrade your account to access financial features</p>
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/account-types')}
                      >
                        Upgrade Account
                      </Button>
                    </div>
                  ) : (
                    <>
                  <Link href="/managepayments">
                    <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                      <Calculator className="w-4 h-4 mr-2" />
                      Manage Payments
                    </Button>
                  </Link>
                  <Link href="/withdraw">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-yellow-900/20 hover:text-yellow-400">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Withdraw
                    </Button>
                  </Link>
                  <Link href="/pay">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-yellow-900/20 hover:text-yellow-400">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Pay
                    </Button>
                  </Link>
                  <Link href="/project/invest">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-yellow-900/20 hover:text-yellow-400">
                      <Settings className="w-4 h-4 mr-2" />
                      Investment Settings
                    </Button>
                  </Link>
                  <Link href="/payments">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-yellow-900/20 hover:text-yellow-400">
                      <Wallet className="w-4 h-4 mr-2" /> Payments
                    </Button>
                  </Link>
                  <Link href="/savepayments">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-yellow-900/20 hover:text-yellow-400">
                      <CheckSquare className="w-4 h-4 mr-2" /> Saved Payments
                    </Button>
                  </Link>
                  <Link href="/funding-settings">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-yellow-900/20 hover:text-yellow-400">
                      <Settings className="w-4 h-4 mr-2" /> Funding Settings
                    </Button>
                  </Link>
                  <Link href="/calculator">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-yellow-900/20 hover:text-yellow-400">
                      <Calculator className="w-4 h-4 mr-2" /> Investment Calculator
                    </Button>
                  </Link>
                  <Link href="/portfolio">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-yellow-900/20 hover:text-yellow-400">
                      <BarChart2 className="w-4 h-4 mr-2" /> Portfolio
                    </Button>
                  </Link>
                  <Link href="/invest">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-yellow-900/20 hover:text-yellow-400">
                      <TrendingUp className="w-4 h-4 mr-2" /> Invest
                    </Button>
                  </Link>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Communication Hub */}
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 hover:from-cyan-500/10 hover:to-teal-500/10 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center mr-3">
                      <MessageSquare className="w-5 h-5 text-cyan-400" />
                    </div>
                    Communication Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/messages">
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600">
                      <MessageSquare className="w-4 h-4 mr-2" /> Messages
                    </Button>
                  </Link>
                  <Link href="/updates">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-cyan-900/20 hover:text-cyan-400">
                      <Bell className="w-4 h-4 mr-2" /> Updates Center
                    </Button>
                  </Link>
                  <Link href="/groupchat">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-cyan-900/20 hover:text-cyan-400">
                      <Users className="w-4 h-4 mr-2" /> Group Chat
                    </Button>
                  </Link>
                  <Link href="/feed">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-cyan-900/20 hover:text-cyan-400">
                      <Users className="w-4 h-4 mr-2" /> Activity Feed
                    </Button>
                  </Link>
                  <Link href="/notes">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-cyan-900/20 hover:text-cyan-400">
                      <StickyNote className="w-4 h-4 mr-2" /> Notes
                    </Button>
                  </Link>
                  <Link href="/profiles">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-cyan-900/20 hover:text-cyan-400">
                      <User className="w-4 h-4 mr-2" /> Profiles
                    </Button>
                  </Link>
                  <Link href="/contacts">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-cyan-900/20 hover:text-cyan-400">
                      <Users className="w-4 h-4 mr-2" /> Contacts
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Business & Client Pages Card */}
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-pink-500/5 to-purple-500/5 hover:from-pink-500/10 hover:to-purple-500/10 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center mr-3">
                      <Briefcase className="w-5 h-5 text-pink-400" />
                    </div>
                    Business & Client Pages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {user?.role === 'viewer' ? (
                    <div className="text-center py-4">
                      <p className="text-gray-400 mb-4">Upgrade your account to access business and client page features</p>
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => router.push('/account-types')}
                      >
                        Upgrade Account
                      </Button>
                    </div>
                  ) : (
                    <>
                  <Link href="/businessprofile">
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                      <Briefcase className="w-4 h-4 mr-2" /> Create/Edit Business Profile
                    </Button>
                  </Link>
                  <Link href="/business/123">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-pink-900/20 hover:text-pink-400">
                      <Briefcase className="w-4 h-4 mr-2" /> View Business Profile
                    </Button>
                  </Link>
                  <Link href="/client/123">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-pink-900/20 hover:text-pink-400">
                      <Users className="w-4 h-4 mr-2" /> Client Booking Page
                    </Button>
                  </Link>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Job Board Card */}
              <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                      <Briefcase className="w-5 h-5 text-blue-400" />
                    </div>
                    Job Board
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-gray-400 mb-2">Manage your job postings and applications.</p>
                  <Link href="/jobs">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 mb-2">
                      <Briefcase className="w-4 h-4 mr-2" /> View Job Board
                    </Button>
                  </Link>
                  <Link href="/jobs/post">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-blue-900/20 hover:text-blue-400 mb-2">
                      <Plus className="w-4 h-4 mr-2" /> Post a Job
                    </Button>
                  </Link>
                  <Link href="/buildbusiness">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-blue-900/20 hover:text-blue-400 mb-2">
                      <Briefcase className="w-4 h-4 mr-2" /> Create Organization
                    </Button>
                  </Link>
                  <Link href="/myorganizations">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-blue-900/20 hover:text-blue-400 mb-2">
                      <Users className="w-4 h-4 mr-2" /> My Organizations
                    </Button>
                  </Link>
                  <Link href="/approved-positions">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-green-900/20 hover:text-green-400 mb-2">
                      <CheckCircle className="w-4 h-4 mr-2" /> Approved Positions
                    </Button>
                  </Link>
                  <Link href="/work-dashboard">
                    <Button variant="outline" className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400 mb-2">
                      <FolderKanban className="w-4 h-4 mr-2" /> Work Dashboard
                    </Button>
                  </Link>
                  <Link href="/jobportal">
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 mb-2">
                      <Briefcase className="w-4 h-4 mr-2" /> Job Portal Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Quick Actions */}
            <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                  onClick={() => router.push('/updates')}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Updates Center
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                  onClick={() => router.push('/contact')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            {/* Tokens & Support */}
            <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <Star className="w-5 h-5 mr-2 text-purple-400" />
                  Tokens & Support
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your tokens, certificates, and support features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                  onClick={() => router.push('/createtoken')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Token/Certificate
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                  onClick={() => router.push('/mytokens')}
                >
                  <Star className="w-4 h-4 mr-2" />
                  My Tokens/Certificates
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                  onClick={() => router.push('/checktoken')}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Check Token Authenticity
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                  onClick={() => router.push('/purchase2support')}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Support Projects
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-700 hover:bg-purple-900/20 hover:text-purple-400"
                  onClick={() => router.push('/publicprojects')}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Browse Public Projects
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-gray-800/50 to-gray-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-xl">
                  <div className="w-8 h-8 rounded-full bg-gray-500/20 flex items-center justify-center mr-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                  </div>
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentMessages.slice(0, 3).map((message, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/messages/${message.id}`)}
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{message.subject}</p>
                        <p className="text-xs text-gray-400">{new Date(message.created_at).toLocaleDateString()}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
          </>
        )}
      </main>
    </div>
  )
}
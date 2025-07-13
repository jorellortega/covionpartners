"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Users, Settings, BarChart2, Shield, AlertCircle, MoreHorizontal, DollarSign, Building2, FileText, MessageSquare, Activity } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import Image from "next/image"

export default function CEOPortalPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    pendingApprovals: 0,
    systemHealth: "Good",
    recentActivity: [] as { id: number, type: string, timestamp: string, details: string }[],
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(true)
  const [paymentsError, setPaymentsError] = useState<string | null>(null)
  const [contactMessages, setContactMessages] = useState<any[]>([])
  const [contactLoading, setContactLoading] = useState(true)
  const [contactError, setContactError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<any>(null)
  const [replyContent, setReplyContent] = useState("")
  const [replyLoading, setReplyLoading] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [checkedMessages, setCheckedMessages] = useState<string[]>([])
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [liveMessages, setLiveMessages] = useState<any[]>([])
  const liveFeedRef = useRef<HTMLDivElement>(null)
  const [devActivity, setDevActivity] = useState<any[]>([])
  const [devActivityLoading, setDevActivityLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [brandingLogo, setBrandingLogo] = useState("https://uytqyfpjdevrqmwqfthk.supabase.co/storage/v1/object/public/partnerfiles/branding/handshake.png")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleting, setDeleting] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [organizationsLoading, setOrganizationsLoading] = useState(true)
  const [nextExpense, setNextExpense] = useState<any>(null)
  const [nextExpenseLoading, setNextExpenseLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (!userData) {
          toast.error('User not found')
          router.push('/dashboard')
          return
        }

        setUser(userData)
      } catch (error) {
        console.error('Error checking access:', error)
        toast.error('Error checking access')
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [router, supabase])

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true)
      try {
        // Fetch total users
        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        // Fetch active users (example: users with last_login in last 30 days)
        const since = new Date()
        since.setDate(since.getDate() - 30)
        const { count: activeUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('last_login', since.toISOString())

        // Fetch total revenue (example: sum of all completed payments)
        const { data: revenueRows } = await supabase
          .from('payments')
          .select('amount')
          .eq('status', 'completed')
        const totalRevenue = revenueRows ? revenueRows.reduce((sum, row) => sum + (row.amount || 0), 0) : 0

        // Fetch pending approvals (example: users with status 'pending')
        const { count: pendingApprovals } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        // Fetch recent activity (example: last 5 user signups)
        const { data: recentUsers } = await supabase
          .from('users')
          .select('id, created_at, email')
          .order('created_at', { ascending: false })
          .limit(5)
        const recentActivity = (recentUsers || []).map((u: any, i: number) => ({
          id: u.id,
          type: 'user_signup',
          timestamp: u.created_at,
          details: `New user: ${u.email}`
        }))

        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalRevenue,
          pendingApprovals: pendingApprovals || 0,
          systemHealth: "Good",
          recentActivity,
        })
      } catch (err) {
        toast.error('Failed to fetch portal stats')
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [supabase])

  useEffect(() => {
    const fetchUsers = async () => {
      setUsersLoading(true)
      setUsersError(null)
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, role, phone_number, subscription_status, subscription_tier, created_at, updated_at, avatar_url')
          .order('created_at', { ascending: false })
        if (error) throw error
        setUsers(data || [])
      } catch (err: any) {
        setUsersError('Failed to fetch users')
      } finally {
        setUsersLoading(false)
      }
    }
    fetchUsers()
  }, [supabase])

  useEffect(() => {
    const fetchPayments = async () => {
      setPaymentsLoading(true)
      setPaymentsError(null)
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('id, amount, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(10)
        if (error) throw error
        setPayments(data || [])
      } catch (err: any) {
        setPaymentsError('Failed to fetch payments')
      } finally {
        setPaymentsLoading(false)
      }
    }
    fetchPayments()
  }, [supabase])

  useEffect(() => {
    const fetchContactMessages = async () => {
      setContactLoading(true)
      setContactError(null)
      try {
        const { data, error } = await supabase
          .from('contact_messages')
          .select('id, name, email, user_id, subject, message, status, created_at, checked')
          .order('created_at', { ascending: false })
        if (error) throw error
        setContactMessages(data || [])
      } catch (err: any) {
        setContactError('Failed to fetch contact messages')
      } finally {
        setContactLoading(false)
      }
    }
    fetchContactMessages()
  }, [supabase])

  useEffect(() => {
    // Subscribe to new contact_messages
    const channel = supabase
      .channel('contact_messages_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, (payload) => {
        setLiveMessages(prev => [payload.new, ...prev].slice(0, 10)) // Keep only the 10 most recent
        setTimeout(() => {
          if (liveFeedRef.current) {
            liveFeedRef.current.scrollTop = 0
          }
        }, 0)
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  useEffect(() => {
    const fetchDevActivity = async () => {
      setDevActivityLoading(true)
      try {
        // Fetch latest users
        const { data: usersData } = await supabase
          .from('users')
          .select('id, email, name, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
        // Fetch latest contact messages
        const { data: contactData } = await supabase
          .from('contact_messages')
          .select('id, email, name, subject, message, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
        // Fetch latest payments
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('id, user_id, amount, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5)
        // Merge and sort
        const events = [
          ...(usersData || []).map(u => ({
            type: 'signup',
            id: u.id,
            created_at: u.created_at,
            description: `New user: ${u.email || u.name || u.id}`
          })),
          ...(contactData || []).map(m => ({
            type: 'contact',
            id: m.id,
            created_at: m.created_at,
            description: `Contact: ${m.subject || ''} - ${m.email || m.name || m.id}`
          })),
          ...(paymentsData || []).map(p => ({
            type: 'payment',
            id: p.id,
            created_at: p.created_at,
            description: `Payment: $${p.amount?.toLocaleString()} (${p.status})` + (p.user_id ? ` by ${p.user_id}` : '')
          })),
        ]
        events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setDevActivity(events.slice(0, 10))
      } catch (err) {
        setDevActivity([])
      } finally {
        setDevActivityLoading(false)
      }
    }
    fetchDevActivity()
  }, [supabase])

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true)
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            id,
            name,
            description,
            status,
            type,
            deadline,
            owner_id,
            invested,
            roi,
            progress,
            budget,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setProjects(data || [])
      } catch (err) {
        console.error('Error fetching projects:', err)
        toast.error('Failed to fetch projects')
      } finally {
        setProjectsLoading(false)
      }
    }
    fetchProjects()
  }, [supabase])

  useEffect(() => {
    const fetchOrganizations = async () => {
      setOrganizationsLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setOrganizations([])
          setOrganizationsLoading(false)
          return
        }
        const userId = session.user.id
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, description, website, logo')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
        if (error) throw error
        setOrganizations(data || [])
      } catch (err) {
        console.error('Error fetching organizations:', err)
        toast.error('Failed to fetch organizations')
      } finally {
        setOrganizationsLoading(false)
      }
    }
    fetchOrganizations()
  }, [supabase])

  useEffect(() => {
    const fetchNextExpense = async () => {
      setNextExpenseLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .in('status', ['Unpaid', 'Overdue'])
          .gt('amount', 0)
          .gte('next_payment', today)
          .order('next_payment', { ascending: true })
          .limit(1);
        if (error) throw error;
        setNextExpense(data && data.length > 0 ? data[0] : null);
      } catch (err) {
        setNextExpense(null);
      } finally {
        setNextExpenseLoading(false);
      }
    };
    fetchNextExpense();
  }, [supabase]);

  const handleSendReply = async () => {
    if (!replyContent.trim() || !replyingTo) return

    setReplyLoading(true)
    try {
      // Here you would typically send the reply via email or update the message status
      toast.success('Reply sent successfully')
      setReplyingTo(null)
      setReplyContent("")
    } catch (err) {
      toast.error('Failed to send reply')
    } finally {
      setReplyLoading(false)
    }
  }

  const handleCheckMessage = async (id: string, checked: boolean) => {
    try {
      await supabase
        .from('contact_messages')
        .update({ checked })
        .eq('id', id)
      setContactMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, checked } : msg
      ))
    } catch (err) {
      toast.error('Failed to update message status')
    }
  }

  const handleCheckAll = async (checked: boolean) => {
    try {
      if (checked) {
        const ids = contactMessages.filter(msg => !msg.checked).map(msg => msg.id)
        if (ids.length > 0) {
          await supabase
            .from('contact_messages')
            .update({ checked: true })
            .in('id', ids)
        }
        setContactMessages(prev => prev.map(msg => ({ ...msg, checked: true })))
      } else {
        const ids = contactMessages.filter(msg => msg.checked).map(msg => msg.id)
        if (ids.length > 0) {
          await supabase
            .from('contact_messages')
            .update({ checked: false })
            .in('id', ids)
        }
        setContactMessages(prev => prev.map(msg => ({ ...msg, checked: false })))
      }
    } catch (err) {
      toast.error('Failed to update checked state')
    }
  }

  async function handleLogoUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("handshake", file);
    const res = await fetch("/api/upload-handshake", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (data.url) {
      setBrandingLogo(data.url + "?t=" + Date.now()); // bust cache
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleLogoDelete(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    setDeleting(true);
    await fetch("/api/delete-handshake", { method: "POST" });
    setBrandingLogo("/handshake-placeholder.png");
    setDeleting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1.5 mr-3">
                <Shield className="w-6 h-6 text-white" />
              </span>
              CEO Portal
            </h1>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-sm text-gray-400">
                  Welcome, <span className="text-purple-400 font-medium">{user.name || user.email}</span>
                  {user.role && (
                    <Badge className="ml-2 bg-purple-500/20 text-purple-400 border-purple-500/50">
                      {user.role}
                    </Badge>
                  )}
                </div>
              )}
              <Button 
                variant="outline" 
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                onClick={() => router.push('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Prominent Organization Card */}
      {organizations && organizations.length > 0 && (
        <div className="max-w-3xl mx-auto mt-4 mb-8">
          <Card className="leonardo-card border-gray-800">
            <CardContent className="flex items-center justify-center py-8">
              {organizations[0].logo && (
                <img src={organizations[0].logo} alt="Logo" className="w-16 h-16 rounded-full border-2 border-white shadow-md mr-6" />
              )}
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
                Organization: {organizations[0].name}
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Analytics Cards at the top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="leonardo-card border-purple-600 bg-gradient-to-br from-purple-900/20 to-purple-800/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-purple-300">
                <Users className="w-5 h-5" /> 
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-1">{statsLoading ? '—' : stats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-purple-300">Registered users</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-green-600 bg-gradient-to-br from-green-900/20 to-green-800/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-green-300">
                <BarChart2 className="w-5 h-5" /> 
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-1">{statsLoading ? '—' : stats.activeUsers.toLocaleString()}</p>
              <p className="text-sm text-green-300">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-yellow-600 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-yellow-300">
                <DollarSign className="w-5 h-5" /> 
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white mb-1">{statsLoading ? '—' : `$${stats.totalRevenue.toLocaleString()}`}</p>
              <p className="text-sm text-yellow-300">Platform earnings</p>
            </CardContent>
          </Card>

          <Card className="leonardo-card border-red-600 bg-gradient-to-br from-red-900/20 to-red-800/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-red-300">
                <DollarSign className="w-5 h-5" />
                Next Expense Due
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextExpenseLoading ? (
                <div className="text-gray-400">Loading...</div>
              ) : !nextExpense ? (
                <div className="text-gray-400">No upcoming expenses.</div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-white mb-1">${nextExpense.amount?.toLocaleString()}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-red-300">
                      Due in {Math.ceil((new Date(nextExpense.next_payment).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                    <p className="text-xs text-red-400">{new Date(nextExpense.next_payment).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Projects Status Card */}
        <Card className="leonardo-card border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Projects Overview
            </CardTitle>
            <CardDescription>View projects by their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="bg-gray-900 border-gray-800 mb-4">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="on-hold">On Hold</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                <div className="space-y-3">
                  {projectsLoading ? (
                    <div className="text-gray-400 text-center py-4">Loading projects...</div>
                  ) : projects.filter(p => p.status === 'active').length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No active projects found.</div>
                  ) : (
                    projects
                      .filter(p => p.status === 'active')
                      .map((project) => (
                        <div
                          key={project.id}
                          className="flex justify-between items-center p-3 bg-green-900/20 border border-green-800 rounded-lg cursor-pointer hover:bg-green-900/40 transition"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <div>
                            <h4 className="font-semibold text-white">{project.name}</h4>
                            <p className="text-sm text-green-300">
                              {project.description ? project.description.substring(0, 60) + '...' : 'No description'}
                            </p>
                            <p className="text-xs text-green-400 mt-1">
                              Owner ID: {project.owner_id}
                            </p>
                          </div>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="pending">
                <div className="space-y-3">
                  {projectsLoading ? (
                    <div className="text-gray-400 text-center py-4">Loading projects...</div>
                  ) : projects.filter(p => p.status === 'pending').length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No pending projects found.</div>
                  ) : (
                    projects
                      .filter(p => p.status === 'pending')
                      .map((project) => (
                        <div
                          key={project.id}
                          className="flex justify-between items-center p-3 bg-yellow-900/20 border border-yellow-800 rounded-lg cursor-pointer hover:bg-yellow-900/40 transition"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <div>
                            <h4 className="font-semibold text-white">{project.name}</h4>
                            <p className="text-sm text-yellow-300">
                              {project.description ? project.description.substring(0, 60) + '...' : 'No description'}
                            </p>
                            <p className="text-xs text-yellow-400 mt-1">
                              Owner ID: {project.owner_id}
                            </p>
                          </div>
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Pending</Badge>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="completed">
                <div className="space-y-3">
                  {projectsLoading ? (
                    <div className="text-gray-400 text-center py-4">Loading projects...</div>
                  ) : projects.filter(p => p.status === 'completed').length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No completed projects found.</div>
                  ) : (
                    projects
                      .filter(p => p.status === 'completed')
                      .map((project) => (
                        <div
                          key={project.id}
                          className="flex justify-between items-center p-3 bg-blue-900/20 border border-blue-800 rounded-lg cursor-pointer hover:bg-blue-900/40 transition"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <div>
                            <h4 className="font-semibold text-white">{project.name}</h4>
                            <p className="text-sm text-blue-300">
                              {project.description ? project.description.substring(0, 60) + '...' : 'No description'}
                            </p>
                            <p className="text-xs text-blue-400 mt-1">
                              Owner ID: {project.owner_id}
                            </p>
                          </div>
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">Completed</Badge>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="on-hold">
                <div className="space-y-3">
                  {projectsLoading ? (
                    <div className="text-gray-400 text-center py-4">Loading projects...</div>
                  ) : projects.filter(p => p.status === 'on hold' || p.status === 'on-hold').length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No projects on hold found.</div>
                  ) : (
                    projects
                      .filter(p => p.status === 'on hold' || p.status === 'on-hold')
                      .map((project) => (
                        <div
                          key={project.id}
                          className="flex justify-between items-center p-3 bg-red-900/20 border border-red-800 rounded-lg cursor-pointer hover:bg-red-900/40 transition"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          <div>
                            <h4 className="font-semibold text-white">{project.name}</h4>
                            <p className="text-sm text-red-300">
                              {project.description ? project.description.substring(0, 60) + '...' : 'No description'}
                            </p>
                            <p className="text-xs text-red-400 mt-1">
                              Owner ID: {project.owner_id}
                            </p>
                          </div>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/50">On Hold</Badge>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            <TabsTrigger value="contact">Contact Messages</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="mb-6">
              <Card className="leonardo-card border-purple-700 bg-gray-950/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-400">
                    <Activity className="w-5 h-5" />
                    Live Activity Feed
                  </CardTitle>
                  <CardDescription>Latest signups, contact messages, and payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {devActivityLoading ? (
                      <div className="text-gray-500 text-sm">Loading activity...</div>
                    ) : devActivity.length === 0 ? (
                      <div className="text-gray-500 text-sm">No recent activity.</div>
                    ) : (
                      devActivity.map(event => (
                        <div key={event.type + event.id} className="p-2 rounded bg-gray-900/70 border border-purple-800">
                          <span className="text-purple-400 font-semibold mr-2">[{event.type}]</span>
                          <span className="text-gray-300">{event.description}</span>
                          <span className="text-xs text-gray-500 ml-2">{event.created_at ? new Date(event.created_at).toLocaleString() : ''}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" /> Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{statsLoading ? '—' : stats.totalUsers}</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-green-400" /> Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{statsLoading ? '—' : stats.activeUsers}</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-400" /> Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{statsLoading ? '—' : `$${stats.totalRevenue.toLocaleString()}`}</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" /> Pending Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{statsLoading ? '—' : stats.pendingApprovals}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View all users and their details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex justify-end">
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full max-w-xs bg-gray-900 border-gray-700 text-white"
                  />
                </div>
                {usersLoading ? (
                  <div className="text-gray-400">Loading users...</div>
                ) : usersError ? (
                  <div className="text-red-400">{usersError}</div>
                ) : users.length === 0 ? (
                  <div className="text-gray-400">No users found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-800">
                          <th className="py-2 px-4">Email</th>
                          <th className="py-2 px-4">Name</th>
                          <th className="py-2 px-4">Role</th>
                          <th className="py-2 px-4">Phone</th>
                          <th className="py-2 px-4">Subscription</th>
                          <th className="py-2 px-4">Tier</th>
                          <th className="py-2 px-4">Created</th>
                          <th className="py-2 px-4">Updated</th>
                          <th className="py-2 px-4">Avatar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users
                          .filter(u =>
                            (u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
                             u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
                             u.role?.toLowerCase().includes(userSearch.toLowerCase()) ||
                             u.phone_number?.toLowerCase().includes(userSearch.toLowerCase()) ||
                             u.subscription_status?.toLowerCase().includes(userSearch.toLowerCase()) ||
                             u.subscription_tier?.toLowerCase().includes(userSearch.toLowerCase()))
                          )
                          .map((u) => (
                            <tr key={u.id} className="border-b border-gray-900 hover:bg-gray-800/30">
                              <td className="py-2 px-4 text-white">{u.email}</td>
                              <td className="py-2 px-4 text-white">{u.name || '-'}</td>
                              <td className="py-2 px-4">
                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 border">{u.role}</Badge>
                              </td>
                              <td className="py-2 px-4 text-white">{u.phone_number || '-'}</td>
                              <td className="py-2 px-4 text-white">{u.subscription_status || '-'}</td>
                              <td className="py-2 px-4 text-white">{u.subscription_tier || '-'}</td>
                              <td className="py-2 px-4 text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                              <td className="py-2 px-4 text-gray-400">{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '-'}</td>
                              <td className="py-2 px-4">
                                {u.avatar_url && u.avatar_url !== '/placeholder-avatar.jpg' ? (
                                  <Image
                                    src={u.avatar_url}
                                    alt="Avatar"
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-white text-xs font-bold">
                                    {u.name ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'U'}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Track revenue, subscriptions, and payouts</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="text-gray-400">Loading payments...</div>
                ) : paymentsError ? (
                  <div className="text-red-400">{paymentsError}</div>
                ) : payments.length === 0 ? (
                  <div className="text-gray-400">No payments found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-800">
                          <th className="py-2 px-4">Amount</th>
                          <th className="py-2 px-4">Status</th>
                          <th className="py-2 px-4">User ID</th>
                          <th className="py-2 px-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-gray-900 hover:bg-gray-800/30">
                            <td className="py-2 px-4 text-white">${p.amount?.toLocaleString()}</td>
                            <td className="py-2 px-4">
                              <Badge className={
                                p.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/50 border' :
                                p.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 border' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/50 border'
                              }>{p.status}</Badge>
                            </td>
                            <td className="py-2 px-4 text-gray-400">{p.user_id}</td>
                            <td className="py-2 px-4 text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Monitor uptime, performance, and security</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50 border">{statsLoading ? '—' : stats.systemHealth}</Badge>
                  <span className="text-gray-400">(System health monitoring coming soon...)</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>See the latest actions and events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsLoading ? (
                    <div className="text-gray-400">Loading...</div>
                  ) : stats.recentActivity.length === 0 ? (
                    <div className="text-gray-400">No recent activity found.</div>
                  ) : (
                    stats.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                        <div>
                          <p className="text-white">{activity.details}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
                          {activity.type}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Contact Messages</CardTitle>
                <CardDescription>View messages submitted via the contact form</CardDescription>
              </CardHeader>
              <CardContent>
                {contactLoading ? (
                  <div className="text-gray-400">Loading messages...</div>
                ) : contactError ? (
                  <div className="text-red-400">{contactError}</div>
                ) : contactMessages.length === 0 ? (
                  <div className="text-gray-400">No contact messages found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-800">
                          <th className="py-2 px-4">
                            <Checkbox
                              checked={contactMessages.length > 0 && contactMessages.every(msg => msg.checked)}
                              onCheckedChange={handleCheckAll}
                            />
                          </th>
                          <th className="py-2 px-4">Name</th>
                          <th className="py-2 px-4">Email</th>
                          <th className="py-2 px-4">User ID</th>
                          <th className="py-2 px-4">Subject</th>
                          <th className="py-2 px-4">Message</th>
                          <th className="py-2 px-4">Status</th>
                          <th className="py-2 px-4">Date</th>
                          <th className="py-2 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contactMessages.map((msg) => (
                          <tr key={msg.id} className="border-b border-gray-900 hover:bg-gray-800/30">
                            <td className="py-2 px-4">
                              <Checkbox
                                checked={msg.checked}
                                onCheckedChange={(checked) => handleCheckMessage(msg.id, checked as boolean)}
                              />
                            </td>
                            <td className="py-2 px-4 text-white">{msg.name}</td>
                            <td className="py-2 px-4 text-white">{msg.email}</td>
                            <td className="py-2 px-4 text-gray-400">{msg.user_id || '-'}</td>
                            <td className="py-2 px-4 text-white">{msg.subject}</td>
                            <td className="py-2 px-4 text-gray-400 max-w-xs truncate">{msg.message}</td>
                            <td className="py-2 px-4">
                              <Badge className={
                                msg.status === 'read' ? 'bg-green-500/20 text-green-400 border-green-500/50 border' :
                                msg.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 border' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/50 border'
                              }>{msg.status}</Badge>
                            </td>
                            <td className="py-2 px-4 text-gray-400">{msg.created_at ? new Date(msg.created_at).toLocaleDateString() : '-'}</td>
                            <td className="py-2 px-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                                    Reply
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Mark as Read
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Branding Management</CardTitle>
                <CardDescription>Manage your platform's branding and assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Current Logo</h3>
                    <div className="flex items-center gap-4">
                      <Image
                        src={brandingLogo}
                        alt="Current Logo"
                        width={100}
                        height={100}
                        className="rounded-lg border border-gray-700"
                      />
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? 'Uploading...' : 'Upload New Logo'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleLogoDelete}
                          disabled={deleting}
                          className="text-red-400 hover:text-red-300"
                        >
                          {deleting ? 'Deleting...' : 'Delete Logo'}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <form onSubmit={handleLogoUpload} className="space-y-4">
                    <div>
                      <label htmlFor="logo-upload" className="block text-sm font-medium mb-2">
                        Upload New Logo
                      </label>
                      <Input
                        ref={fileInputRef}
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        className="bg-gray-900 border-gray-700"
                      />
                    </div>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Reply Dialog */}
      <Dialog open={!!replyingTo} onOpenChange={() => setReplyingTo(null)}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400">From: {replyingTo?.name} ({replyingTo?.email})</p>
              <p className="text-sm text-gray-400">Subject: {replyingTo?.subject}</p>
              <p className="text-sm text-gray-400 mt-2">Original Message:</p>
              <p className="text-sm text-white bg-gray-800 p-2 rounded">{replyingTo?.message}</p>
            </div>
            <Textarea
              ref={replyTextareaRef}
              placeholder="Type your reply..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyingTo(null)}>
              Cancel
            </Button>
            <Button onClick={handleSendReply} disabled={replyLoading || !replyContent.trim()}>
              {replyLoading ? 'Sending...' : 'Send Reply'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
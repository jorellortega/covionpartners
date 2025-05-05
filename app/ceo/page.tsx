"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Users, Settings, BarChart2, Shield, AlertCircle, MoreHorizontal } from "lucide-react"
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

export default function CEOPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [userRole, setUserRole] = useState<string | null>(null)
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
  const [brandingLogo, setBrandingLogo] = useState("https://uytqyfpjdevrqmwqfthk.supabase.co/storage/v1/object/public/partnerfiles/branding/handshake.png")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/login')
          return
        }

        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (!user || user.role !== 'ceo') {
          toast.error('Access denied. CEO role required.')
          router.push('/dashboard')
          return
        }

        setUserRole(user.role)
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
        toast.error('Failed to fetch CEO stats')
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

  const handleSendReply = async () => {
    if (!replyingTo || !replyContent.trim()) return
    setReplyLoading(true)
    try {
      // Get CEO user ID from session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const sender_id = session.user.id
      const receiver_id = replyingTo.user_id
      const subject = replyingTo.subject ? `Re: ${replyingTo.subject}` : 'Contact Form Reply'
      const content = replyContent
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id, receiver_id, subject, content })
      })
      if (!res.ok) throw new Error('Failed to send reply')
      toast.success('Reply sent to user messages!')
      setReplyingTo(null)
      setReplyContent("")
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply')
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
      setContactMessages(prev => prev.map(msg => msg.id === id ? { ...msg, checked } : msg))
    } catch (err) {
      toast.error('Failed to update checked state')
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

  if (userRole !== 'ceo') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <span className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full p-1.5 mr-3">
                <Shield className="w-6 h-6 text-white" />
              </span>
              CEO Dashboard
            </h1>
            <Button 
              variant="outline" 
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-cyan-900/20 hover:text-cyan-400"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
              <Card className="leonardo-card border-blue-700 bg-gray-950/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-400">
                    Developer Live Activity
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
                        <div key={event.type + event.id} className="p-2 rounded bg-gray-900/70 border border-blue-800">
                          <span className="text-blue-400 font-semibold mr-2">[{event.type}]</span>
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
                    <Users className="w-5 h-5 text-cyan-400" /> Total Users
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
                    <Settings className="w-5 h-5 text-purple-400" /> Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{statsLoading ? '—' : `$${stats.totalRevenue.toLocaleString()}`}</p>
                </CardContent>
              </Card>
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400" /> Pending Approvals
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
                <CardDescription>Manage all users, roles, and statuses</CardDescription>
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
                          <th className="py-2 px-4">Actions</th>
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
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 border">{u.role}</Badge>
                              </td>
                              <td className="py-2 px-4 text-white">{u.phone_number || '-'}</td>
                              <td className="py-2 px-4 text-white">{u.subscription_status || '-'}</td>
                              <td className="py-2 px-4 text-white">{u.subscription_tier || '-'}</td>
                              <td className="py-2 px-4 text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                              <td className="py-2 px-4 text-gray-400">{u.updated_at ? new Date(u.updated_at).toLocaleDateString() : '-'}</td>
                              <td className="py-2 px-4">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="py-2 px-4">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost" aria-label="User Actions">
                                      <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => toast.info(`View user ${u.id}`)}>
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toast.info(`Edit user ${u.id}`)}>
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toast.info(`Suspend user ${u.id}`)}>
                                      Suspend
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toast.info(`Delete user ${u.id}`)} className="text-red-500">
                                      Delete
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
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400">
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
                          <tr
                            key={msg.id}
                            className="border-b border-gray-900 hover:bg-gray-800/30"
                            style={msg.checked ? { opacity: 0.15 } : {}}
                          >
                            <td className="py-2 px-4">
                              <Checkbox
                                checked={msg.checked}
                                onCheckedChange={checked => handleCheckMessage(msg.id, checked as boolean)}
                              />
                            </td>
                            <td className="py-2 px-4 text-white">{msg.name || '-'}</td>
                            <td className="py-2 px-4 text-blue-300">{msg.email}</td>
                            <td className="py-2 px-4 text-gray-400">
                              {msg.user_id ? (
                                <button
                                  className="text-blue-400 hover:text-blue-300 cursor-pointer focus:outline-none"
                                  style={{ background: 'none', border: 'none', padding: 0 }}
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.user_id)
                                    toast.success('User ID copied!')
                                  }}
                                >
                                  {msg.user_id.slice(-4)}
                                </button>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="py-2 px-4 text-white">{msg.subject}</td>
                            <td className="py-2 px-4 text-gray-300 max-w-xs truncate" title={msg.message}>{msg.message}</td>
                            <td className="py-2 px-4">
                              <Badge className={
                                msg.status === 'new' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 border' :
                                msg.status === 'resolved' ? 'bg-green-500/20 text-green-400 border-green-500/50 border' :
                                'bg-gray-500/20 text-gray-400 border-gray-500/50 border'
                              }>{msg.status}</Badge>
                            </td>
                            <td className="py-2 px-4">
                              {msg.created_at ? (
                                <>
                                  <span className="text-white">
                                    {new Date(msg.created_at).toLocaleString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                  <span className="text-gray-500 ml-2">
                                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                </>
                              ) : '-'}
                            </td>
                            <td className="py-2 px-4">
                              {msg.user_id && (
                                <Dialog open={replyingTo?.id === msg.id} onOpenChange={open => { if (!open) { setReplyingTo(null); setReplyContent("") } }}>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                                      setReplyingTo(msg)
                                      const prefill = `> ${msg.message.replace(/\n/g, '\n> ')}\n---\n\n`
                                      setReplyContent(prefill)
                                      setTimeout(() => {
                                        if (replyTextareaRef.current) {
                                          replyTextareaRef.current.focus()
                                          replyTextareaRef.current.setSelectionRange(prefill.length, prefill.length)
                                        }
                                      }, 0)
                                    }}>
                                      Reply
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reply to {msg.name || msg.email}</DialogTitle>
                                    </DialogHeader>
                                    <Textarea
                                      ref={replyTextareaRef}
                                      value={replyContent}
                                      onChange={e => setReplyContent(e.target.value)}
                                      placeholder="Type your reply..."
                                      className="bg-gray-900 border-gray-700 text-white min-h-[80px]"
                                      autoFocus
                                    />
                                    <DialogFooter>
                                      <Button onClick={handleSendReply} disabled={replyLoading || !replyContent.trim()}>
                                        {replyLoading ? 'Sending...' : 'Send Reply'}
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
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

          <TabsContent value="branding">
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Branding: Handshake Logo</CardTitle>
                <CardDescription>Upload, preview, or delete the handshake logo used on the homepage (for CEO only).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-6">
                  <img
                    src={brandingLogo}
                    alt="Handshake Logo"
                    width={160}
                    height={160}
                    className="rounded-xl border border-gray-700 bg-white"
                  />
                  <form className="flex flex-col items-center gap-4" onSubmit={handleLogoUpload}>
                    <input ref={fileInputRef} type="file" name="handshake" accept="image/*" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100" />
                    <Button type="submit" className="gradient-button" disabled={uploading}>{uploading ? "Uploading..." : "Upload New Logo"}</Button>
                  </form>
                  <Button onClick={handleLogoDelete} variant="destructive" disabled={deleting} className="mt-2">
                    {deleting ? "Deleting..." : "Delete Logo"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 
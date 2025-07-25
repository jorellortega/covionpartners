"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"
import {
  Plus,
  Copy,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  Key,
  Activity,
  Eye,
  EyeOff,
  Pause,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  MessageSquare,
  FileText,
  Settings,
  RefreshCw
} from "lucide-react"
import {
  GuestAccount,
  OrganizationGuestCode,
  GuestActivity,
  CreateGuestCodeRequest,
  UpdateGuestCodeRequest,
  GuestStats,
  GuestPermissions
} from "@/types/guest-accounts"

export default function GuestManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<string>("")
  const [guestCodes, setGuestCodes] = useState<OrganizationGuestCode[]>([])
  const [guestAccounts, setGuestAccounts] = useState<GuestAccount[]>([])
  const [guestActivities, setGuestActivities] = useState<GuestActivity[]>([])
  const [stats, setStats] = useState<GuestStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateCodeDialog, setShowCreateCodeDialog] = useState(false)
  const [showEditCodeDialog, setShowEditCodeDialog] = useState(false)
  const [editingCode, setEditingCode] = useState<OrganizationGuestCode | null>(null)
  const [activeTab, setActiveTab] = useState<'codes' | 'accounts' | 'activities' | 'stats'>('codes')

  // Form states
  const [newCode, setNewCode] = useState({
    name: '',
    description: '',
    max_uses: -1,
    expires_at: '',
    permissions: {
      can_upload: true,
      can_message: true,
      can_view_projects: true,
      can_view_files: true,
      can_comment: true,
      can_download: true,
      max_upload_size: 10485760, // 10MB
      max_daily_uploads: 10,
      max_daily_messages: 50,
      allowed_file_types: ['pdf', 'doc', 'docx', 'jpg', 'png', 'txt'],
      restricted_projects: [] as string[],
      allowed_projects: [] as string[]
    } as GuestPermissions
  })

  useEffect(() => {
    if (user) {
      fetchOrganizations()
    }
  }, [user])

  useEffect(() => {
    if (selectedOrganization) {
      fetchGuestData()
    }
  }, [selectedOrganization])

  const fetchOrganizations = async () => {
    try {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching organizations:', error)
        toast.error('Failed to load organizations')
        return
      }

      setOrganizations(orgs || [])
      if (orgs && orgs.length > 0) {
        setSelectedOrganization(orgs[0].id)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
      toast.error('Failed to load organizations')
    }
  }

  const fetchGuestData = async () => {
    if (!selectedOrganization) return
    
    setLoading(true)
    try {
      // Fetch guest codes
      const codesResponse = await fetch(`/api/guest-codes?organization_id=${selectedOrganization}`)
      const codesData = await codesResponse.json()
      if (codesData.guest_codes) {
        setGuestCodes(codesData.guest_codes)
      }

      // Fetch guest accounts
      const accountsResponse = await fetch(`/api/guest-accounts?organization_id=${selectedOrganization}`)
      const accountsData = await accountsResponse.json()
      if (accountsData.guest_accounts) {
        setGuestAccounts(accountsData.guest_accounts)
      }

      // Fetch stats
      await fetchStats()
    } catch (error) {
      console.error('Error fetching guest data:', error)
      toast.error('Failed to load guest data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/guest-accounts/stats?organization_id=${selectedOrganization}`)
      const data = await response.json()
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const createGuestCode = async () => {
    try {
      const response = await fetch('/api/guest-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrganization,
          ...newCode
        })
      })

      const data = await response.json()
      if (data.guest_code) {
        toast.success('Guest code created successfully')
        setShowCreateCodeDialog(false)
        setNewCode({
          name: '',
          description: '',
          max_uses: -1,
          expires_at: '',
          permissions: {
            can_upload: true,
            can_message: true,
            can_view_projects: true,
            can_view_files: true,
            can_comment: true,
            can_download: true,
            max_upload_size: 10485760,
            max_daily_uploads: 10,
            max_daily_messages: 50,
            allowed_file_types: ['pdf', 'doc', 'docx', 'jpg', 'png', 'txt'],
            restricted_projects: [],
            allowed_projects: []
          }
        })
        fetchGuestData()
      } else {
        toast.error(data.error || 'Failed to create guest code')
      }
    } catch (error) {
      console.error('Error creating guest code:', error)
      toast.error('Failed to create guest code')
    }
  }

  const updateGuestCode = async () => {
    if (!editingCode) return

    try {
      const response = await fetch('/api/guest-codes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCode.id,
          ...newCode
        })
      })

      const data = await response.json()
      if (data.guest_code) {
        toast.success('Guest code updated successfully')
        setShowEditCodeDialog(false)
        setEditingCode(null)
        fetchGuestData()
      } else {
        toast.error(data.error || 'Failed to update guest code')
      }
    } catch (error) {
      console.error('Error updating guest code:', error)
      toast.error('Failed to update guest code')
    }
  }

  const deleteGuestCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this guest code?')) return

    try {
      const response = await fetch(`/api/guest-codes?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Guest code deleted successfully')
        fetchGuestData()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete guest code')
      }
    } catch (error) {
      console.error('Error deleting guest code:', error)
      toast.error('Failed to delete guest code')
    }
  }

  const updateGuestStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/guest-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      const data = await response.json()
      if (data.guest_account) {
        toast.success('Guest status updated successfully')
        fetchGuestData()
      } else {
        toast.error(data.error || 'Failed to update guest status')
      }
    } catch (error) {
      console.error('Error updating guest status:', error)
      toast.error('Failed to update guest status')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'paused': return <Pause className="w-4 h-4 text-yellow-500" />
      case 'frozen': return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'dropped': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'frozen': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'dropped': return 'bg-red-500/20 text-red-400 border-red-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Guest Account Management</h1>
            <p className="text-gray-400">Manage guest access codes and accounts for your organization</p>
          </div>
          <Button
            onClick={() => setShowCreateCodeDialog(true)}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Guest Code
          </Button>
        </div>

        {/* Organization Selector */}
        <Card className="mb-6 border-gray-800 bg-gray-900/50">
          <CardContent className="p-6">
            <Label htmlFor="organization" className="text-white mb-2 block">Select Organization</Label>
            {organizations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You don't have any organizations yet.</p>
                <Button 
                  onClick={() => router.push('/createorganization')}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  Create Organization
                </Button>
              </div>
            ) : (
              <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id} className="text-white">
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {selectedOrganization && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Guest Codes</p>
                      <h3 className="text-2xl font-bold text-white">{guestCodes.length}</h3>
                    </div>
                    <Key className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Guests</p>
                      <h3 className="text-2xl font-bold text-white">
                        {guestAccounts.filter(g => g.status === 'active').length}
                      </h3>
                    </div>
                    <Users className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Uses</p>
                      <h3 className="text-2xl font-bold text-white">
                        {guestCodes.reduce((sum, code) => sum + code.current_uses, 0)}
                      </h3>
                    </div>
                    <Activity className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-800 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Active Codes</p>
                      <h3 className="text-2xl font-bold text-white">
                        {guestCodes.filter(c => c.is_active).length}
                      </h3>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6">
              {[
                { id: 'codes', label: 'Guest Codes', icon: Key },
                { id: 'accounts', label: 'Guest Accounts', icon: Users },
                { id: 'activities', label: 'Activities', icon: Activity },
                { id: 'stats', label: 'Statistics', icon: Settings }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'border-gray-700 hover:bg-gray-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'codes' && (
              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    Guest Codes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Code</TableHead>
                        <TableHead className="text-gray-300">Name</TableHead>
                        <TableHead className="text-gray-300">Uses</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Expires</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guestCodes.map((code) => (
                        <TableRow key={code.id} className="border-gray-700">
                          <TableCell className="text-white">
                            <div className="flex items-center space-x-2">
                              <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                                {code.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(code.code)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">{code.name}</TableCell>
                          <TableCell className="text-white">
                            {code.current_uses} / {code.max_uses === -1 ? '∞' : code.max_uses}
                          </TableCell>
                          <TableCell>
                            <Badge className={code.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                              {code.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">
                            {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingCode(code)
                                    setNewCode({
                                      name: code.name,
                                      description: code.description || '',
                                      max_uses: code.max_uses,
                                      expires_at: code.expires_at || '',
                                      permissions: code.permissions
                                    })
                                    setShowEditCodeDialog(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteGuestCode(code.id)}
                                  className="text-red-400"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'accounts' && (
              <Card className="border-gray-800 bg-gray-900/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    Guest Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Display Name</TableHead>
                        <TableHead className="text-gray-300">Code</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Last Activity</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {guestAccounts.map((account) => (
                        <TableRow key={account.id} className="border-gray-700">
                          <TableCell className="text-white">
                            <div>
                              <div className="font-medium">{account.display_name}</div>
                              {account.email && (
                                <div className="text-sm text-gray-400">{account.email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono">
                              {account.guest_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(account.status)}>
                              {getStatusIcon(account.status)}
                              <span className="ml-1">{account.status}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-white">
                            {account.last_activity 
                              ? new Date(account.last_activity).toLocaleString()
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                {account.status !== 'active' && (
                                  <DropdownMenuItem
                                    onClick={() => updateGuestStatus(account.id, 'active')}
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Activate
                                  </DropdownMenuItem>
                                )}
                                {account.status !== 'paused' && (
                                  <DropdownMenuItem
                                    onClick={() => updateGuestStatus(account.id, 'paused')}
                                  >
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                  </DropdownMenuItem>
                                )}
                                {account.status !== 'frozen' && (
                                  <DropdownMenuItem
                                    onClick={() => updateGuestStatus(account.id, 'frozen')}
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Freeze
                                  </DropdownMenuItem>
                                )}
                                {account.status !== 'dropped' && (
                                  <DropdownMenuItem
                                    onClick={() => updateGuestStatus(account.id, 'dropped')}
                                    className="text-red-400"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Drop
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-gray-800 bg-gray-900/50">
                  <CardHeader>
                    <CardTitle className="text-white">Permission Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {guestCodes.map((code) => (
                        <div key={code.id} className="border border-gray-700 rounded-lg p-4">
                          <h4 className="font-medium text-white mb-2">{code.name}</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Upload className="w-4 h-4 text-blue-400" />
                              <span className="text-gray-300">Upload: {code.permissions.can_upload ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="w-4 h-4 text-green-400" />
                              <span className="text-gray-300">Message: {code.permissions.can_message ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Eye className="w-4 h-4 text-purple-400" />
                              <span className="text-gray-300">View Files: {code.permissions.can_view_files ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Download className="w-4 h-4 text-yellow-400" />
                              <span className="text-gray-300">Download: {code.permissions.can_download ? 'Yes' : 'No'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-gray-800 bg-gray-900/50">
                  <CardHeader>
                    <CardTitle className="text-white">Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Codes Created</span>
                        <span className="text-white font-medium">{guestCodes.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Active Codes</span>
                        <span className="text-white font-medium">{guestCodes.filter(c => c.is_active).length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Guest Accounts</span>
                        <span className="text-white font-medium">{guestAccounts.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Active Guests</span>
                        <span className="text-white font-medium">{guestAccounts.filter(g => g.status === 'active').length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Create Guest Code Dialog */}
        <Dialog open={showCreateCodeDialog} onOpenChange={setShowCreateCodeDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create Guest Code</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new guest access code for your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-white">Code Name</Label>
                <Input
                  id="name"
                  value={newCode.name}
                  onChange={(e) => setNewCode({ ...newCode, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="e.g., Client Access, Vendor Access"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-white">Description</Label>
                <Textarea
                  id="description"
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Optional description of this guest code"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_uses" className="text-white">Max Uses</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={newCode.max_uses === -1 ? '' : newCode.max_uses}
                    onChange={(e) => setNewCode({ 
                      ...newCode, 
                      max_uses: e.target.value === '' ? -1 : parseInt(e.target.value) 
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at" className="text-white">Expires At</Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={newCode.expires_at}
                    onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
              
              {/* Permissions Section */}
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Permissions</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="can_upload"
                      checked={newCode.permissions.can_upload}
                      onChange={(e) => setNewCode({
                        ...newCode,
                        permissions: { ...newCode.permissions, can_upload: e.target.checked }
                      })}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                    <Label htmlFor="can_upload" className="text-white">Can Upload Files</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="can_message"
                      checked={newCode.permissions.can_message}
                      onChange={(e) => setNewCode({
                        ...newCode,
                        permissions: { ...newCode.permissions, can_message: e.target.checked }
                      })}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                    <Label htmlFor="can_message" className="text-white">Can Send Messages</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="can_view_projects"
                      checked={newCode.permissions.can_view_projects}
                      onChange={(e) => setNewCode({
                        ...newCode,
                        permissions: { ...newCode.permissions, can_view_projects: e.target.checked }
                      })}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                    <Label htmlFor="can_view_projects" className="text-white">Can View Projects</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="can_download"
                      checked={newCode.permissions.can_download}
                      onChange={(e) => setNewCode({
                        ...newCode,
                        permissions: { ...newCode.permissions, can_download: e.target.checked }
                      })}
                      className="rounded border-gray-600 bg-gray-800"
                    />
                    <Label htmlFor="can_download" className="text-white">Can Download Files</Label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateCodeDialog(false)}
                className="border-gray-700 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={createGuestCode}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Create Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Guest Code Dialog */}
        <Dialog open={showEditCodeDialog} onOpenChange={setShowEditCodeDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Guest Code</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update the guest access code settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit_name" className="text-white">Code Name</Label>
                <Input
                  id="edit_name"
                  value={newCode.name}
                  onChange={(e) => setNewCode({ ...newCode, name: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit_description" className="text-white">Description</Label>
                <Textarea
                  id="edit_description"
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_max_uses" className="text-white">Max Uses</Label>
                  <Input
                    id="edit_max_uses"
                    type="number"
                    value={newCode.max_uses === -1 ? '' : newCode.max_uses}
                    onChange={(e) => setNewCode({ 
                      ...newCode, 
                      max_uses: e.target.value === '' ? -1 : parseInt(e.target.value) 
                    })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_expires_at" className="text-white">Expires At</Label>
                  <Input
                    id="edit_expires_at"
                    type="datetime-local"
                    value={newCode.expires_at}
                    onChange={(e) => setNewCode({ ...newCode, expires_at: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditCodeDialog(false)}
                className="border-gray-700 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={updateGuestCode}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Update Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 
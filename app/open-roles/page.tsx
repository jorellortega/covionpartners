"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Briefcase,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Clock,
  Building,
  Search,
  Filter,
  ExternalLink,
  ArrowLeft,
  Eye,
  UserPlus,
  Globe,
  Star,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'

interface OpenRole {
  id: string
  role_name: string
  description: string
  requirements: string
  price: number
  project_id: string
  status: 'open' | 'filled' | 'closed'
  created_at: string
  project: {
    name: string
    description: string
    owner_id: string
  }
  applications_count: number
}

interface RoleApplication {
  id: string
  user_id: string
  role_id: string
  role_name: string
  cover_letter: string
  experience: string
  social_links?: string
  portfolio_url?: string
  status: string
  created_at: string
  user: {
    id: string
    name?: string
    email?: string
    avatar_url?: string
  }
}

export default function OpenRolesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [roles, setRoles] = useState<OpenRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<string>('all')
  const [selectedRole, setSelectedRole] = useState<OpenRole | null>(null)
  const [showRoleDetails, setShowRoleDetails] = useState(false)
  const [showApplications, setShowApplications] = useState(false)
  const [selectedRoleApplications, setSelectedRoleApplications] = useState<RoleApplication[]>([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [showWorkSetupModal, setShowWorkSetupModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState<RoleApplication | null>(null)
  const [workSetupForm, setWorkSetupForm] = useState({
    project_title: '',
    work_description: '',
    deliverables: '',
    timeline_days: '',
    payment_terms: '',
    milestones: '',
    communication_preferences: '',
    start_date: '',
    hourly_rate: '',
    total_budget: ''
  })
  const [rolesWithApprovedApps, setRolesWithApprovedApps] = useState<Set<string>>(new Set())

  // 1. Add state for owned projects, modal, and form
  const [ownedProjects, setOwnedProjects] = useState<any[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<OpenRole | null>(null);
  const [roleForm, setRoleForm] = useState({
    project_id: '',
    role_name: '',
    description: '',
    requirements: '',
    price: '',
    price_type: 'hourly',
    positions_needed: 1,
    status: 'open',
  });

  useEffect(() => {
    if (user) {
      fetchOpenRoles()
    }
  }, [user])

  // 2. Fetch owned projects on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (!error) setOwnedProjects(data || []);
    })();
  }, [user]);

  // Debug effect to log applications when they change
  useEffect(() => {
    console.log('Applications updated:', selectedRoleApplications)
  }, [selectedRoleApplications])

  // Function to handle application status changes
  const handleApplicationAction = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('project_role_applications')
        .update({ status: newStatus })
        .eq('id', applicationId)

      if (error) throw error

      // Update the local state to reflect the change
      setSelectedRoleApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      )

      toast({
        title: "Success",
        description: `Application ${newStatus} successfully`,
      })
    } catch (error) {
      console.error('Error updating application status:', error)
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      })
    }
  }

  // Filter applications by status
  const filteredApplications = selectedRoleApplications.filter(app => {
    if (applicationStatusFilter === 'all') return true
    if (applicationStatusFilter === 'approved') {
      return app.status === 'approved' || app.status === 'accepted'
    }
    return app.status === applicationStatusFilter
  })

  // Handle work setup for approved applications
  const openWorkSetup = (application: RoleApplication) => {
    setSelectedApplication(application)
    setWorkSetupForm({
      project_title: `${selectedRole?.role_name} - ${application.user.name || application.user.email}`,
      work_description: selectedRole?.description || '',
      deliverables: '',
      timeline_days: '',
      payment_terms: '',
      milestones: '',
      communication_preferences: '',
      start_date: new Date().toISOString().split('T')[0],
      hourly_rate: selectedRole?.price?.toString() || '',
      total_budget: ''
    })
    setShowWorkSetupModal(true)
  }

  const handleWorkSetupSubmit = async (e: any) => {
    e.preventDefault()
    if (!selectedApplication) return

    try {
      // Create a work assignment record
      const { error } = await supabase
        .from('project_role_work_assignments')
        .insert({
          role_id: selectedApplication.role_id,
          user_id: selectedApplication.user_id,
          project_id: selectedRole?.project_id,
          status: 'active',
          project_title: workSetupForm.project_title,
          work_description: workSetupForm.work_description,
          deliverables: workSetupForm.deliverables,
          timeline_days: Number(workSetupForm.timeline_days),
          payment_terms: workSetupForm.payment_terms,
          milestones: workSetupForm.milestones,
          communication_preferences: workSetupForm.communication_preferences,
          start_date: workSetupForm.start_date,
          hourly_rate: Number(workSetupForm.hourly_rate),
          total_budget: Number(workSetupForm.total_budget),
          assigned_by: user?.id
        })

      if (error) throw error

      // Update the application status to 'assigned'
      await supabase
        .from('project_role_applications')
        .update({ status: 'assigned' })
        .eq('id', selectedApplication.id)

      // Create a notification for the worker
      await supabase
        .from('notifications')
        .insert({
          user_id: selectedApplication.user_id,
          title: 'New Work Assignment',
          message: `You have been assigned to work on "${workSetupForm.project_title}". Check your work dashboard for details.`,
          type: 'work_assignment',
          related_id: selectedApplication.role_id,
          created_at: new Date().toISOString()
        })

      toast({
        title: "Work Assignment Created",
        description: "The work details have been set up and the applicant has been notified.",
      })

      setShowWorkSetupModal(false)
      setSelectedApplication(null)
      await fetchApplicationsForRole(selectedRole?.id || '')
    } catch (error) {
      console.error('Error creating work assignment:', error)
      toast({
        title: "Error",
        description: "Failed to create work assignment",
        variant: "destructive"
      })
    }
  }

  // Check if a role has approved applications that need work setup
  const hasApprovedApplications = async (roleId: string) => {
    const { data, error } = await supabase
      .from('project_role_applications')
      .select('id')
      .eq('role_id', roleId)
      .eq('status', 'approved')
      .limit(1)
    
    return !error && data && data.length > 0
  }

  // Handle quick work setup from role card
  const handleQuickWorkSetup = async (role: OpenRole) => {
    // Get the first approved application for this role
    const { data: approvedApps, error } = await supabase
      .from('project_role_applications')
      .select('*')
      .eq('role_id', role.id)
      .eq('status', 'approved')
      .limit(1)

    if (error || !approvedApps || approvedApps.length === 0) {
      toast({
        title: "No approved applications",
        description: "There are no approved applications for this role.",
        variant: "destructive"
      })
      return
    }

    // Open work setup with the first approved application
    openWorkSetup(approvedApps[0])
  }

  const fetchOpenRoles = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('project_open_roles')
        .select(`
          *,
          project:projects(name, description, owner_id),
          applications_count:project_role_applications(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform the data to include applications count
      const rolesWithCount = data?.map(role => ({
        ...role,
        applications_count: role.applications_count?.length || 0
      })) || []

      setRoles(rolesWithCount)

      // Check which roles have approved applications
      if (user) {
        // Get all approved/accepted applications for roles owned by the user
        const { data: approvedApps, error } = await supabase
          .from('project_role_applications')
          .select('role_id')
          .in('status', ['approved', 'accepted'])
          .in('role_id', rolesWithCount.filter(r => r.project.owner_id === user.id).map(r => r.id))

        if (!error && approvedApps) {
          const approvedRoleIds = new Set(approvedApps.map(app => app.role_id))
          setRolesWithApprovedApps(approvedRoleIds)
          console.log('Roles with approved apps:', approvedRoleIds)
        }
      }
    } catch (error) {
      console.error('Error fetching open roles:', error)
      toast({
        title: "Error",
        description: "Failed to load open roles",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchApplicationsForRole = async (roleId: string) => {
    setLoadingApplications(true)
    try {
      console.log('Fetching applications for role:', roleId)
      
      // First get the applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('project_role_applications')
        .select('*')
        .eq('role_id', roleId)
        .order('created_at', { ascending: false })

      console.log('Applications data:', applicationsData)
      console.log('Applications error:', applicationsError)

      if (applicationsError) {
        console.error('Applications error:', applicationsError)
        throw applicationsError
      }

      if (!applicationsData || applicationsData.length === 0) {
        console.log('No applications found for role')
        setSelectedRoleApplications([])
        return
      }

      // Get unique user IDs
      const userIds = [...new Set(applicationsData.map(app => app.user_id))]
      console.log('User IDs to fetch:', userIds)

      // Try multiple sources for user data
      let usersData = null
      let usersError = null

      // First try the users table
      const { data: usersTableData, error: usersTableError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds)

      if (!usersTableError && usersTableData && usersTableData.length > 0) {
        usersData = usersTableData
        console.log('Successfully fetched from users table')
      } else {
        console.log('Error from users table:', usersTableError)
        
        // Try profiles table as fallback
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds)
        
        if (!profilesError && profilesData && profilesData.length > 0) {
          // Transform profiles data to match our expected format
          usersData = profilesData.map(profile => ({
            id: profile.id,
            name: profile.full_name,
            email: profile.email,
            avatar_url: profile.avatar_url
          }))
          console.log('Successfully fetched from profiles table')
        } else {
          console.log('Error from profiles table:', profilesError)
          
          // Try auth.users as last fallback
          const { data: authUsersData, error: authUsersError } = await supabase
            .from('auth.users')
            .select('id, raw_user_meta_data, email')
            .in('id', userIds)
          
          if (!authUsersError && authUsersData && authUsersData.length > 0) {
            // Transform auth.users data to match our expected format
            usersData = authUsersData.map(user => ({
              id: user.id,
              name: user.raw_user_meta_data?.name || user.raw_user_meta_data?.full_name,
              email: user.email,
              avatar_url: user.raw_user_meta_data?.avatar_url
            }))
            console.log('Successfully fetched from auth.users table')
          } else {
            console.error('Error from all user tables:', { usersTableError, profilesError, authUsersError })
            usersError = authUsersError || profilesError || usersTableError
          }
        }
      }

      console.log('Users data:', usersData)
      console.log('Users error:', usersError)

      if (usersError && !usersData) {
        console.error('Failed to fetch user data from both sources')
        // Still proceed with applications, just without user data
        const applicationsWithoutUsers = applicationsData.map(app => ({
          ...app,
          user: {
            id: app.user_id,
            name: 'Unknown User',
            email: '',
            avatar_url: null
          }
        }))
        setSelectedRoleApplications(applicationsWithoutUsers)
        return
      }

      // Create a map of user data for easy lookup
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || [])

      // Combine applications with user data
      const applicationsWithUsers = applicationsData.map(app => {
        const userData = usersMap.get(app.user_id)
        return {
          ...app,
          user: userData || {
            id: app.user_id,
            name: 'Unknown User',
            email: '',
            avatar_url: null
          }
        }
      })

      console.log('Final applications with users:', applicationsWithUsers)
      setSelectedRoleApplications(applicationsWithUsers)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive"
      })
    } finally {
      setLoadingApplications(false)
    }
  }

  const handleViewApplications = async (role: OpenRole) => {
    setSelectedRole(role)
    setShowApplications(true)
    setApplicationStatusFilter('all') // Reset filter when opening
    await fetchApplicationsForRole(role.id)
  }

  // 3. Open modal for create/edit
  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      project_id: ownedProjects[0]?.id || '',
      role_name: '',
      description: '',
      requirements: '',
      price: '',
      price_type: 'hourly',
      positions_needed: 1,
      status: 'open',
    });
    setShowRoleModal(true);
  };
  const openEditRole = (role: OpenRole) => {
    setEditingRole(role);
    setRoleForm({
      project_id: role.project_id,
      role_name: role.role_name,
      description: role.description,
      requirements: role.requirements,
      price: String(role.price || ''),
      price_type: (role as any).price_type || 'hourly',
      positions_needed: (role as any).positions_needed || 1,
      status: role.status,
    });
    setShowRoleModal(true);
  };

  // 4. Handle form changes
  const handleRoleFormChange = (e: any) => {
    const { name, value } = e.target;
    setRoleForm((prev) => ({ ...prev, [name]: name === 'positions_needed' ? Number(value) : value }));
  };

  // 5. Create or update role
  const handleRoleSubmit = async (e: any) => {
    e.preventDefault();
    if (!roleForm.project_id || !roleForm.role_name) {
      toast({ title: 'Project and Role Name are required', variant: 'destructive' });
      return;
    }
    if (editingRole) {
      // Update
      const { error } = await supabase
        .from('project_open_roles')
        .update({
          role_name: roleForm.role_name,
          description: roleForm.description,
          requirements: roleForm.requirements,
          price: Number(roleForm.price),
          price_type: roleForm.price_type,
          positions_needed: roleForm.positions_needed,
          status: roleForm.status,
        })
        .eq('id', editingRole.id);
      if (error) {
        toast({ title: 'Failed to update role', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Role updated!' });
    } else {
      // Create
      const { error } = await supabase
        .from('project_open_roles')
        .insert({
          project_id: roleForm.project_id,
          role_name: roleForm.role_name,
          description: roleForm.description,
          requirements: roleForm.requirements,
          price: Number(roleForm.price),
          price_type: roleForm.price_type,
          positions_needed: roleForm.positions_needed,
          status: roleForm.status,
        });
      if (error) {
        toast({ title: 'Failed to create role', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Role created!' });
    }
    setShowRoleModal(false);
    setEditingRole(null);
    await fetchOpenRoles();
  };

  // 6. Delete role
  const handleDeleteRole = async (role: OpenRole) => {
    if (!window.confirm('Delete this role?')) return;
    const { error } = await supabase
      .from('project_open_roles')
      .delete()
      .eq('id', role.id);
    if (error) {
      toast({ title: 'Failed to delete role', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Role deleted!' });
    await fetchOpenRoles();
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         role.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         role.project.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || role.status === statusFilter

    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'under-100' && role.price < 100) ||
                        (priceFilter === '100-500' && role.price >= 100 && role.price <= 500) ||
                        (priceFilter === '500-1000' && role.price >= 500 && role.price <= 1000) ||
                        (priceFilter === 'over-1000' && role.price > 1000)

    return matchesSearch && matchesStatus && matchesPrice
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'filled':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'closed':
        return 'bg-red-500/20 text-red-400 border-red-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <CheckCircle className="w-4 h-4" />
      case 'filled':
        return <Users className="w-4 h-4" />
      case 'closed':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to access open roles</h1>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-4 hover:bg-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2 mr-3">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Open Roles</h1>
                  <p className="text-gray-400">Browse all available project roles</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && ownedProjects.length > 0 && (
                <Button
                  onClick={() => setShowRoleModal(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              )}
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                {filteredRoles.length} roles available
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search roles, projects, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by price" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under-100">Under $100</SelectItem>
              <SelectItem value="100-500">$100 - $500</SelectItem>
              <SelectItem value="500-1000">$500 - $1000</SelectItem>
              <SelectItem value="over-1000">Over $1000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Roles</p>
                  <p className="text-2xl font-bold">{roles.length}</p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Open Roles</p>
                  <p className="text-2xl font-bold">{roles.filter(r => r.status === 'open').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Filled Roles</p>
                  <p className="text-2xl font-bold">{roles.filter(r => r.status === 'filled').length}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Applications</p>
                  <p className="text-2xl font-bold">{roles.reduce((acc, role) => acc + role.applications_count, 0)}</p>
                </div>
                <UserPlus className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Roles Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading roles...</p>
            </div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No roles found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || statusFilter !== 'all' || priceFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'No open roles available at the moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoles.map((role) => (
              <Card key={role.id} className="leonardo-card border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{role.role_name}</CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">{role.project.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${getStatusColor(role.status)} border text-xs`}>
                        {getStatusIcon(role.status)}
                        <span className="ml-1">{role.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {role.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-green-400">
                          ${role.price?.toLocaleString() || 'Not specified'}
                        </span>
                      </div>
                      <div 
                        className="flex items-center space-x-2 cursor-pointer hover:bg-blue-500/20 p-1 rounded transition-colors"
                        onClick={() => handleViewApplications(role)}
                      >
                        <UserPlus className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-blue-400 hover:text-blue-300">
                          {role.applications_count} applications
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Posted {new Date(role.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role)
                          setShowRoleDetails(true)
                        }}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Role Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${role.project_id}`)}
                        className="flex-1"
                      >
                        <Briefcase className="w-4 h-4 mr-1" />
                        Project
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/publicprojects/${role.project_id}`)}
                        className="flex-1"
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        Public Project
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${role.project_id}/roles`)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      {user && role.project.owner_id === user.id && (
                        <div className="flex gap-2 pt-2">
                          {rolesWithApprovedApps.has(role.id) && (
                            <Button 
                              size="sm" 
                              className="bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700"
                              onClick={() => handleQuickWorkSetup(role)}
                            >
                              <Briefcase className="w-4 h-4 mr-1" />
                              Set Up Work
                            </Button>
                          )}
                          {/* Debug: Show button for testing */}
                          {role.applications_count > 0 && (
                            <Button 
                              size="sm" 
                              className="bg-orange-600 text-white hover:bg-orange-700 border-orange-600 hover:border-orange-700"
                              onClick={() => handleViewApplications(role)}
                            >
                              <UserPlus className="w-4 h-4 mr-1" />
                              View Apps ({role.applications_count})
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEditRole(role)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteRole(role)}>
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Role Details Dialog */}
      <Dialog open={showRoleDetails} onOpenChange={setShowRoleDetails}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedRole?.role_name}</DialogTitle>
            <DialogDescription>
              {selectedRole?.project.name}
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-gray-300">{selectedRole.description || 'No description available'}</p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Requirements</h4>
                <p className="text-gray-300">{selectedRole.requirements || 'No requirements specified'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Price</h4>
                  <p className="text-green-400 font-medium">
                    ${selectedRole.price?.toLocaleString() || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Applications</h4>
                  <p className="text-blue-400 font-medium">
                    {selectedRole.applications_count} applications
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/projects/${selectedRole.project_id}/roles`)}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Project
                </Button>
                <Button onClick={() => setShowRoleDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Applications Dialog */}
      <Dialog open={showApplications} onOpenChange={setShowApplications}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedRole?.role_name} Applications</DialogTitle>
            <DialogDescription>
              {selectedRole?.project.name}
            </DialogDescription>
          </DialogHeader>
          
          {/* Application Status Filter Tabs */}
          <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg mb-4">
            {[
              { value: 'all', label: 'All', count: selectedRoleApplications.length },
              { value: 'pending', label: 'Pending', count: selectedRoleApplications.filter(app => !app.status || app.status === 'pending').length },
              { value: 'approved', label: 'Approved/Accepted', count: selectedRoleApplications.filter(app => app.status === 'approved' || app.status === 'accepted').length },
              { value: 'rejected', label: 'Rejected', count: selectedRoleApplications.filter(app => app.status === 'rejected').length }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setApplicationStatusFilter(tab.value as any)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  applicationStatusFilter === tab.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
          {loadingApplications ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading applications...</p>
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {applicationStatusFilter === 'all' 
                  ? 'No applications yet for this role'
                  : `No ${applicationStatusFilter} applications`
                }
              </h3>
              <p className="text-gray-400 mb-4">
                {applicationStatusFilter === 'all' 
                  ? 'Be the first to apply for this role!'
                  : `No applications with ${applicationStatusFilter} status found.`
                }
              </p>
            </div>
                     ) : (
             <div className="space-y-4">
               {filteredApplications.map((app) => {
                 console.log('Rendering app:', app)
                 return (
                 <div key={app.id} className="leonardo-card border-gray-800 p-4">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center space-x-3">
                       {/* Clickable Avatar */}
                       <div 
                         className="cursor-pointer group"
                         onClick={() => router.push(`/profile/${app.user.id}`)}
                       >
                         {app.user.avatar_url ? (
                           <img 
                             src={app.user.avatar_url} 
                             alt={app.user.name || 'User avatar'} 
                             className="w-12 h-12 rounded-full object-cover border-2 border-gray-600 group-hover:border-blue-400 transition-colors"
                           />
                         ) : (
                           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg group-hover:from-purple-400 group-hover:to-blue-400 transition-colors">
                             {(app.user.name || app.user.email || 'U').charAt(0).toUpperCase()}
                           </div>
                         )}
                       </div>
                       <div>
                         <button 
                           onClick={() => router.push(`/profile/${app.user.id}`)}
                           className="font-semibold text-gray-200 hover:text-blue-400 transition-colors text-left"
                         >
                           {app.user.name || app.user.email}
                         </button>
                         <div className="flex items-center space-x-2 mt-1">
                           <Mail className="w-3 h-3 text-gray-400" />
                           <a href={`mailto:${app.user.email}`} className="text-xs text-blue-400 hover:underline">
                             {app.user.email}
                           </a>
                         </div>
                       </div>
                     </div>
                     <span className="text-xs text-gray-500">
                       {new Date(app.created_at).toLocaleDateString()}
                     </span>
                   </div>
                   
                   <div className="mb-3">
                     <h4 className="text-sm font-medium text-gray-300 mb-1">Cover Letter:</h4>
                     <p className="text-sm text-gray-400 line-clamp-3">{app.cover_letter}</p>
                   </div>
                   
                   {app.experience && (
                     <div className="mb-3">
                       <h4 className="text-sm font-medium text-gray-300 mb-1">Experience:</h4>
                       <p className="text-sm text-gray-400 line-clamp-2">{app.experience}</p>
                     </div>
                   )}
                   
                   <div className="flex items-center space-x-4 text-xs mb-4">
                     {app.social_links && (
                       <a 
                         href={app.social_links} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                       >
                         <Globe className="w-4 h-4" />
                         <span>Social Links</span>
                       </a>
                     )}
                     {app.portfolio_url && (
                       <a 
                         href={app.portfolio_url} 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="flex items-center space-x-1 text-green-400 hover:text-green-300 transition-colors"
                       >
                         <Eye className="w-4 h-4" />
                         <span>Portfolio</span>
                       </a>
                     )}
                   </div>
                   
                   {/* Application Status and Action Buttons */}
                   <div className="border-t border-gray-700 pt-4 flex items-center justify-between">
                     <Badge 
                       className={`${
                         app.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                         app.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                         'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                       } border`}
                     >
                       {app.status || 'pending'}
                     </Badge>
                     
                     {(app.status === 'pending' || !app.status) && (
                       <div className="flex items-center space-x-3">
                         <Button
                           size="default"
                           variant="outline"
                           className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400"
                           onClick={() => handleApplicationAction(app.id, 'rejected')}
                         >
                           <XCircle className="w-4 h-4 mr-2" />
                           Reject
                         </Button>
                         <Button
                           size="default"
                           className="bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700"
                           onClick={() => handleApplicationAction(app.id, 'approved')}
                         >
                           <CheckCircle className="w-4 h-4 mr-2" />
                           Approve
                         </Button>
                       </div>
                     )}
                     
                     {(app.status === 'approved' || app.status === 'accepted') && (
                       <div className="flex items-center space-x-3">
                         <Button
                           size="default"
                           className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700"
                           onClick={() => openWorkSetup(app)}
                         >
                           <Briefcase className="w-4 h-4 mr-2" />
                           Set Up Work
                         </Button>
                       </div>
                     )}
                     
                     {app.status === 'assigned' && (
                       <div className="flex items-center space-x-3">
                         <Button
                           size="default"
                           variant="outline"
                           className="border-green-500/50 text-green-400"
                           disabled
                         >
                           <CheckCircle className="w-4 h-4 mr-2" />
                           Work Assigned
                         </Button>
                       </div>
                     )}
                   </div>
                 </div>
                 )
               })}
             </div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowApplications(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Project</label>
              <select
                name="project_id"
                value={roleForm.project_id}
                onChange={handleRoleFormChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                required
              >
                {ownedProjects.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role Name</label>
              <input
                name="role_name"
                value={roleForm.role_name}
                onChange={handleRoleFormChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={roleForm.description}
                onChange={handleRoleFormChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Requirements</label>
              <textarea
                name="requirements"
                value={roleForm.requirements}
                onChange={handleRoleFormChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  name="price"
                  type="number"
                  value={roleForm.price}
                  onChange={handleRoleFormChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Price Type</label>
                <select
                  name="price_type"
                  value={roleForm.price_type}
                  onChange={handleRoleFormChange}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="hourly">Hourly</option>
                  <option value="fixed">Fixed</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Positions Needed</label>
              <input
                name="positions_needed"
                type="number"
                min={1}
                value={roleForm.positions_needed}
                onChange={handleRoleFormChange}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowRoleModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white">
                {editingRole ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Work Setup Modal */}
      <Dialog open={showWorkSetupModal} onOpenChange={setShowWorkSetupModal}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Up Work Assignment</DialogTitle>
            <DialogDescription>
              Define the work details, requirements, and payment terms for {selectedApplication?.user.name || selectedApplication?.user.email}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleWorkSetupSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Title</label>
                <input
                  name="project_title"
                  value={workSetupForm.project_title}
                  onChange={(e) => setWorkSetupForm(prev => ({ ...prev, project_title: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  name="start_date"
                  type="date"
                  value={workSetupForm.start_date}
                  onChange={(e) => setWorkSetupForm(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Work Description</label>
              <textarea
                name="work_description"
                value={workSetupForm.work_description}
                onChange={(e) => setWorkSetupForm(prev => ({ ...prev, work_description: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white h-24"
                placeholder="Detailed description of the work to be performed..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deliverables</label>
              <textarea
                name="deliverables"
                value={workSetupForm.deliverables}
                onChange={(e) => setWorkSetupForm(prev => ({ ...prev, deliverables: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white h-20"
                placeholder="What specific deliverables are expected..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Timeline (Days)</label>
                <input
                  name="timeline_days"
                  type="number"
                  value={workSetupForm.timeline_days}
                  onChange={(e) => setWorkSetupForm(prev => ({ ...prev, timeline_days: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  placeholder="30"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hourly Rate ($)</label>
                <input
                  name="hourly_rate"
                  type="number"
                  value={workSetupForm.hourly_rate}
                  onChange={(e) => setWorkSetupForm(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  placeholder="25"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Total Budget ($)</label>
                <input
                  name="total_budget"
                  type="number"
                  value={workSetupForm.total_budget}
                  onChange={(e) => setWorkSetupForm(prev => ({ ...prev, total_budget: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                  placeholder="1000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Payment Terms</label>
              <textarea
                name="payment_terms"
                value={workSetupForm.payment_terms}
                onChange={(e) => setWorkSetupForm(prev => ({ ...prev, payment_terms: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white h-16"
                placeholder="Payment schedule, milestones, etc..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Milestones</label>
              <textarea
                name="milestones"
                value={workSetupForm.milestones}
                onChange={(e) => setWorkSetupForm(prev => ({ ...prev, milestones: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white h-16"
                placeholder="Key milestones and deadlines..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Communication Preferences</label>
              <textarea
                name="communication_preferences"
                value={workSetupForm.communication_preferences}
                onChange={(e) => setWorkSetupForm(prev => ({ ...prev, communication_preferences: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white h-16"
                placeholder="How and when to communicate updates, meetings, etc..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowWorkSetupModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                Create Work Assignment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
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
  Mail
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

  useEffect(() => {
    if (user) {
      fetchOpenRoles()
    }
  }, [user])

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
    await fetchApplicationsForRole(role.id)
  }

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
            <div className="flex items-center space-x-2">
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
          {loadingApplications ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading applications...</p>
              </div>
            </div>
          ) : selectedRoleApplications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No applications yet for this role</h3>
              <p className="text-gray-400 mb-4">
                Be the first to apply for this role!
              </p>
            </div>
                     ) : (
             <div className="space-y-4">
               {selectedRoleApplications.map((app) => {
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
    </div>
  )
} 
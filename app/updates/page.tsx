"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUpdates } from '@/hooks/useUpdates'
import { Home, Search, RefreshCw, ArrowRight, Plus, Edit, Trash2, Loader2, UserPlus, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate } from "@/lib/utils"

// Join request notification type
interface JoinRequest {
  id: string
  user_id: string
  type: string
  title: string
  content: string
  metadata: {
    project_id: string
    project_name: string
    user_id: string
    user_name: string
    user_email: string
    team_member_id: string
  }
  read: boolean
  created_at: string
}

interface Project {
  id: string
  name: string
}

type Update = {
  id: string
  content: string
  created_at: string
  user_name: string
  projects?: {
    id: string
    name: string
  }
}

export default function UpdatesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { updates, loading, error, refreshUpdates, createUpdate, deleteUpdate } = useUpdates()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updateToDeleteId, setUpdateToDeleteId] = useState<number | null>(null)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [loadingJoinRequests, setLoadingJoinRequests] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
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
  const [activeTab, setActiveTab] = useState('all-updates')

  // Fetch join requests
  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!user) return
      
      setLoadingJoinRequests(true)
      try {
        console.log('Fetching join requests for user:', user.id)
        
        // First check if the notifications table exists/is accessible
        const { count, error: countError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
        
        if (countError) {
          console.error('Error checking notifications table:', countError)
          throw new Error(`Cannot access notifications table: ${countError.message || 'Unknown error'}`)
        }
        
        console.log('Notifications table accessible, found count:', count)
        
        // Now fetch actual notifications
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'join_request')
          .order('created_at', { ascending: false })
        
        console.log('Query result:', { data, error })
        
        if (error) {
          console.error('Detailed error info:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          throw error
        }
        
        if (!data) {
          console.log('No data returned, but no error either')
          setJoinRequests([])
          return
        }
        
        // Parse the metadata JSON string for each notification
        const parsedData = data.map(item => {
          try {
            return {
              ...item,
              metadata: typeof item.metadata === 'string' 
                ? JSON.parse(item.metadata) 
                : item.metadata
            }
          } catch (parseError) {
            console.error('Error parsing metadata for item:', item, parseError)
            return {
              ...item,
              metadata: {
                error: 'Failed to parse metadata',
                raw: item.metadata
              }
            }
          }
        })
        
        console.log('Processed join requests:', parsedData)
        setJoinRequests(parsedData)
      } catch (err: any) {
        console.error('Error fetching join requests:', err)
        console.error('Error details:', err.message || 'Unknown error')
        toast.error(`Failed to load join requests: ${err.message || 'Unknown error'}`)
      } finally {
        setLoadingJoinRequests(false)
      }
    }
    
    fetchJoinRequests()
  }, [user])

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
        
        let memberProjects: any[] = []
        
        if (teamMemberships && teamMemberships.length > 0) {
          const projectIds = teamMemberships.map(tm => tm.project_id)
          
          const { data: joinedProjects, error: joinedError } = await supabase
            .from('projects')
            .select('id, name')
            .in('id', projectIds)
            .order('name')
          
          if (joinedError) throw joinedError
          memberProjects = joinedProjects || []
        }
        
        // Combine owned and member projects, removing duplicates
        const allProjects = [...(ownedProjects || []), ...memberProjects]
        const uniqueProjects = allProjects.filter((project, index, self) =>
          index === self.findIndex(p => p.id === project.id)
        )
        
        setProjects(uniqueProjects)
      } catch (err) {
        console.error('Error fetching projects:', err)
        toast.error('Failed to load projects')
      } finally {
        setLoadingProjects(false)
      }
    }
    
    fetchProjects()
  }, [user])

  const handleApproveJoinRequest = async (notification: JoinRequest) => {
    try {
      if (!user) return
      
      // Update team member status to active
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ status: 'active' })
        .eq('id', notification.metadata.team_member_id)
      
      if (updateError) throw updateError
      
      // Mark notification as read
      const { error: notifError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id)
      
      if (notifError) throw notifError
      
      // Remove from local state
      setJoinRequests(prev => prev.filter(req => req.id !== notification.id))
      
      toast.success(`Approved join request from ${notification.metadata.user_name || 'user'}`)
    } catch (err) {
      console.error('Error approving join request:', err)
      toast.error('Failed to approve join request')
    }
  }
  
  const handleRejectJoinRequest = async (notification: JoinRequest) => {
    try {
      if (!user) return
      
      // Delete the team member record
      const { error: deleteError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', notification.metadata.team_member_id)
      
      if (deleteError) throw deleteError
      
      // Mark notification as read
      const { error: notifError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id)
      
      if (notifError) throw notifError
      
      // Remove from local state
      setJoinRequests(prev => prev.filter(req => req.id !== notification.id))
      
      toast.success(`Rejected join request from ${notification.metadata.user_name || 'user'}`)
    } catch (err) {
      console.error('Error rejecting join request:', err)
      toast.error('Failed to reject join request')
    }
  }

  const filteredUpdates = updates.filter(update => {
    const matchesSearch = 
      update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      update.category.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'project-updates') {
      return matchesSearch && update.category.toLowerCase() === 'project'
    }
    
    return matchesSearch
  })

  const handleCreateUpdate = async () => {
    if (newUpdate.category === 'project' && !newUpdate.project_id) {
      toast.error('Please select a project for the project update')
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
      toast.error(error)
    } else {
      toast.success('Update created successfully')
      refreshUpdates()
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

  const confirmDeleteUpdate = async () => {
    if (updateToDeleteId === null) return; 
    
    const { error } = await deleteUpdate(updateToDeleteId);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Update deleted successfully');
    }
    setUpdateToDeleteId(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteClick = (id: number) => {
    setUpdateToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const canManageUpdates = user?.role === 'partner' || user?.role === 'admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={refreshUpdates}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="hover:bg-accent"
              >
                <Home className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">Updates</h1>
            </div>
          </div>

          <div className="flex justify-end gap-2 mb-4">
            {canManageUpdates && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Update
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
                            const project = projects.find(p => p.id === e.target.value)
                            setNewUpdate(prev => ({
                              ...prev,
                              project_id: e.target.value,
                              project_name: project ? project.name : ''
                            }))
                          }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select a project</option>
                          {projects.map((project) => (
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
            )}
            <Button onClick={refreshUpdates} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all-updates">All Updates</TabsTrigger>
              <TabsTrigger value="project-updates">Project Updates</TabsTrigger>
              <TabsTrigger value="join-requests" className="relative">
                Join Requests
                {joinRequests.length > 0 && (
                  <Badge className="ml-2 bg-purple-600" variant="secondary">{joinRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-updates">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search updates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {filteredUpdates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-gray-500 text-center">
                      {searchQuery
                        ? 'No updates found matching your search.'
                        : 'No updates available at the moment.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUpdates.map((update) => (
                    <Card 
                      key={update.id} 
                      className="hover:shadow-lg transition-shadow p-4"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{update.title}</CardTitle>
                            {update.projects && (
                              <p className="text-lg font-semibold text-purple-400 mt-1">
                                {update.projects.name}
                              </p>
                            )}
                          </div>
                          <Badge variant={update.status === 'completed' ? 'default' : 'secondary'}>
                            {update.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{update.category}</Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(update.date).toLocaleDateString()}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{update.description}</p>
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
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <Button 
                            variant="ghost" 
                            onClick={() => router.push(`/updates/${update.id}`)}
                            className="hover:bg-purple-500"
                          >
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          {canManageUpdates && (
                            <div className="flex gap-2">
                              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-red-900/20 hover:text-red-400"
                                    onClick={() => handleDeleteClick(update.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the update.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={confirmDeleteUpdate}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="project-updates">
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search project updates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {filteredUpdates.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-gray-500 text-center">
                      {searchQuery
                        ? 'No project updates found matching your search.'
                        : 'No project updates available at the moment.'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUpdates.map((update) => (
                    <Card 
                      key={update.id} 
                      className="hover:shadow-lg transition-shadow p-4"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{update.title}</CardTitle>
                            {update.projects && (
                              <p className="text-lg font-semibold text-purple-400 mt-1">
                                {update.projects.name}
                              </p>
                            )}
                          </div>
                          <Badge variant={update.status === 'completed' ? 'default' : 'secondary'}>
                            {update.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline">{update.category}</Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(update.date).toLocaleDateString()}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{update.description}</p>
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
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <Button 
                            variant="ghost" 
                            onClick={() => router.push(`/updates/${update.id}`)}
                            className="hover:bg-purple-500"
                          >
                            View Details
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          {canManageUpdates && (
                            <div className="flex gap-2">
                              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="hover:bg-red-900/20 hover:text-red-400"
                                    onClick={() => handleDeleteClick(update.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the update.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={confirmDeleteUpdate}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="join-requests">
              {loadingJoinRequests ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : joinRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-gray-500 text-center">No pending join requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {joinRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-purple-500" />
                            Join Request
                          </CardTitle>
                          <Badge>New</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="font-medium">{request.content}</p>
                          
                          <div className="text-sm text-gray-500">
                            <p>From: {request.metadata.user_name || 'Unknown User'}</p>
                            <p>Email: {request.metadata.user_email || 'No email provided'}</p>
                            <p>Project: {request.metadata.project_name}</p>
                            <p>Date: {new Date(request.created_at).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <Button 
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                              onClick={() => handleApproveJoinRequest(request)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                            <Button 
                              variant="destructive" 
                              className="flex-1"
                              onClick={() => handleRejectJoinRequest(request)}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 
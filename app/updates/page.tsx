"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUpdates } from '@/hooks/useUpdates'
import { Home, Search, RefreshCw, ArrowRight, Plus, Edit, Trash2, Loader2, UserPlus, Check, X, Briefcase, CheckCircle2, XCircle, FileText, MessageSquare } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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
  const [notificationToDeleteId, setNotificationToDeleteId] = useState<string | null>(null)
  const [showDeleteNotificationConfirm, setShowDeleteNotificationConfirm] = useState(false)
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [loadingJoinRequests, setLoadingJoinRequests] = useState(true)
  const [applicationNotifications, setApplicationNotifications] = useState<any[]>([])
  const [loadingApplicationNotifications, setLoadingApplicationNotifications] = useState(true)
  const [partnerNotifications, setPartnerNotifications] = useState<any[]>([])
  const [loadingPartnerNotifications, setLoadingPartnerNotifications] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    description: '',
    status: 'new',
    date: new Date().toISOString().split('T')[0],
    category: 'project',
    full_content: '',
    project_id: '',
    project_name: ''
  })
  const [activeTab, setActiveTab] = useState('all-updates')

  // Refresh updates when navigating back to this page (e.g., from details page)
  useEffect(() => {
    // Listen for browser back/forward navigation
    const handlePopState = () => {
      if (window.location.pathname === '/updates') {
        refreshUpdates()
      }
    }

    // Listen for visibility changes (when tab becomes visible again)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshUpdates()
      }
    }

    // Also refresh when component becomes visible (handles client-side navigation)
    const checkAndRefresh = () => {
      if (document.visibilityState === 'visible' && window.location.pathname === '/updates') {
        refreshUpdates()
      }
    }

    window.addEventListener('popstate', handlePopState)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // Check on focus (when user switches back to the tab)
    window.addEventListener('focus', checkAndRefresh)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', checkAndRefresh)
    }
  }, [refreshUpdates])

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

  // Fetch application notifications
  useEffect(() => {
    const fetchApplicationNotifications = async () => {
      if (!user) return
      
      setLoadingApplicationNotifications(true)
      try {
        console.log('Fetching application notifications for user:', user.id)
        
        // Fetch both job application and project role application notifications
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .in('type', ['job_application', 'project_role_application'])
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching application notifications:', error)
          throw error
        }
        
        if (!data) {
          setApplicationNotifications([])
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
        
        console.log('Processed application notifications:', parsedData)
        setApplicationNotifications(parsedData)
      } catch (err: any) {
        console.error('Error fetching application notifications:', err)
        toast.error(`Failed to load application notifications: ${err.message || 'Unknown error'}`)
      } finally {
        setLoadingApplicationNotifications(false)
      }
    }
    
    fetchApplicationNotifications()
  }, [user])

  // Fetch partner notifications
  useEffect(() => {
    const fetchPartnerNotifications = async () => {
      if (!user) return
      
      setLoadingPartnerNotifications(true)
      try {
        console.log('Fetching partner notifications for user:', user.id)
        
        // Fetch partner-related notifications
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .in('type', ['partner_note_created', 'partner_note_updated', 'partner_invitation_accepted', 'partner_project_comment'])
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching partner notifications:', error)
          throw error
        }
        
        if (!data) {
          setPartnerNotifications([])
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
        
        console.log('Processed partner notifications:', parsedData)
        setPartnerNotifications(parsedData)
      } catch (err: any) {
        console.error('Error fetching partner notifications:', err)
        toast.error(`Failed to load partner notifications: ${err.message || 'Unknown error'}`)
      } finally {
        setLoadingPartnerNotifications(false)
      }
    }
    
    fetchPartnerNotifications()
  }, [user])

  // Function to mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
      
      if (error) throw error
      
      // Update local state
      setApplicationNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
      
      setPartnerNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
      
      setApplicationNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

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

  // Combine updates with partner notifications and application notifications for "All Updates" tab
  const allItems = useMemo(() => {
    const updateItems = updates.map(update => ({
      ...update,
      itemType: 'update' as const,
      displayDate: update.date || update.created_at
    }))
    
    // Transform partner notifications to match update format
    const partnerNotificationItems = partnerNotifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      description: notification.content,
      category: 'partner',
      status: notification.read ? 'read' : 'new',
      date: notification.created_at,
      created_at: notification.created_at,
      created_by: notification.metadata?.created_by || notification.metadata?.partner_user_id || notification.metadata?.commenter_id || '',
      user_name: notification.metadata?.created_by_name || notification.metadata?.partner_name || notification.metadata?.commenter_name || 'Unknown',
      projects: notification.metadata?.project_name ? { name: notification.metadata.project_name } : null,
      itemType: 'partner_notification' as const,
      notificationType: notification.type,
      notificationMetadata: notification.metadata,
      read: notification.read,
      displayDate: notification.created_at
    }))
    
    // Transform application notifications to match update format
    const applicationNotificationItems = applicationNotifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      description: notification.content,
      category: 'application_status',
      status: notification.metadata?.status || 'pending',
      date: notification.created_at,
      created_at: notification.created_at,
      created_by: notification.metadata?.updated_by || '',
      user_name: 'System',
      projects: notification.metadata?.project_name ? { name: notification.metadata.project_name } : null,
      itemType: 'application_notification' as const,
      notificationType: notification.type,
      notificationMetadata: notification.metadata,
      read: notification.read,
      displayDate: notification.created_at
    }))
    
    // Combine and sort by date (newest first)
    const combined = [...updateItems, ...partnerNotificationItems, ...applicationNotificationItems].sort((a, b) => {
      const dateA = new Date(a.displayDate).getTime()
      const dateB = new Date(b.displayDate).getTime()
      return dateB - dateA
    })
    
    return combined
  }, [updates, partnerNotifications, applicationNotifications])

  const filteredUpdates = allItems.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeTab === 'all-updates') {
      return matchesSearch // Show all updates and partner notifications
    }
    
    if (activeTab === 'project-updates') {
      return matchesSearch && item.category.toLowerCase() === 'project'
    }
    
    if (activeTab === 'join-requests') {
      return matchesSearch && item.category.toLowerCase() === 'join_request'
    }
    
    if (activeTab === 'application-status') {
      return matchesSearch && item.category.toLowerCase() === 'application_status'
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
        category: 'project',
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

  const handleDeleteNotificationClick = (id: string) => {
    setNotificationToDeleteId(id);
    setShowDeleteNotificationConfirm(true);
  };

  const confirmDeleteNotification = async () => {
    if (!notificationToDeleteId) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationToDeleteId);
      
      if (error) throw error;
      
      // Remove from local state
      setPartnerNotifications(prev => prev.filter(n => n.id !== notificationToDeleteId));
      setApplicationNotifications(prev => prev.filter(n => n.id !== notificationToDeleteId));
      
      // Also refresh the lists to update the "All Updates" tab
      const fetchPartnerNotifications = async () => {
        if (!user) return
        
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .in('type', ['partner_note_created', 'partner_note_updated', 'partner_invitation_accepted', 'partner_project_comment'])
            .order('created_at', { ascending: false })
          
          if (error) throw error
          
          if (data) {
            const parsedData = data.map(item => {
              try {
                return {
                  ...item,
                  metadata: typeof item.metadata === 'string' 
                    ? JSON.parse(item.metadata) 
                    : item.metadata
                }
              } catch (parseError) {
                return {
                  ...item,
                  metadata: {
                    error: 'Failed to parse metadata',
                    raw: item.metadata
                  }
                }
              }
            })
            
            setPartnerNotifications(parsedData)
          }
        } catch (err: any) {
          console.error('Error refreshing partner notifications:', err)
        }
      }
      
      const fetchApplicationNotifications = async () => {
        if (!user) return
        
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .in('type', ['job_application', 'project_role_application'])
            .order('created_at', { ascending: false })
          
          if (error) throw error
          
          if (data) {
            const parsedData = data.map(item => {
              try {
                return {
                  ...item,
                  metadata: typeof item.metadata === 'string' 
                    ? JSON.parse(item.metadata) 
                    : item.metadata
                }
              } catch (parseError) {
                return {
                  ...item,
                  metadata: {
                    error: 'Failed to parse metadata',
                    raw: item.metadata
                  }
                }
              }
            })
            
            setApplicationNotifications(parsedData)
          }
        } catch (err: any) {
          console.error('Error refreshing application notifications:', err)
        }
      }
      
      fetchPartnerNotifications()
      fetchApplicationNotifications()
      
      toast.success('Notification deleted successfully');
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    } finally {
      setNotificationToDeleteId(null);
      setShowDeleteNotificationConfirm(false);
    }
  };

  const canManageUpdates = user && ['partner', 'admin', 'ceo'].includes(user.role)

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
    <div className="w-full max-w-full md:max-w-5xl mx-auto py-8 px-4">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Dialog open={showCreateDialog} onOpenChange={canManageUpdates ? setShowCreateDialog : undefined}>
                <DialogTrigger asChild>
                        <Button
                          variant="default"
                          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow"
                          disabled={!canManageUpdates}
                          onClick={() => canManageUpdates && setShowCreateDialog(true)}
                        >
                          + Create Update
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
                        <option value="project">Project Update</option>
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
                  </span>
                </TooltipTrigger>
                {!canManageUpdates && (
                  <TooltipContent>
                    Only partners and admins can create updates.
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
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
              <TabsTrigger value="application-notifications" className="relative">
                Application Status
                {applicationNotifications.filter(n => !n.read).length > 0 && (
                  <Badge className="ml-2 bg-blue-600" variant="secondary">{applicationNotifications.filter(n => !n.read).length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="partner-notifications" className="relative">
                Partner Updates
                {partnerNotifications.filter(n => !n.read).length > 0 && (
                  <Badge className="ml-2 bg-purple-600" variant="secondary">{partnerNotifications.filter(n => !n.read).length}</Badge>
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
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUpdates.map((item) => {
                    // Handle application notifications
                    if (item.itemType === 'application_notification') {
                      const notification = item as any
                      return (
                        <Card 
                          key={item.id} 
                          className={`hover:shadow-lg transition-shadow p-4 cursor-pointer ${
                            !notification.read ? 'ring-2 ring-blue-500/50 bg-blue-50/5' : ''
                          }`}
                          onClick={(e) => {
                            // Don't navigate if clicking on buttons or interactive elements
                            const target = e.target as HTMLElement
                            if (target.closest('button') || target.closest('[role="dialog"]') || target.closest('[role="alertdialog"]') || showDeleteNotificationConfirm) {
                              return
                            }
                            
                            if (!notification.read) {
                              markNotificationAsRead(item.id)
                            }
                            // Navigate to approved positions page if accepted, or stay on updates page
                            if (notification.notificationMetadata?.status === 'accepted') {
                              router.push('/approved-positions')
                            }
                          }}
                        >
                          <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {notification.notificationType === 'job_application' ? (
                                    <Briefcase className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <UserPlus className="h-4 w-4 text-purple-500" />
                                  )}
                                  {item.title}
                                  {!notification.read && (
                                    <Badge className="ml-2 bg-blue-600" variant="secondary">New</Badge>
                                  )}
                                </CardTitle>
                                {item.projects && (
                                  <p className="text-lg font-semibold text-blue-400 mt-1">
                                    {item.projects.name}
                                  </p>
                                )}
                              </div>
                              <Badge variant={notification.status === 'accepted' ? 'default' : 
                                           notification.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {notification.status}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
                              <div className="flex gap-2">
                                <Badge variant="outline">application</Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(item.date || item.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600 mb-4">{item.description}</p>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {(item.user_name || 'S').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'S'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium">
                                    {item.user_name || 'System'}
                                  </p>
                                  <span className="text-xs text-gray-400">
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {notification.notificationMetadata?.status === 'accepted' && (
                              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg mt-4">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm font-medium">Congratulations! Your application was accepted.</span>
                              </div>
                            )}
                            {notification.notificationMetadata?.status === 'rejected' && (
                              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mt-4">
                                <XCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Your application was not selected this time.</span>
                              </div>
                            )}
                            {notification.notificationMetadata?.status === 'shortlisted' && (
                              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg mt-4">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm font-medium">You've been shortlisted! Keep an eye out for next steps.</span>
                              </div>
                            )}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
                              {notification.notificationMetadata?.status === 'accepted' && (
                                <Button 
                                  variant="ghost" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push('/approved-positions')
                                  }}
                                  className="hover:bg-blue-500"
                                >
                                  View Approved Position
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              )}
                              <AlertDialog open={showDeleteNotificationConfirm} onOpenChange={setShowDeleteNotificationConfirm}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleDeleteNotificationClick(item.id)
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    className="hover:bg-red-900/20 hover:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the notification.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => {
                                      e.stopPropagation()
                                      confirmDeleteNotification()
                                    }}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }
                    
                    // Handle partner notifications differently
                    if (item.itemType === 'partner_notification') {
                      const notification = item as any
                      return (
                        <Card 
                          key={item.id} 
                          className={`hover:shadow-lg transition-shadow p-4 cursor-pointer ${
                            !notification.read ? 'ring-2 ring-purple-500/50 bg-purple-50/5' : ''
                          }`}
                          onClick={(e) => {
                            // Don't navigate if clicking on buttons or interactive elements
                            const target = e.target as HTMLElement
                            if (target.closest('button') || target.closest('[role="dialog"]') || target.closest('[role="alertdialog"]') || showDeleteNotificationConfirm) {
                              return
                            }
                            
                            if (!notification.read) {
                              markNotificationAsRead(item.id)
                            }
                            // Navigate based on notification type
                            if (notification.notificationType === 'partner_note_created' || notification.notificationType === 'partner_note_updated') {
                              router.push('/partners-overview')
                            } else if (notification.notificationType === 'partner_invitation_accepted') {
                              // Pass partner invitation ID to auto-select the partner
                              const invitationId = notification.notificationMetadata?.partner_invitation_id
                              if (invitationId) {
                                router.push(`/my-partners?invitation=${invitationId}`)
                              } else {
                                router.push('/my-partners')
                              }
                            } else if (notification.notificationType === 'partner_project_comment') {
                              // If title is "Partner Commented on Project", user is organization owner -> go to my-partners
                              // If title is "New Comment on Project", user is partner -> go to partners-overview
                              if (item.title === 'Partner Commented on Project') {
                                const invitationId = notification.notificationMetadata?.partner_invitation_id
                                const partnerUserId = notification.notificationMetadata?.partner_user_id
                                if (invitationId) {
                                  router.push(`/my-partners?invitation=${invitationId}`)
                                } else if (partnerUserId) {
                                  router.push(`/my-partners?partner=${partnerUserId}`)
                                } else {
                                  router.push('/my-partners')
                                }
                              } else {
                                router.push('/partners-overview')
                              }
                            }
                          }}
                        >
                          <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {notification.notificationType === 'partner_invitation_accepted' ? (
                                    <UserPlus className="h-4 w-4 text-green-500" />
                                  ) : notification.notificationType === 'partner_project_comment' ? (
                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-blue-500" />
                                  )}
                                  {item.title}
                                  {!notification.read && (
                                    <Badge className="ml-2 bg-purple-600" variant="secondary">New</Badge>
                                  )}
                                </CardTitle>
                                {item.projects && (
                                  <p className="text-lg font-semibold text-purple-400 mt-1">
                                    {item.projects.name}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline">Partner</Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
                              <div className="flex gap-2">
                                <Badge variant="outline">partner</Badge>
                                <span className="text-sm text-gray-500">
                                  {new Date(item.date || item.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600 mb-4">{item.description}</p>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {(item.user_name || 'U').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <p className="text-sm font-medium">
                                    {item.user_name || 'Unknown User'}
                                  </p>
                                  <span className="text-xs text-gray-400">
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
                              <Button 
                                variant="ghost" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (notification.notificationType === 'partner_note_created' || notification.notificationType === 'partner_note_updated') {
                                    router.push('/partners-overview')
                                  } else if (notification.notificationType === 'partner_invitation_accepted') {
                                    // Pass partner invitation ID to auto-select the partner
                                    const invitationId = notification.notificationMetadata?.partner_invitation_id
                                    if (invitationId) {
                                      router.push(`/my-partners?invitation=${invitationId}`)
                                    } else {
                                      router.push('/my-partners')
                                    }
                                  } else if (notification.notificationType === 'partner_project_comment') {
                                    // If title is "Partner Commented on Project", user is organization owner -> go to my-partners
                                    // If title is "New Comment on Project", user is partner -> go to partners-overview
                                    if (item.title === 'Partner Commented on Project') {
                                      const invitationId = notification.notificationMetadata?.partner_invitation_id
                                      const partnerUserId = notification.notificationMetadata?.partner_user_id
                                      if (invitationId) {
                                        router.push(`/my-partners?invitation=${invitationId}`)
                                      } else if (partnerUserId) {
                                        router.push(`/my-partners?partner=${partnerUserId}`)
                                      } else {
                                        router.push('/my-partners')
                                      }
                                    } else {
                                      router.push('/partners-overview')
                                    }
                                  }
                                }}
                                className="hover:bg-purple-500"
                              >
                                View Details
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                              <AlertDialog open={showDeleteNotificationConfirm} onOpenChange={setShowDeleteNotificationConfirm}>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      handleDeleteNotificationClick(item.id)
                                    }}
                                    onMouseDown={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    className="hover:bg-red-900/20 hover:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the notification.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => {
                                      e.stopPropagation()
                                      confirmDeleteNotification()
                                    }}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    }
                    
                    // Handle regular updates
                    return (
                      <Card 
                        key={item.id} 
                        className="hover:shadow-lg transition-shadow p-4"
                      >
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                {item.title}
                                {item.status === 'new' && (
                                  <Badge className="ml-2 bg-blue-600" variant="secondary">New</Badge>
                                )}
                              </CardTitle>
                              {item.projects && (
                                <p className="text-lg font-semibold text-purple-400 mt-1">
                                  {item.projects.name}
                                </p>
                              )}
                            </div>
                            {item.status && item.status !== 'new' && item.status !== 'upcoming' && (
                              <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                                {item.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
                          <div className="flex gap-2">
                            <Badge variant="outline">{item.category}</Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(item.date || item.created_at).toLocaleDateString()}
                            </span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 mb-4">{item.description}</p>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {item.created_by === user?.id ? 
                                  (user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U') : 
                                  (item.user_name?.split(' ').map((n: string) => n[0]).join('') || 'U')}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-medium">
                                  {item.created_by === user?.id ? user?.name || 'You' : item.user_name || 'Unknown User'}
                                </p>
                                <span className="text-xs text-gray-400">
                                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
                            <Button 
                              variant="ghost" 
                              onClick={() => router.push(`/updates/${item.id}`)}
                              className="hover:bg-purple-500"
                            >
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            {canManageUpdates && item.itemType === 'update' && (
                              <div className="flex gap-2">
                                <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="hover:bg-red-900/20 hover:text-red-400"
                                      onClick={() => handleDeleteClick(item.id)}
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
                    )
                  })}
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
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUpdates.map((update) => (
                    <Card 
                      key={update.id} 
                      className="hover:shadow-lg transition-shadow p-4"
                    >
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {update.title}
                              {update.status === 'new' && (
                                <Badge className="ml-2 bg-blue-600" variant="secondary">New</Badge>
                              )}
                            </CardTitle>
                            {update.projects && (
                              <p className="text-lg font-semibold text-purple-400 mt-1">
                                {update.projects.name}
                              </p>
                            )}
                          </div>
                          {update.status && update.status !== 'new' && update.status !== 'upcoming' && (
                            <Badge variant={update.status === 'completed' ? 'default' : 'secondary'}>
                              {update.status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
                        <div className="flex gap-2">
                          <Badge variant="outline">{update.category}</Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(update.date).toLocaleDateString()}
                          </span>
                          </div>
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
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
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
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {joinRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
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
                          
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-2">
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
            
            <TabsContent value="application-notifications">
              {loadingApplicationNotifications ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : applicationNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-gray-500 text-center">No application notifications</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {applicationNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={`hover:shadow-lg transition-shadow cursor-pointer ${
                        !notification.read ? 'ring-2 ring-blue-500/50 bg-blue-50/5' : ''
                      }`}
                      onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                    >
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <CardTitle className="flex items-center gap-2">
                            {notification.type === 'job_application' ? (
                              <Briefcase className="h-5 w-5 text-blue-500" />
                            ) : (
                              <UserPlus className="h-5 h-5 text-purple-500" />
                            )}
                            {notification.type === 'job_application' ? 'Job Application' : 'Project Role Application'}
                            {!notification.read && (
                              <Badge className="ml-2 bg-blue-600" variant="secondary">New</Badge>
                            )}
                          </CardTitle>
                          <Badge variant={notification.metadata.status === 'accepted' ? 'default' : 
                                           notification.metadata.status === 'rejected' ? 'destructive' : 'secondary'}>
                            {notification.metadata.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-lg">{notification.title}</h4>
                            <p className="text-gray-600 mt-2">{notification.content}</p>
                          </div>
                          
                          <div className="text-sm text-gray-500 space-y-1">
                            {notification.type === 'job_application' ? (
                              <>
                                <p>Position: {notification.metadata.job_title}</p>
                                <p>Company: {notification.metadata.company}</p>
                              </>
                            ) : (
                              <>
                                <p>Role: {notification.metadata.role_name}</p>
                                <p>Project: {notification.metadata.project_name}</p>
                              </>
                            )}
                            <p>Date: {new Date(notification.created_at).toLocaleString()}</p>
                          </div>
                          
                          {notification.metadata.status === 'accepted' && (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm font-medium">Congratulations! Your application was accepted.</span>
                            </div>
                          )}
                          
                          {notification.metadata.status === 'rejected' && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm font-medium">Your application was not selected this time.</span>
                            </div>
                          )}
                          
                          {notification.metadata.status === 'shortlisted' && (
                            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-sm font-medium">You've been shortlisted! Keep an eye out for next steps.</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="partner-notifications">
              {loadingPartnerNotifications ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : partnerNotifications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <p className="text-gray-500 text-center">No partner notifications</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {partnerNotifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={`hover:shadow-lg transition-shadow cursor-pointer ${
                        !notification.read ? 'ring-2 ring-purple-500/50 bg-purple-50/5' : ''
                      }`}
                      onClick={(e) => {
                        // Don't navigate if clicking on buttons or interactive elements
                        const target = e.target as HTMLElement
                        if (target.closest('button') || target.closest('[role="dialog"]') || target.closest('[role="alertdialog"]') || showDeleteNotificationConfirm) {
                          return
                        }
                        
                        if (!notification.read) {
                          markNotificationAsRead(notification.id)
                        }
                        // Navigate based on notification type
                        if (notification.type === 'partner_note_created' || notification.type === 'partner_note_updated') {
                          router.push('/partners-overview')
                        } else if (notification.type === 'partner_invitation_accepted') {
                          // Pass partner invitation ID to auto-select the partner
                          const invitationId = notification.metadata?.partner_invitation_id
                          if (invitationId) {
                            router.push(`/my-partners?invitation=${invitationId}`)
                          } else {
                            router.push('/my-partners')
                          }
                        } else if (notification.type === 'partner_project_comment') {
                          // If title is "Partner Commented on Project", user is organization owner -> go to my-partners
                          // If title is "New Comment on Project", user is partner -> go to partners-overview
                          if (notification.title === 'Partner Commented on Project') {
                            const invitationId = notification.metadata?.partner_invitation_id
                            const partnerUserId = notification.metadata?.partner_user_id
                            if (invitationId) {
                              router.push(`/my-partners?invitation=${invitationId}`)
                            } else if (partnerUserId) {
                              router.push(`/my-partners?partner=${partnerUserId}`)
                            } else {
                              router.push('/my-partners')
                            }
                          } else {
                            router.push('/partners-overview')
                          }
                        }
                      }}
                    >
                      <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <CardTitle className="flex items-center gap-2">
                            {notification.type === 'partner_invitation_accepted' ? (
                              <UserPlus className="h-5 w-5 text-green-500" />
                            ) : notification.type === 'partner_project_comment' ? (
                              <MessageSquare className="h-5 w-5 text-blue-500" />
                            ) : (
                              <FileText className="h-5 w-5 text-blue-500" />
                            )}
                            {notification.type === 'partner_invitation_accepted' 
                              ? 'Partner Invitation' 
                              : notification.type === 'partner_note_created'
                              ? 'New Partner Note'
                              : notification.type === 'partner_note_updated'
                              ? 'Partner Note Updated'
                              : 'Project Comment'}
                            {!notification.read && (
                              <Badge className="ml-2 bg-purple-600" variant="secondary">New</Badge>
                            )}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-lg">{notification.title}</h4>
                            <p className="text-gray-600 mt-2">{notification.content}</p>
                          </div>
                          
                          <div className="text-sm text-gray-500 space-y-1">
                            {notification.metadata.organization_name && (
                              <p>Organization: {notification.metadata.organization_name}</p>
                            )}
                            {notification.metadata.project_name && (
                              <p>Project: {notification.metadata.project_name}</p>
                            )}
                            {notification.metadata.note_title && (
                              <p>Note: {notification.metadata.note_title}</p>
                            )}
                            {notification.metadata.partner_name && (
                              <p>Partner: {notification.metadata.partner_name}</p>
                            )}
                            {notification.metadata.commenter_name && (
                              <p>Comment by: {notification.metadata.commenter_name}</p>
                            )}
                            {notification.metadata.comment_content && (
                              <p className="text-gray-400 italic">"{notification.metadata.comment_content}..."</p>
                            )}
                            <p>Date: {new Date(notification.created_at).toLocaleString()}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (notification.type === 'partner_note_created' || notification.type === 'partner_note_updated') {
                                  router.push('/partners-overview')
                                } else if (notification.type === 'partner_invitation_accepted') {
                                  // Pass partner invitation ID to auto-select the partner
                                  const invitationId = notification.metadata?.partner_invitation_id
                                  if (invitationId) {
                                    router.push(`/my-partners?invitation=${invitationId}`)
                                  } else {
                                    router.push('/my-partners')
                                  }
                                } else if (notification.type === 'partner_project_comment') {
                                  // If title is "Partner Commented on Project", user is organization owner -> go to my-partners
                                  // If title is "New Comment on Project", user is partner -> go to partners-overview
                                  if (notification.title === 'Partner Commented on Project') {
                                    const invitationId = notification.metadata?.partner_invitation_id
                                    const partnerUserId = notification.metadata?.partner_user_id
                                    if (invitationId) {
                                      router.push(`/my-partners?invitation=${invitationId}`)
                                    } else if (partnerUserId) {
                                      router.push(`/my-partners?partner=${partnerUserId}`)
                                    } else {
                                      router.push('/my-partners')
                                    }
                                  } else {
                                    router.push('/partners-overview')
                                  }
                                }
                              }}
                            >
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                            <AlertDialog open={showDeleteNotificationConfirm} onOpenChange={setShowDeleteNotificationConfirm}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleDeleteNotificationClick(notification.id)
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                  className="hover:bg-red-900/20 hover:text-red-400"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the notification.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={(e) => {
                                    e.stopPropagation()
                                    confirmDeleteNotification()
                                  }}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
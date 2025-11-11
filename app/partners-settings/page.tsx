"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Building2,
  Plus,
  Copy,
  Key,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  Info,
  CheckCircle,
  XCircle,
  Pencil,
  RefreshCw,
  FolderKanban,
  Wallet,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Textarea } from "@/components/ui/textarea"

interface Organization {
  id: string
  name: string
  owner_id: string
}

interface PartnerInvitation {
  id: string
  organization_id: string
  invitation_key: string
  email?: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at?: string
  created_at: string
  invited_by: string
}

interface PartnerAccess {
  id: string
  project_id: string
  partner_invitation_id: string
  projects: {
    id: string
    name: string
  }
}

interface PartnerSettings {
  id: string
  organization_id: string
  partner_invitation_id: string
  can_see_updates: boolean
  can_see_project_info: boolean
  can_see_dates: boolean
  can_see_expenses: boolean
  can_see_progress: boolean
  can_see_team_members: boolean
  can_see_budget: boolean
  can_see_funding: boolean
}

interface Project {
  id: string
  name: string
  organization_id?: string
}

interface ProjectComment {
  id: string
  project_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  user: {
    id: string
    name: string | null
    email: string
    avatar_url: string | null
  }
  project?: {
    id: string
    name: string
  }
}

export default function PartnersSettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([])
  const [partnerSettings, setPartnerSettings] = useState<Record<string, PartnerSettings>>({})
  const [partnerAccess, setPartnerAccess] = useState<Record<string, PartnerAccess[]>>({})
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false)
  const [selectedInvitation, setSelectedInvitation] = useState<PartnerInvitation | null>(null)
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    expires_in_days: '30',
  })
  const [editingSettings, setEditingSettings] = useState<PartnerSettings | null>(null)
  const [editingExpiration, setEditingExpiration] = useState<PartnerInvitation | null>(null)
  const [newExpiration, setNewExpiration] = useState<string>('')
  const [isExpirationDialogOpen, setIsExpirationDialogOpen] = useState(false)
  const [projectComments, setProjectComments] = useState<Record<string, ProjectComment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [enhancingComment, setEnhancingComment] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (user && !authLoading) {
      fetchOrganizations()
    }
  }, [user, authLoading])

  const fetchCommentsForInvitation = useCallback(async (invitationId: string, access: PartnerAccess[]) => {
    if (!access || access.length === 0) return

    setLoadingComments(prev => ({ ...prev, [invitationId]: true }))
    try {
      const projectIds = access.map(a => a.project_id).filter((id): id is string => !!id)
      
      if (projectIds.length === 0) {
        setProjectComments(prev => ({ ...prev, [invitationId]: [] }))
        return
      }

      // Fetch comments for all projects (get newest first, then reverse to show oldest first with newest near input)
      const { data: commentsData, error: commentsError } = await supabase
        .from('project_comments')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(20)

      if (commentsError) throw commentsError

      // Fetch user details for each comment
      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))]
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', userIds)

        if (usersError) {
          console.warn('Could not fetch user details:', usersError.message)
        }

        // Create a map of project IDs to project names
        const projectMap = new Map(access.map(a => [a.project_id, a.projects?.name || 'Unknown Project']))

        const commentsWithUsers: ProjectComment[] = commentsData.map((comment) => {
          const userDetail = usersData?.find(u => u.id === comment.user_id)
          return {
            ...comment,
            user: userDetail || {
              id: comment.user_id,
              name: 'Unknown User',
              email: 'Unknown',
              avatar_url: null
            },
            project: {
              id: comment.project_id,
              name: projectMap.get(comment.project_id) || 'Unknown Project'
            }
          }
        })

        // Reverse to show oldest first (newest near input)
        const reversedComments = commentsWithUsers.reverse()

        setProjectComments(prev => ({ ...prev, [invitationId]: reversedComments }))
      } else {
        setProjectComments(prev => ({ ...prev, [invitationId]: [] }))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(prev => ({ ...prev, [invitationId]: false }))
    }
  }, [])

  useEffect(() => {
    if (selectedOrg) {
      fetchInvitations()
      fetchProjects()
    }
  }, [selectedOrg])

  // Fetch comments when partnerAccess is updated
  useEffect(() => {
    if (invitations.length > 0 && Object.keys(partnerAccess).length > 0) {
      invitations.forEach((invitation) => {
        const access = partnerAccess[invitation.id] || []
        if (access.length > 0) {
          fetchCommentsForInvitation(invitation.id, access)
        }
      })
    }
  }, [invitations.length, partnerAccess, fetchCommentsForInvitation])

  const fetchOrganizations = async () => {
    if (!user?.id) return
    
    try {
      console.log('🔍 DEBUG: fetchOrganizations called', { userId: user.id, userEmail: user.email })
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .order('name')

      console.log('🔍 DEBUG: Organizations fetch result:', {
        dataCount: data?.length,
        error: error ? {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        } : null,
        organizations: data?.map(o => ({ id: o.id, name: o.name }))
      })

      if (error) throw error
      setOrganizations(data || [])
      if (data && data.length > 0) {
        console.log('🔍 DEBUG: Setting selected org to:', data[0].id)
        setSelectedOrg(data[0].id)
      }
    } catch (error: any) {
      console.error('🔍 DEBUG: Error fetching organizations - FULL ERROR:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    if (!selectedOrg) return
    
    try {
      console.log('🔍 DEBUG: fetchInvitations called', {
        selectedOrg,
        userId: user?.id,
        userEmail: user?.email
      })

      // First, let's check if we can query organizations directly
      console.log('🔍 DEBUG: Checking organization access...')
      const { data: orgCheck, error: orgError } = await supabase
        .from('organizations')
        .select('id, owner_id')
        .eq('id', selectedOrg)
        .single()
      
      console.log('🔍 DEBUG: Organization check result:', { orgCheck, orgError })
      
      if (orgCheck) {
        console.log('🔍 DEBUG: Is user owner?', orgCheck.owner_id === user?.id)
      }

      console.log('🔍 DEBUG: Attempting to fetch partner_invitations...')
      console.log('🔍 DEBUG: Query details:', {
        table: 'partner_invitations',
        filter: { organization_id: selectedOrg },
        userId: user?.id
      })
      
      // Try a simpler query first to see if it's the filter causing issues
      console.log('🔍 DEBUG: Trying simple SELECT without filter first...')
      const { data: testData, error: testError } = await supabase
        .from('partner_invitations')
        .select('id')
        .limit(1)
      
      console.log('🔍 DEBUG: Simple query result:', {
        hasData: !!testData,
        dataCount: testData?.length,
        error: testError ? {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint
        } : null
      })
      
      if (testError) {
        console.error('🔍 DEBUG: Simple query failed, this is the base issue:', testError)
      }
      
      console.log('🔍 DEBUG: Now trying with filter...')
      const { data, error } = await supabase
        .from('partner_invitations')
        .select('*')
        .eq('organization_id', selectedOrg)
        .order('created_at', { ascending: false })

      console.log('🔍 DEBUG: partner_invitations query result:', {
        dataCount: data?.length,
        error: error ? {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        } : null,
        hasData: !!data
      })

      if (error) {
        console.error('🔍 DEBUG: Full error object:', error)
        throw error
      }
      setInvitations(data || [])

      // Fetch settings for each invitation
      if (data && data.length > 0) {
        console.log('🔍 DEBUG: Fetching settings for', data.length, 'invitations')
        const settingsPromises = data.map(inv => {
          console.log('🔍 DEBUG: Fetching settings for invitation', inv.id)
          return supabase
            .from('organization_partner_settings')
            .select('*')
            .eq('partner_invitation_id', inv.id)
            .single()
        })
        
        const settingsResults = await Promise.all(settingsPromises)
        console.log('🔍 DEBUG: Settings fetch results:', settingsResults.map(r => ({
          hasError: !!r.error,
          error: r.error ? { code: r.error.code, message: r.error.message } : null,
          hasData: !!r.data
        })))
        
        const settingsMap: Record<string, PartnerSettings> = {}
        
        settingsResults.forEach((result, index) => {
          if (!result.error && result.data) {
            settingsMap[data[index].id] = result.data as PartnerSettings
          } else if (result.error) {
            console.error('🔍 DEBUG: Error fetching settings for invitation', data[index].id, ':', result.error)
          }
        })
        
        console.log('🔍 DEBUG: Final settings map:', Object.keys(settingsMap))
        setPartnerSettings(settingsMap)
      }

      // Fetch partner access (projects) for each invitation
      if (data && data.length > 0) {
        const accessPromises = data.map(inv => {
          return supabase
            .from('partner_access')
            .select(`
              *,
              projects (
                id,
                name
              )
            `)
            .eq('partner_invitation_id', inv.id)
        })
        
        const accessResults = await Promise.all(accessPromises)
        const accessMap: Record<string, PartnerAccess[]> = {}
        
        accessResults.forEach((result, index) => {
          if (!result.error && result.data) {
            accessMap[data[index].id] = result.data as PartnerAccess[]
          }
        })
        
        setPartnerAccess(accessMap)
      }
    } catch (error: any) {
      console.error('🔍 DEBUG: Error fetching invitations - FULL ERROR:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
        fullError: error
      })
      toast.error(`Failed to load invitations: ${error?.message || 'Unknown error'}`)
    }
  }

  const fetchProjects = async () => {
    if (!selectedOrg) return
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, organization_id')
        .eq('organization_id', selectedOrg)
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (error: any) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    }
  }

  const handleCreateInvitation = async () => {
    if (!selectedOrg || !user?.id) return

    try {
      // Generate invitation key
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_partner_invitation_key')

      if (keyError) throw keyError

      const invitationKey = keyData as string

      // Calculate expiration date (null if "never")
      let expiresAt: Date | null = null
      if (newInvitation.expires_in_days !== 'never') {
        expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + parseInt(newInvitation.expires_in_days))
      }
      
      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('partner_invitations')
        .insert({
          organization_id: selectedOrg,
          invitation_key: invitationKey,
          email: newInvitation.email || null,
          invited_by: user.id,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          status: 'pending'
        })
        .select()
        .single()

      if (inviteError) throw inviteError

      // Create default settings (all off by default for security)
      const { error: settingsError } = await supabase
        .from('organization_partner_settings')
        .insert({
          organization_id: selectedOrg,
          partner_invitation_id: invitation.id,
          can_see_updates: false,
          can_see_project_info: false,
          can_see_dates: false,
          can_see_expenses: false,
          can_see_progress: false,
          can_see_team_members: false,
          can_see_budget: false,
          can_see_funding: false,
        })

      if (settingsError) throw settingsError

      // Create access for selected projects
      if (selectedProjects.length > 0) {
        const accessRecords = selectedProjects.map(projectId => ({
          partner_invitation_id: invitation.id,
          project_id: projectId
        }))

        const { error: accessError } = await supabase
          .from('partner_access')
          .insert(accessRecords)

        if (accessError) throw accessError
      }

      toast.success('Invitation created successfully!')
      setIsCreateDialogOpen(false)
      setNewInvitation({ email: '', expires_in_days: '30' })
      setSelectedProjects([])
      fetchInvitations()
    } catch (error: any) {
      console.error('Error creating invitation:', error)
      toast.error(error.message || 'Failed to create invitation')
    }
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('Invitation key copied to clipboard!')
  }

  const handleRegenerateKey = async (invitationId: string) => {
    if (!confirm('Are you sure you want to generate a new key? The old key will no longer work.')) {
      return
    }

    try {
      // Generate new invitation key
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_partner_invitation_key')

      if (keyError) throw keyError

      const newKey = keyData as string

      // Update invitation with new key
      const { error: updateError } = await supabase
        .from('partner_invitations')
        .update({ 
          invitation_key: newKey,
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (updateError) throw updateError

      toast.success('New invitation key generated!')
      fetchInvitations()
    } catch (error: any) {
      console.error('Error regenerating key:', error)
      toast.error(error.message || 'Failed to regenerate key')
    }
  }

  const handleDeleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation? This will revoke partner access.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('partner_invitations')
        .update({ status: 'revoked' })
        .eq('id', invitationId)

      if (error) throw error

      toast.success('Invitation revoked')
      fetchInvitations()
    } catch (error: any) {
      console.error('Error deleting invitation:', error)
      toast.error('Failed to revoke invitation')
    }
  }

  const handleOpenExpirationEdit = (invitation: PartnerInvitation) => {
    setEditingExpiration(invitation)
    if (invitation.expires_at) {
      // Convert to YYYY-MM-DD format for date input
      const date = new Date(invitation.expires_at)
      setNewExpiration(date.toISOString().split('T')[0])
    } else {
      setNewExpiration('never')
    }
    setIsExpirationDialogOpen(true)
  }

  const handleSaveExpiration = async () => {
    if (!editingExpiration) return

    try {
      let expiresAt: string | null = null
      if (newExpiration !== 'never') {
        const date = new Date(newExpiration)
        date.setHours(23, 59, 59, 999)
        expiresAt = date.toISOString()
      }

      const { error } = await supabase
        .from('partner_invitations')
        .update({ 
          expires_at: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingExpiration.id)

      if (error) throw error

      toast.success('Expiration date updated successfully!')
      setIsExpirationDialogOpen(false)
      setEditingExpiration(null)
      fetchInvitations()
    } catch (error: any) {
      console.error('Error updating expiration:', error)
      toast.error('Failed to update expiration date')
    }
  }

  const handleOpenSettings = (invitation: PartnerInvitation) => {
    setSelectedInvitation(invitation)
    const settings = partnerSettings[invitation.id]
    if (settings) {
      setEditingSettings({ ...settings })
    } else {
      // Create default settings if they don't exist (all off by default for security)
      setEditingSettings({
        id: '',
        organization_id: selectedOrg!,
        partner_invitation_id: invitation.id,
        can_see_updates: false,
        can_see_project_info: false,
        can_see_dates: false,
        can_see_expenses: false,
        can_see_progress: false,
        can_see_team_members: false,
        can_see_budget: false,
        can_see_funding: false,
      })
    }
    setIsSettingsDialogOpen(true)
  }

  const handleSaveSettings = async () => {
    if (!editingSettings || !selectedOrg) return

    try {
      if (editingSettings.id) {
        // Update existing
        const { error } = await supabase
          .from('organization_partner_settings')
          .update(editingSettings)
          .eq('id', editingSettings.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('organization_partner_settings')
          .insert(editingSettings)

        if (error) throw error
      }

      toast.success('Settings saved successfully!')
      setIsSettingsDialogOpen(false)
      fetchInvitations()
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    }
  }

  const handleAddProjects = async (invitationId: string) => {
    if (selectedProjects.length === 0) {
      toast.error('Please select at least one project')
      return
    }

    try {
      // Check existing access
      const { data: existing } = await supabase
        .from('partner_access')
        .select('project_id')
        .eq('partner_invitation_id', invitationId)

      const existingIds = existing?.map(e => e.project_id) || []
      const newProjects = selectedProjects.filter(id => !existingIds.includes(id))

      if (newProjects.length === 0) {
        toast.info('All selected projects are already assigned')
        return
      }

      const accessRecords = newProjects.map(projectId => ({
        partner_invitation_id: invitationId,
        project_id: projectId
      }))

      const { error } = await supabase
        .from('partner_access')
        .insert(accessRecords)

      if (error) throw error

      toast.success('Projects added successfully!')
      setSelectedProjects([])
      fetchInvitations()
    } catch (error: any) {
      console.error('Error adding projects:', error)
      toast.error('Failed to add projects')
    }
  }

  const handleRemoveProject = async (invitationId: string, projectId: string) => {
    try {
      const { error } = await supabase
        .from('partner_access')
        .delete()
        .eq('partner_invitation_id', invitationId)
        .eq('project_id', projectId)

      if (error) throw error

      toast.success('Project removed successfully!')
      fetchInvitations()
    } catch (error: any) {
      console.error('Error removing project:', error)
      toast.error('Failed to remove project')
    }
  }

  const handleAddComment = async (projectId: string, invitationId: string) => {
    if (!user?.id || !newComment[projectId]?.trim()) return

    const commentContent = newComment[projectId].trim()
    const tempId = `temp-${Date.now()}`
    const access = partnerAccess[invitationId] || []
    const projectMap = new Map(access.map(a => [a.project_id, a.projects?.name || 'Unknown Project']))
    
    // Optimistically add comment to state
    const optimisticComment: ProjectComment = {
      id: tempId,
      project_id: projectId,
      user_id: user.id,
      content: commentContent,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name || null,
        email: user.email || '',
        avatar_url: user.avatar_url || null
      },
      project: {
        id: projectId,
        name: projectMap.get(projectId) || 'Unknown Project'
      }
    }

    setProjectComments(prev => ({
      ...prev,
      [invitationId]: [...(prev[invitationId] || []), optimisticComment]
    }))
    setNewComment(prev => ({ ...prev, [projectId]: '' }))

    try {
      const { data, error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          user_id: user.id,
          content: commentContent
        })
        .select()
        .single()

      if (error) throw error

      // Replace optimistic comment with real one
      if (data) {
        const realComment: ProjectComment = {
          ...data,
          user: optimisticComment.user,
          project: optimisticComment.project
        }
        setProjectComments(prev => ({
          ...prev,
          [invitationId]: (prev[invitationId] || []).map(c => c.id === tempId ? realComment : c)
        }))
      }

      toast.success('Comment added successfully')
    } catch (error: any) {
      // Revert optimistic update on error
      setProjectComments(prev => ({
        ...prev,
        [invitationId]: (prev[invitationId] || []).filter(c => c.id !== tempId)
      }))
      setNewComment(prev => ({ ...prev, [projectId]: commentContent }))
      console.error('Error adding comment:', error)
      toast.error(error.message || 'Failed to add comment')
    }
  }

  const handleDeleteComment = async (commentId: string, invitationId: string) => {
    if (!user?.id) return

    // Find the comment to restore if deletion fails
    const commentToDelete = projectComments[invitationId]?.find(c => c.id === commentId)
    
    // Optimistically remove comment from state
    setProjectComments(prev => ({
      ...prev,
      [invitationId]: (prev[invitationId] || []).filter(c => c.id !== commentId)
    }))

    try {
      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error

      toast.success('Comment deleted successfully')
    } catch (error: any) {
      // Revert optimistic update on error
      if (commentToDelete) {
        setProjectComments(prev => ({
          ...prev,
          [invitationId]: [...(prev[invitationId] || []), commentToDelete]
        }))
      }
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const handleEnhanceComment = async (projectId: string) => {
    const currentMessage = newComment[projectId]?.trim()
    if (!currentMessage) {
      toast.error('Please enter a message to enhance')
      return
    }

    setEnhancingComment(prev => ({ ...prev, [projectId]: true }))
    try {
      const response = await fetch('/api/enhance-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentMessage })
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Enhancement failed')
      }

      const data = await response.json()
      setNewComment(prev => ({ ...prev, [projectId]: data.message }))
      toast.success('Comment enhanced with AI')
    } catch (error: any) {
      console.error('Comment enhancement error:', error)
      toast.error(error?.message || 'Failed to enhance comment')
    } finally {
      setEnhancingComment(prev => ({ ...prev, [projectId]: false }))
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 shadow-xl">
            <CardContent className="py-16 text-center">
              <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Organizations</h3>
              <p className="text-gray-400">You don't own any organizations. Create an organization first to manage partners.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center md:text-left">
          <div className="inline-block mb-3">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
              Partner Settings
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto md:mx-0"></div>
          </div>
          <p className="text-gray-300 mt-3">Manage partner invitations and control what they can see</p>
        </div>

        {/* Organization Selector */}
        <Card className="mb-6 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-white font-bold flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
              Select Organization
            </CardTitle>
            <CardDescription className="text-gray-300 mt-2">
              Choose an organization to manage partner invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedOrg || ''} onValueChange={setSelectedOrg}>
              <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white h-12 hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id} className="text-white focus:bg-purple-500/20 focus:text-purple-200 cursor-pointer">
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Create Invitation Section */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Partner Invitations</h2>
            <p className="text-gray-400 text-sm mt-1">Create and manage partner access invitations</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-button h-12 px-6">
                <Plus className="w-4 h-4 mr-2" />
                Create Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white text-2xl flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Key className="w-5 h-5 text-purple-400" />
                  </div>
                  Create Partner Invitation
                </DialogTitle>
                <DialogDescription className="text-gray-300 mt-2">
                  Generate an invitation key for partners to access your organization's projects
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div>
                  <Label className="text-white font-medium flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" />
                    Email (Optional)
                  </Label>
                  <Input
                    value={newInvitation.email}
                    onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                    placeholder="partner@example.com"
                    className="bg-gray-900/50 border-gray-700 text-white mt-2 h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
                <div>
                  <Label className="text-white font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Expires In
                  </Label>
                  <Select
                    value={newInvitation.expires_in_days}
                    onValueChange={(value) => setNewInvitation({ ...newInvitation, expires_in_days: value })}
                  >
                    <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white mt-2 h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="never" className="text-white focus:bg-purple-500/20">No expiration</SelectItem>
                      <SelectItem value="7" className="text-white focus:bg-purple-500/20">7 days</SelectItem>
                      <SelectItem value="30" className="text-white focus:bg-purple-500/20">30 days</SelectItem>
                      <SelectItem value="60" className="text-white focus:bg-purple-500/20">60 days</SelectItem>
                      <SelectItem value="90" className="text-white focus:bg-purple-500/20">90 days</SelectItem>
                      <SelectItem value="365" className="text-white focus:bg-purple-500/20">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white font-medium flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-gray-400" />
                    Projects (Select projects to grant access)
                  </Label>
                  <div className="mt-2 p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-2 max-h-48 overflow-y-auto">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-3 p-2 hover:bg-gray-800/50 rounded transition-colors">
                        <input
                          type="checkbox"
                          id={`project-${project.id}`}
                          checked={selectedProjects.includes(project.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects([...selectedProjects, project.id])
                            } else {
                              setSelectedProjects(selectedProjects.filter(id => id !== project.id))
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                        />
                        <Label htmlFor={`project-${project.id}`} className="text-white cursor-pointer flex-1">
                          {project.name}
                        </Label>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-gray-400 text-sm text-center py-4">No projects available. Create projects first.</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-gray-700">Cancel</Button>
                <Button onClick={handleCreateInvitation} className="gradient-button">Create Invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Invitations List */}
        <div className="space-y-4">
          {invitations.map((invitation) => {
            const settings = partnerSettings[invitation.id]
            const access = partnerAccess[invitation.id] || []
            const assignedProjects = access
              .map(a => a.projects)
              .filter((p): p is { id: string; name: string } => p !== null && typeof p === 'object' && 'name' in p)
            const isExpired = invitation.expires_at ? new Date(invitation.expires_at) < new Date() : false
            const statusColor = 
              invitation.status === 'accepted' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
              invitation.status === 'revoked' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
              isExpired ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' :
              'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'

            return (
              <div key={invitation.id} className="space-y-4">
              <Card className="bg-[#141414] border border-black shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="border-b border-black">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-white text-xl flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Key className="w-5 h-5 text-purple-400" />
                        </div>
                        {invitation.email || 'Partner Invitation'}
                      </CardTitle>
                      <CardDescription className="text-gray-300 mt-3 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm flex-wrap">
                          <div className="flex items-center gap-2 p-2 bg-black rounded-lg border border-black flex-1 min-w-0">
                            <span className="text-gray-400 whitespace-nowrap">Key:</span>
                            <code className="bg-black px-2 py-1 rounded text-purple-300 font-mono text-xs truncate flex-1">{invitation.invitation_key}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-purple-400 hover:bg-purple-500/20 flex-shrink-0"
                              onClick={() => handleCopyKey(invitation.invitation_key)}
                              title="Copy Key"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-purple-400 hover:bg-purple-500/20 flex-shrink-0"
                              onClick={() => handleRegenerateKey(invitation.id)}
                              title="Generate New Key"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            {invitation.expires_at ? (
                              <span>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                            ) : (
                              <span>Never expires</span>
                            )}
                          </div>
                        </div>
                        {assignedProjects.length > 0 && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <FolderKanban className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-500">Projects:</span>
                            {assignedProjects.map((project) => (
                              <Badge key={project.id} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs flex items-center gap-1">
                                {project.name}
                                <button
                                  onClick={() => handleRemoveProject(invitation.id, project.id)}
                                  className="ml-1 hover:text-red-400 transition-colors"
                                  title="Remove project"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={`${statusColor} px-4 py-2 text-sm font-semibold`}>
                      {invitation.status === 'accepted' ? 'Accepted' :
                       invitation.status === 'revoked' ? 'Revoked' :
                       isExpired ? 'Expired' : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyKey(invitation.invitation_key)}
                      className="border-black hover:border-purple-500/50 hover:bg-purple-500/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Key
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSettings(invitation)}
                      className="border-black hover:border-purple-500/50 hover:bg-purple-500/10"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Visibility Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenExpirationEdit(invitation)}
                      className="border-black hover:border-purple-500/50 hover:bg-purple-500/10"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Expiration
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-black hover:border-purple-500/50 hover:bg-purple-500/10">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Projects
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add Projects to Invitation</DialogTitle>
                        </DialogHeader>
                        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-2 max-h-64 overflow-y-auto mt-4">
                          {projects.map((project) => (
                            <div key={project.id} className="flex items-center space-x-3 p-2 hover:bg-gray-800/50 rounded transition-colors">
                              <input
                                type="checkbox"
                                id={`add-project-${project.id}`}
                                checked={selectedProjects.includes(project.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProjects([...selectedProjects, project.id])
                                  } else {
                                    setSelectedProjects(selectedProjects.filter(id => id !== project.id))
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                              />
                              <Label htmlFor={`add-project-${project.id}`} className="text-white cursor-pointer flex-1">
                                {project.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => handleAddProjects(invitation.id)}
                            className="gradient-button"
                          >
                            Add Projects
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteInvitation(invitation.id)}
                      className="hover:bg-red-600/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  </div>

                  {/* Quick Visibility Summary */}
                  {settings && (
                    <div className="mt-6 pt-4 border-t border-black">
                      <p className="text-sm text-gray-400 mb-3 font-medium">Visibility Settings:</p>
                      <div className="flex flex-wrap gap-2">
                        {settings.can_see_updates && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Updates</Badge>}
                        {settings.can_see_project_info && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Info</Badge>}
                        {settings.can_see_dates && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Dates</Badge>}
                        {settings.can_see_expenses && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Expenses</Badge>}
                        {settings.can_see_progress && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Progress</Badge>}
                        {settings.can_see_budget && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Budget</Badge>}
                        {settings.can_see_funding && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Funding</Badge>}
                        {settings.can_see_team_members && <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Team</Badge>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Project Comments Card - Separate Card */}
              {settings?.can_see_updates && assignedProjects.length > 0 && (
                <Card className="bg-[#141414] border border-black shadow-xl">
                  <CardHeader className="border-b border-black">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedComments(prev => ({ ...prev, [invitation.id]: !(prev[invitation.id] ?? true) }))}
                    >
                      <CardTitle className="text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                        </div>
                        Project Comments
                        {projectComments[invitation.id] && projectComments[invitation.id].length > 0 && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                            {projectComments[invitation.id].length}
                          </Badge>
                        )}
                      </CardTitle>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedComments(prev => ({ ...prev, [invitation.id]: !(prev[invitation.id] ?? true) }))
                        }}
                        className="p-1 hover:bg-black/50 rounded transition-colors"
                        aria-label={(expandedComments[invitation.id] ?? true) ? "Collapse" : "Expand"}
                      >
                        {(expandedComments[invitation.id] ?? true) ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </CardHeader>
                  
                  {(expandedComments[invitation.id] ?? true) && (
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {loadingComments[invitation.id] ? (
                          <div className="flex justify-center py-8">
                            <LoadingSpinner />
                          </div>
                        ) : (
                          <>
                            {/* Comments List */}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {projectComments[invitation.id]?.length > 0 ? (
                                projectComments[invitation.id].map((comment) => (
                                  <div 
                                    key={comment.id} 
                                    className="p-4 bg-black rounded-lg border border-black hover:bg-[#0a0a0a] transition-all duration-300"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                                        {comment.user.avatar_url ? (
                                          <img 
                                            src={comment.user.avatar_url} 
                                            alt={comment.user.name || 'User'} 
                                            className="w-8 h-8 rounded-full"
                                          />
                                        ) : (
                                          <span className="text-purple-400 font-semibold text-xs">
                                            {(comment.user.name || comment.user.email || 'U')[0].toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                          <p className="text-white font-semibold text-sm">
                                            {comment.user.name || 'Unknown User'}
                                          </p>
                                          {comment.project && (
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                                              {comment.project.name}
                                            </Badge>
                                          )}
                                          <span className="text-gray-500 text-xs">
                                            {formatDate(comment.created_at)}
                                          </span>
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                          {comment.content}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteComment(comment.id, invitation.id)}
                                        className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-gray-400 hover:text-red-400 flex-shrink-0"
                                        title="Delete comment"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8">
                                  <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                  <p className="text-gray-400">No comments yet</p>
                                  <p className="text-gray-500 text-sm mt-1">Comments from partners will appear here</p>
                                </div>
                              )}
                            </div>

                            {/* Add Comment Forms for each project */}
                            {assignedProjects.map((project) => (
                              <div key={project.id} className="pt-3 border-t border-black/50">
                                <div className="mb-2">
                                  <Label className="text-gray-400 text-xs font-medium">Reply to {project.name}</Label>
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1 relative">
                                    <Input
                                      placeholder={`Add a comment on ${project.name}...`}
                                      value={newComment[project.id] || ''}
                                      onChange={(e) => setNewComment(prev => ({ ...prev, [project.id]: e.target.value }))}
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                                          e.preventDefault()
                                          handleAddComment(project.id, invitation.id)
                                        }
                                      }}
                                      className="bg-black border-black text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 text-sm pr-10"
                                    />
                                    {newComment[project.id]?.trim() && (
                                      <button
                                        type="button"
                                        onClick={() => handleEnhanceComment(project.id)}
                                        disabled={enhancingComment[project.id]}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-purple-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Enhance with AI"
                                      >
                                        {enhancingComment[project.id] ? (
                                          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                        ) : (
                                          <Sparkles className="w-4 h-4 text-purple-400" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  <Button
                                    onClick={() => handleAddComment(project.id, invitation.id)}
                                    disabled={!newComment[project.id]?.trim() || enhancingComment[project.id]}
                                    className="gradient-button px-4"
                                    size="sm"
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}
              </div>
            )
          })}

          {invitations.length === 0 && (
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 shadow-xl">
              <CardContent className="py-16 text-center">
                <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Invitations</h3>
                <p className="text-gray-400">No partner invitations yet. Create one to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Dialog */}
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className="bg-[#141414] border-black max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-400" />
                </div>
                Visibility Settings
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-2">
                Control what partners can see for this invitation
              </DialogDescription>
            </DialogHeader>
            {editingSettings && (
              <div className="space-y-4 mt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-black hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Info className="w-5 h-5 text-blue-400" />
                      </div>
                      <Label className="text-white font-medium">Project Information</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_project_info}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_project_info: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-black hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <FileText className="w-5 h-5 text-green-400" />
                      </div>
                      <Label className="text-white font-medium">Updates</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_updates}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_updates: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-black hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Calendar className="w-5 h-5 text-purple-400" />
                      </div>
                      <Label className="text-white font-medium">Dates & Deadlines</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_dates}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_dates: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-black hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-yellow-400" />
                      </div>
                      <Label className="text-white font-medium">Expenses</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_expenses}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_expenses: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-black hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <Label className="text-white font-medium">Progress</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_progress}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_progress: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-black hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-blue-400" />
                      </div>
                      <Label className="text-white font-medium">Budget</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_budget}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_budget: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-black hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Wallet className="w-5 h-5 text-purple-400" />
                      </div>
                      <Label className="text-white font-medium">Investment / Funding</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_funding}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_funding: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-black hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-indigo-400" />
                      </div>
                      <Label className="text-white font-medium">Team Members</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_team_members}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_team_members: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)} className="border-black">Cancel</Button>
              <Button onClick={handleSaveSettings} className="gradient-button">Save Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Expiration Dialog */}
        <Dialog open={isExpirationDialogOpen} onOpenChange={setIsExpirationDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white text-2xl flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-400" />
                </div>
                Edit Expiration Date
              </DialogTitle>
              <DialogDescription className="text-gray-300 mt-2">
                Update when this invitation expires, or set it to never expire
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-6">
              <div>
                <Label className="text-white font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Expiration
                </Label>
                <Select
                  value={newExpiration === 'never' ? 'never' : newExpiration ? 'date' : 'never'}
                  onValueChange={(value) => {
                    if (value === 'never') {
                      setNewExpiration('never')
                    } else {
                      // Keep current date or set to today
                      if (newExpiration && newExpiration !== 'never') {
                        // Keep it
                      } else {
                        const today = new Date()
                        today.setDate(today.getDate() + 30)
                        setNewExpiration(today.toISOString().split('T')[0])
                      }
                    }
                  }}
                >
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white mt-2 h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="never" className="text-white focus:bg-purple-500/20">No expiration</SelectItem>
                    <SelectItem value="date" className="text-white focus:bg-purple-500/20">Set specific date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newExpiration !== 'never' && (
                <div>
                  <Label className="text-white font-medium">Expiration Date</Label>
                  <Input
                    type="date"
                    value={newExpiration && newExpiration !== 'never' ? newExpiration : ''}
                    onChange={(e) => setNewExpiration(e.target.value)}
                    className="bg-gray-900/50 border-gray-700 text-white mt-2 h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsExpirationDialogOpen(false)} className="border-gray-700">Cancel</Button>
              <Button onClick={handleSaveExpiration} className="gradient-button">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


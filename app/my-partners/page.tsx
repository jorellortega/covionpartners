"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Textarea } from "@/components/ui/textarea"
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
  Calendar,
  Building2,
  Users,
  Mail,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  User,
  Trash2,
  Pencil,
  X,
  Check,
  FileText,
  Plus,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Search,
  Sparkles,
  Loader2,
  Settings,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Organization {
  id: string
  name: string
  owner_id: string
}

interface PartnerUser {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
}

interface PartnerAccess {
  id: string
  project_id: string
  user_id: string
  partner_invitation_id: string
  projects: {
    id: string
    name: string
    description?: string
    status: string
  }
  partner_invitations: {
    id: string
    organization_id: string
    email?: string
    status: string
    created_at: string
    organizations: {
      id: string
      name: string
    }
  }
}

interface PartnerInfo {
  user: PartnerUser
  access: PartnerAccess[]
  invitationId: string
  organizationName: string
  organizationId?: string
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
}

interface PublicProject {
  id: string
  name: string
  description?: string
  status: string
  progress?: number
  visibility: string
  project_key?: string | null
}

interface PartnerNote {
  id: string
  partner_invitation_id: string
  project_id?: string
  title: string
  content: string
  content_type: string
  linked_project_ids?: string[]
  attachments?: Array<{
    type: string
    url: string
    name: string
  }>
  created_by: string
  created_at: string
  updated_at: string
  linked_projects?: PublicProject[]
}

function MyPartnersContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [partners, setPartners] = useState<PartnerInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPartner, setSelectedPartner] = useState<PartnerInfo | null>(null)
  const [projectComments, setProjectComments] = useState<Record<string, ProjectComment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [editingComment, setEditingComment] = useState<Record<string, string>>({})
  const [editCommentContent, setEditCommentContent] = useState<Record<string, string>>({})
  const [partnerNotes, setPartnerNotes] = useState<Record<string, PartnerNote[]>>({})
  const [loadingNotes, setLoadingNotes] = useState<Record<string, boolean>>({})
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    project_id: 'none',
    linked_project_ids: [] as string[],
  })
  const [editNote, setEditNote] = useState({
    title: '',
    content: '',
    project_id: 'none',
    linked_project_ids: [] as string[],
  })
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([])
  const [loadingPublicProjects, setLoadingPublicProjects] = useState(false)
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [isUpdatingNote, setIsUpdatingNote] = useState(false)
  const [isEnhancingNote, setIsEnhancingNote] = useState(false)
  const [enhancingComment, setEnhancingComment] = useState<Record<string, boolean>>({})
  const [projectSearchQuery, setProjectSearchQuery] = useState('')

  useEffect(() => {
    if (user && !authLoading) {
      fetchOrganizations()
    }
  }, [user, authLoading])

  const fetchProjectComments = useCallback(async (projectId: string) => {
    setLoadingComments(prev => ({ ...prev, [projectId]: true }))
    try {
      const { data: commentsData, error: commentsError } = await supabase
        .from('project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (commentsError) throw commentsError

      if (commentsData && commentsData.length > 0) {
        const userIds = [...new Set(commentsData.map(c => c.user_id))]
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url')
          .in('id', userIds)

        if (usersError) {
          console.warn('Could not fetch user details:', usersError.message)
        }

        const commentsWithUsers: ProjectComment[] = commentsData.map((comment) => {
          const userDetail = usersData?.find(u => u.id === comment.user_id)
          return {
            ...comment,
            user: userDetail || {
              id: comment.user_id,
              name: 'Unknown User',
              email: 'Unknown',
              avatar_url: null
            }
          }
        })

        // Reverse to show oldest first (newest near input)
        const reversedComments = commentsWithUsers.reverse()

        setProjectComments(prev => ({ ...prev, [projectId]: reversedComments }))
      } else {
        setProjectComments(prev => ({ ...prev, [projectId]: [] }))
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(prev => ({ ...prev, [projectId]: false }))
    }
  }, [])

  const fetchPublicProjects = useCallback(async () => {
    if (!selectedOrg || !user?.id) return
    
    try {
      setLoadingPublicProjects(true)
      // Get projects that belong to the organization OR are owned by the user
      // This ensures all user's projects show up, even if they don't have organization_id set
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, status, progress, visibility, project_key')
        .or(`organization_id.eq.${selectedOrg},owner_id.eq.${user.id}`)
        .in('visibility', ['public', 'private'])
        .order('name')

      if (error) throw error
      setPublicProjects(data || [])
    } catch (error: any) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingPublicProjects(false)
    }
  }, [selectedOrg, user?.id])

  const fetchPartnerNotes = useCallback(async (invitationId: string) => {
    if (!invitationId) return
    
    try {
      setLoadingNotes(prev => ({ ...prev, [invitationId]: true }))
      const { data, error } = await supabase
        .from('partner_notes')
        .select('*')
        .eq('partner_invitation_id', invitationId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        // Fetch linked project details (both public and private)
        const linkedProjectIds = data
          .flatMap(note => note.linked_project_ids || [])
          .filter((id, index, self) => self.indexOf(id) === index)

        let linkedProjectsMap: Record<string, PublicProject> = {}
        if (linkedProjectIds.length > 0) {
          const { data: projectsData } = await supabase
            .from('projects')
            .select('id, name, description, status, progress, visibility, project_key')
            .in('id', linkedProjectIds)
            .in('visibility', ['public', 'private'])

          if (projectsData) {
            projectsData.forEach(project => {
              linkedProjectsMap[project.id] = project
            })
          }
        }

        const notesWithProjects: PartnerNote[] = data.map(note => ({
          ...note,
          linked_projects: (note.linked_project_ids || [])
            .map(id => linkedProjectsMap[id])
            .filter(Boolean)
        }))

        setPartnerNotes(prev => ({ ...prev, [invitationId]: notesWithProjects }))
      } else {
        setPartnerNotes(prev => ({ ...prev, [invitationId]: [] }))
      }
    } catch (error: any) {
      console.error('Error fetching partner notes:', error)
      toast.error('Failed to load notes')
    } finally {
      setLoadingNotes(prev => ({ ...prev, [invitationId]: false }))
    }
  }, [])

  const fetchOrganizations = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .order('name')

      if (error) throw error
      setOrganizations(data || [])
      if (data && data.length > 0) {
        setSelectedOrg(data[0].id)
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error)
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const fetchPartners = useCallback(async () => {
    if (!selectedOrg || !user?.id) return
    
    try {
      setLoading(true)
      
      // Get all partner access records for this organization where user_id is not null (accepted)
      const { data: accessData, error: accessError } = await supabase
        .from('partner_access')
        .select(`
          id,
          project_id,
          user_id,
          partner_invitation_id,
          projects (
            id,
            name,
            description,
            status
          ),
          partner_invitations!inner (
            id,
            organization_id,
            email,
            status,
            created_at,
            organizations (
              id,
              name
            )
          )
        `)
        .not('user_id', 'is', null)
        .eq('partner_invitations.organization_id', selectedOrg)
        .eq('partner_invitations.status', 'accepted')

      if (accessError) throw accessError

      if (!accessData || accessData.length === 0) {
        setPartners([])
        return
      }

      // Group by user_id
      const userMap = new Map<string, PartnerAccess[]>()
      accessData.forEach((access: any) => {
        if (access.user_id) {
          if (!userMap.has(access.user_id)) {
            userMap.set(access.user_id, [])
          }
          userMap.get(access.user_id)!.push(access as PartnerAccess)
        }
      })

      // Fetch user details
      const userIds = Array.from(userMap.keys())
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', userIds)

      if (usersError) {
        console.warn('Could not fetch user details:', usersError.message)
      }

      // Build partner info array
      const partnersList: PartnerInfo[] = []
      userMap.forEach((accessList, userId) => {
        const userDetail = usersData?.find(u => u.id === userId)
        if (userDetail && accessList.length > 0) {
          const firstAccess = accessList[0]
          partnersList.push({
            user: userDetail,
            access: accessList,
            invitationId: firstAccess.partner_invitation_id,
            organizationName: firstAccess.partner_invitations.organizations?.name || 'Organization',
            organizationId: firstAccess.partner_invitations.organizations?.id
          })
        }
      })

      setPartners(partnersList)
    } catch (error: any) {
      console.error('Error fetching partners:', error)
      toast.error('Failed to load partners')
    } finally {
      setLoading(false)
    }
  }, [selectedOrg, user?.id])

  useEffect(() => {
    if (selectedOrg) {
      fetchPartners()
      fetchPublicProjects()
    }
  }, [selectedOrg, fetchPublicProjects, fetchPartners])

  // Auto-select partner from URL query parameter
  useEffect(() => {
    const partnerInvitationId = searchParams.get('invitation')
    const partnerUserId = searchParams.get('partner')
    
    if (!partnerInvitationId && !partnerUserId) return
    
    if (partners.length > 0 && !selectedPartner) {
      if (partnerInvitationId) {
        const partner = partners.find(p => p.invitationId === partnerInvitationId)
        if (partner) {
          // Make sure the correct organization is selected first
          if (partner.organizationId && selectedOrg !== partner.organizationId) {
            setSelectedOrg(partner.organizationId)
            // Partner selection will happen in next effect after org changes
            return
          }
          setSelectedPartner(partner)
        }
      } else if (partnerUserId) {
        const partner = partners.find(p => p.user.id === partnerUserId)
        if (partner) {
          // Make sure the correct organization is selected first
          if (partner.organizationId && selectedOrg !== partner.organizationId) {
            setSelectedOrg(partner.organizationId)
            // Partner selection will happen in next effect after org changes
            return
          }
          setSelectedPartner(partner)
        }
      }
    }
  }, [partners, searchParams, selectedPartner, selectedOrg])
  
  // Auto-select partner after organization changes (when triggered by query param)
  useEffect(() => {
    const partnerInvitationId = searchParams.get('invitation')
    const partnerUserId = searchParams.get('partner')
    
    if (!partnerInvitationId && !partnerUserId) return
    
    // Only auto-select if we just changed org due to query param and partner isn't selected yet
    if (partners.length > 0 && !selectedPartner && selectedOrg) {
      if (partnerInvitationId) {
        const partner = partners.find(p => p.invitationId === partnerInvitationId)
        if (partner && partner.organizationId === selectedOrg) {
          setSelectedPartner(partner)
        }
      } else if (partnerUserId) {
        const partner = partners.find(p => p.user.id === partnerUserId)
        if (partner && partner.organizationId === selectedOrg) {
          setSelectedPartner(partner)
        }
      }
    }
  }, [partners, selectedOrg, searchParams, selectedPartner])

  useEffect(() => {
    if (selectedPartner) {
      fetchPartnerNotes(selectedPartner.invitationId)
      selectedPartner.access.forEach((access) => {
        if (access.projects?.id) {
          fetchProjectComments(access.projects.id)
        }
      })
    }
  }, [selectedPartner, fetchProjectComments, fetchPartnerNotes])

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

  const handleAddComment = async (projectId: string) => {
    if (!user?.id || !newComment[projectId]?.trim()) return

    const commentContent = newComment[projectId].trim()
    const tempId = `temp-${Date.now()}`
    
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
      }
    }

    setProjectComments(prev => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []), optimisticComment]
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
          user: optimisticComment.user
        }
        setProjectComments(prev => ({
          ...prev,
          [projectId]: (prev[projectId] || []).map(c => c.id === tempId ? realComment : c)
        }))

        // Create notification for the partner when organization owner comments
        if (selectedPartner) {
          try {
            // Get project name
            const project = selectedPartner.access.find(a => a.projects?.id === projectId)?.projects
            
            const { error: notificationError } = await supabase
              .from('notifications')
              .insert({
                user_id: selectedPartner.user.id,
                type: 'partner_project_comment',
                title: 'New Comment on Project',
                content: `${user?.name || 'Organization owner'} commented on project: "${project?.name || 'Project'}"`,
                metadata: {
                  comment_id: data.id,
                  project_id: projectId,
                  project_name: project?.name || 'Project',
                  partner_invitation_id: selectedPartner.invitationId,
                  organization_name: selectedPartner.organizationName,
                  commenter_id: user.id,
                  commenter_name: user?.name || 'Organization owner',
                  comment_content: commentContent.substring(0, 100) // First 100 chars
                },
                read: false
              })

            if (notificationError) {
              console.error('Error creating notification:', notificationError)
              // Don't throw error, just log it so the main operation still succeeds
            }
          } catch (notifyError) {
            console.error('Error creating notification:', notifyError)
            // Don't throw error, just log it
          }
        }
      }

      toast.success('Comment added successfully')
    } catch (error: any) {
      // Revert optimistic update on error
      setProjectComments(prev => ({
        ...prev,
        [projectId]: (prev[projectId] || []).filter(c => c.id !== tempId)
      }))
      setNewComment(prev => ({ ...prev, [projectId]: commentContent }))
      console.error('Error adding comment:', error)
      toast.error(error.message || 'Failed to add comment')
    }
  }

  const handleDeleteComment = async (commentId: string, projectId: string) => {
    if (!user?.id) return

    // Find the comment to restore if deletion fails
    const commentToDelete = projectComments[projectId]?.find(c => c.id === commentId)
    
    // Optimistically remove comment from state
    setProjectComments(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).filter(c => c.id !== commentId)
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
          [projectId]: [...(prev[projectId] || []), commentToDelete]
        }))
      }
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
  }

  const handleStartEdit = (commentId: string, currentContent: string) => {
    setEditingComment(prev => ({ ...prev, [commentId]: commentId }))
    setEditCommentContent(prev => ({ ...prev, [commentId]: currentContent }))
  }

  const handleCancelEdit = (commentId: string) => {
    setEditingComment(prev => {
      const newState = { ...prev }
      delete newState[commentId]
      return newState
    })
    setEditCommentContent(prev => {
      const newState = { ...prev }
      delete newState[commentId]
      return newState
    })
  }

  const handleSaveEdit = async (commentId: string, projectId: string) => {
    if (!user?.id || !editCommentContent[commentId]?.trim()) return

    const newContent = editCommentContent[commentId].trim()
    const originalComment = projectComments[projectId]?.find(c => c.id === commentId)
    
    if (!originalComment) return

    // Optimistically update comment in state
    setProjectComments(prev => ({
      ...prev,
      [projectId]: (prev[projectId] || []).map(c => 
        c.id === commentId 
          ? { ...c, content: newContent, updated_at: new Date().toISOString() }
          : c
      )
    }))

    // Clear editing state
    handleCancelEdit(commentId)

    try {
      const { error } = await supabase
        .from('project_comments')
        .update({ 
          content: newContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (error) throw error

      toast.success('Comment updated successfully')
    } catch (error: any) {
      // Revert optimistic update on error
      if (originalComment) {
        setProjectComments(prev => ({
          ...prev,
          [projectId]: (prev[projectId] || []).map(c => 
            c.id === commentId ? originalComment : c
          )
        }))
      }
      setEditCommentContent(prev => ({ ...prev, [commentId]: newContent }))
      setEditingComment(prev => ({ ...prev, [commentId]: commentId }))
      console.error('Error updating comment:', error)
      toast.error(error.message || 'Failed to update comment')
    }
  }



  const handleEnhanceNote = async () => {
    const currentContent = editingNoteId ? editNote.content.trim() : newNote.content.trim()
    if (!currentContent) {
      toast.error('Please enter content to enhance')
      return
    }

    setIsEnhancingNote(true)
    try {
      const response = await fetch('/api/enhance-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentContent })
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Enhancement failed')
      }

      const data = await response.json()
      if (editingNoteId) {
        setEditNote(prev => ({ ...prev, content: data.message }))
      } else {
        setNewNote(prev => ({ ...prev, content: data.message }))
      }
      toast.success('Note content enhanced with AI')
    } catch (error: any) {
      console.error('Note enhancement error:', error)
      toast.error(error?.message || 'Failed to enhance note content')
    } finally {
      setIsEnhancingNote(false)
    }
  }

  const handleCreateNote = async () => {
    if (isCreatingNote) return // Prevent double submission
    if (!selectedPartner || !user?.id || !newNote.title.trim() || !newNote.content.trim()) {
      toast.error('Please fill in title and content')
      return
    }

    setIsCreatingNote(true)
    try {
      const { data, error } = await supabase
        .from('partner_notes')
        .insert({
          partner_invitation_id: selectedPartner.invitationId,
          project_id: newNote.project_id && newNote.project_id !== 'none' ? newNote.project_id : null,
          title: newNote.title.trim(),
          content: newNote.content.trim(),
          content_type: 'markdown',
          linked_project_ids: newNote.linked_project_ids.length > 0 ? newNote.linked_project_ids : null,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Create notification for the partner
      try {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: selectedPartner.user.id,
            type: 'partner_note_created',
            title: 'New Partner Note',
            content: `${user?.name || 'Organization owner'} shared a new note: "${newNote.title.trim()}"`,
            metadata: {
              note_id: data.id,
              note_title: newNote.title.trim(),
              partner_invitation_id: selectedPartner.invitationId,
              organization_name: selectedPartner.organizationName,
              created_by: user.id,
              created_by_name: user?.name || 'Organization owner'
            },
            read: false
          })

        if (notificationError) {
          console.error('Error creating notification:', notificationError)
          // Don't throw error, just log it so the main operation still succeeds
        }
      } catch (notifyError) {
        console.error('Error creating notification:', notifyError)
        // Don't throw error, just log it
      }

      toast.success('Note created successfully')
      setIsNoteDialogOpen(false)
      setNewNote({ title: '', content: '', project_id: 'none', linked_project_ids: [] })
      setProjectSearchQuery('')
      fetchPartnerNotes(selectedPartner.invitationId)
    } catch (error: any) {
      console.error('Error creating note:', error)
      toast.error(error.message || 'Failed to create note')
    } finally {
      setIsCreatingNote(false)
    }
  }

  const handleStartEditNote = (note: PartnerNote) => {
    setEditingNoteId(note.id)
    setEditNote({
      title: note.title,
      content: note.content,
      project_id: note.project_id || 'none',
      linked_project_ids: note.linked_project_ids || [],
    })
    setIsNoteDialogOpen(true)
  }

  const handleCancelEditNote = () => {
    setEditingNoteId(null)
    setEditNote({ title: '', content: '', project_id: 'none', linked_project_ids: [] })
    setIsNoteDialogOpen(false)
    setProjectSearchQuery('')
  }

  const handleUpdateNote = async () => {
    if (isUpdatingNote || !editingNoteId || !selectedPartner) return
    if (!editNote.title.trim() || !editNote.content.trim()) {
      toast.error('Please fill in title and content')
      return
    }

    setIsUpdatingNote(true)
    try {
      const { error } = await supabase
        .from('partner_notes')
        .update({
          title: editNote.title.trim(),
          content: editNote.content.trim(),
          project_id: editNote.project_id && editNote.project_id !== 'none' ? editNote.project_id : null,
          linked_project_ids: editNote.linked_project_ids.length > 0 ? editNote.linked_project_ids : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNoteId)

      if (error) throw error

      // Create notification for the partner
      try {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: selectedPartner.user.id,
            type: 'partner_note_updated',
            title: 'Partner Note Updated',
            content: `${user?.name || 'Organization owner'} updated the note: "${editNote.title.trim()}"`,
            metadata: {
              note_id: editingNoteId,
              note_title: editNote.title.trim(),
              partner_invitation_id: selectedPartner.invitationId,
              organization_name: selectedPartner.organizationName,
              updated_by: user.id,
              updated_by_name: user?.name || 'Organization owner'
            },
            read: false
          })

        if (notificationError) {
          console.error('Error creating notification:', notificationError)
          // Don't throw error, just log it so the main operation still succeeds
        }
      } catch (notifyError) {
        console.error('Error creating notification:', notifyError)
        // Don't throw error, just log it
      }

      toast.success('Note updated successfully')
      setEditingNoteId(null)
      setEditNote({ title: '', content: '', project_id: 'none', linked_project_ids: [] })
      setIsNoteDialogOpen(false)
      setProjectSearchQuery('')
      fetchPartnerNotes(selectedPartner.invitationId)
    } catch (error: any) {
      console.error('Error updating note:', error)
      toast.error(error.message || 'Failed to update note')
    } finally {
      setIsUpdatingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string, invitationId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return

    try {
      const { error } = await supabase
        .from('partner_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error

      toast.success('Note deleted successfully')
      fetchPartnerNotes(invitationId)
    } catch (error: any) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    }
  }

  const formatDate = (dateString?: string) => {
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
              <p className="text-gray-400">You don't own any organizations. Create an organization first to view partners.</p>
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
              My Partners
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto md:mx-0"></div>
          </div>
          <p className="text-gray-300 mt-3">View and interact with partners who have access to your organization's projects</p>
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
              Choose an organization to view its partners
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

        {/* Partners List */}
        {selectedOrg && (
          <div className="space-y-6">
            {/* Partner Selector */}
            {partners.length > 0 && (
              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl text-white font-bold flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    Select Partner
                  </CardTitle>
                  <CardDescription className="text-gray-300 mt-2">
                    Choose a partner to view their projects and comments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedPartner?.user.id || ""}
                    onValueChange={(value) => {
                      const partner = partners.find(p => p.user.id === value)
                      if (partner) {
                        setSelectedPartner(partner)
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-12 bg-gray-900/50 border-gray-700 text-white hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all">
                    <SelectValue placeholder="Select a partner..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {partners.map((partner) => (
                      <SelectItem
                        key={partner.user.id}
                        value={partner.user.id}
                        className="text-white focus:bg-purple-500/20 focus:text-purple-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{partner.user.name || partner.user.email}</span>
                          <span className="text-gray-400">-</span>
                          <span className="text-gray-400">{partner.access.length} project{partner.access.length !== 1 ? 's' : ''}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

            {/* Partner Details */}
            {selectedPartner && (
              <div className="space-y-6">
                {/* Partner Header */}
                <Card className="bg-[#141414] border border-black shadow-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            {selectedPartner.user.avatar_url ? (
                              <img 
                                src={selectedPartner.user.avatar_url} 
                                alt={selectedPartner.user.name || 'User'} 
                                className="w-12 h-12 rounded-full"
                              />
                            ) : (
                              <span className="text-purple-400 font-semibold text-lg">
                                {(selectedPartner.user.name || selectedPartner.user.email || 'U')[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-3xl text-white font-bold">
                              {selectedPartner.user.name || 'Unknown User'}
                            </CardTitle>
                            <CardDescription className="text-gray-300 text-lg mt-1 flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {selectedPartner.user.email}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 px-4 py-2 text-sm font-semibold">
                          {selectedPartner.access.length} Project{selectedPartner.access.length !== 1 ? 's' : ''}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/partners-settings?invitation=${selectedPartner.invitationId}`)}
                          className="border-gray-700 hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/50"
                          title="Partner Settings"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Partner Notes Section */}
                <Card className="bg-[#141414] border border-black shadow-xl">
                  <CardHeader className="border-b border-black">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        Partner Notes
                      </CardTitle>
                      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="gradient-button">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Note
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#141414] border-[#141414] max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-white text-2xl">
                              {editingNoteId ? 'Edit Partner Note' : 'Create Partner Note'}
                            </DialogTitle>
                            <DialogDescription className="text-gray-300">
                              Share updates, links, and information with your partner. You can link to public projects (sub-projects) to show their status.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 mt-4">
                            <div>
                              <Label className="text-white font-medium">Title *</Label>
                              <Input
                                value={editingNoteId ? editNote.title : newNote.title}
                                onChange={(e) => {
                                  if (editingNoteId) {
                                    setEditNote(prev => ({ ...prev, title: e.target.value }))
                                  } else {
                                    setNewNote(prev => ({ ...prev, title: e.target.value }))
                                  }
                                }}
                                placeholder="Note title"
                                className="bg-black border-[#141414] text-white mt-2"
                              />
                            </div>
                            <div>
                              <Label className="text-white font-medium">Content *</Label>
                              <div className="relative mt-2">
                                <Textarea
                                  value={editingNoteId ? editNote.content : newNote.content}
                                  onChange={(e) => {
                                    if (editingNoteId) {
                                      setEditNote(prev => ({ ...prev, content: e.target.value }))
                                    } else {
                                      setNewNote(prev => ({ ...prev, content: e.target.value }))
                                    }
                                  }}
                                  placeholder="Write your note here. You can use markdown for formatting, include links, images, and videos."
                                  className="bg-black border-[#141414] text-white min-h-[200px] pr-10"
                                />
                                {(editingNoteId ? editNote.content : newNote.content)?.trim() && (
                                  <button
                                    type="button"
                                    onClick={handleEnhanceNote}
                                    disabled={isEnhancingNote}
                                    className="absolute right-2 top-2 p-1.5 hover:bg-purple-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Enhance with AI"
                                  >
                                    {isEnhancingNote ? (
                                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-4 h-4 text-purple-400" />
                                    )}
                                  </button>
                                )}
                              </div>
                              <p className="text-gray-400 text-xs mt-1">
                                Tip: Use markdown for formatting. Links: [text](url), Images: ![alt](url), Videos: &lt;video src="url"&gt;
                              </p>
                            </div>
                            <div>
                              <Label className="text-white font-medium">Link to Project (Optional)</Label>
                              <Select
                                value={editingNoteId ? editNote.project_id : newNote.project_id}
                                onValueChange={(value) => {
                                  if (editingNoteId) {
                                    setEditNote(prev => ({ ...prev, project_id: value }))
                                  } else {
                                    setNewNote(prev => ({ ...prev, project_id: value }))
                                  }
                                }}
                              >
                                <SelectTrigger className="bg-[#141414] border-[#141414] text-white mt-2">
                                  <SelectValue placeholder="Select a project (optional)" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141414] border-[#141414]">
                                  <SelectItem value="none" className="text-white">None</SelectItem>
                                  {selectedPartner.access.map((access) => {
                                    if (!access.projects?.id) return null
                                    return (
                                      <SelectItem
                                        key={access.projects.id}
                                        value={access.projects.id}
                                        className="text-white"
                                      >
                                        {access.projects.name}
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-white font-medium">Link to Projects (Sub-Projects)</Label>
                              <p className="text-gray-400 text-xs mb-2">
                                Select projects to link. Partners will see their status and can view updates. Private projects will be accessible to partners through their granted access.
                              </p>
                              <div className="mb-3">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={projectSearchQuery}
                                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                                    className="pl-10 bg-[#141414] border-[#141414] text-white placeholder:text-gray-500"
                                  />
                                </div>
                              </div>
                              <div className="p-4 bg-[#141414] rounded-lg border border-[#141414] space-y-2 max-h-48 overflow-y-auto">
                                {loadingPublicProjects ? (
                                  <LoadingSpinner />
                                ) : (() => {
                                  const filteredProjects = publicProjects.filter(project =>
                                    project.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
                                    project.description?.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
                                    project.status.toLowerCase().includes(projectSearchQuery.toLowerCase())
                                  )
                                  const currentLinkedIds = editingNoteId ? editNote.linked_project_ids : newNote.linked_project_ids
                                  return filteredProjects.length > 0 ? (
                                    filteredProjects.map((project) => (
                                    <div key={project.id} className="flex items-center space-x-3 p-2 hover:bg-black/50 rounded transition-colors">
                                      <input
                                        type="checkbox"
                                        id={`project-${project.id}`}
                                        checked={currentLinkedIds.includes(project.id)}
                                        onChange={(e) => {
                                          if (editingNoteId) {
                                            if (e.target.checked) {
                                              setEditNote(prev => ({
                                                ...prev,
                                                linked_project_ids: [...prev.linked_project_ids, project.id]
                                              }))
                                            } else {
                                              setEditNote(prev => ({
                                                ...prev,
                                                linked_project_ids: prev.linked_project_ids.filter(id => id !== project.id)
                                              }))
                                            }
                                          } else {
                                            if (e.target.checked) {
                                              setNewNote(prev => ({
                                                ...prev,
                                                linked_project_ids: [...prev.linked_project_ids, project.id]
                                              }))
                                            } else {
                                              setNewNote(prev => ({
                                                ...prev,
                                                linked_project_ids: prev.linked_project_ids.filter(id => id !== project.id)
                                              }))
                                            }
                                          }
                                        }}
                                        className="w-4 h-4 rounded border-gray-600 text-purple-500 focus:ring-purple-500"
                                      />
                                      <Label htmlFor={`project-${project.id}`} className="text-white cursor-pointer flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Building2 className="w-4 h-4" />
                                          <span>{project.name}</span>
                                          <Badge 
                                            variant="outline" 
                                            className={
                                              project.visibility === 'private'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs'
                                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs'
                                            }
                                          >
                                            {project.visibility === 'private' ? 'Private' : 'Public'}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {project.status}
                                          </Badge>
                                        </div>
                                      </Label>
                                    </div>
                                    ))
                                  ) : (
                                    <p className="text-gray-400 text-sm text-center py-4">
                                      {projectSearchQuery ? 'No projects found matching your search' : 'No projects available'}
                                    </p>
                                  )
                                })()}
                              </div>
                            </div>
                          </div>
                          <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => {
                              if (editingNoteId) {
                                handleCancelEditNote()
                              } else {
                                setIsNoteDialogOpen(false)
                                setProjectSearchQuery('')
                                setNewNote({ title: '', content: '', project_id: 'none', linked_project_ids: [] })
                              }
                            }} className="border-[#141414]">
                              Cancel
                            </Button>
                            {editingNoteId ? (
                              <Button onClick={handleUpdateNote} className="gradient-button" disabled={!editNote.title.trim() || !editNote.content.trim() || isUpdatingNote}>
                                {isUpdatingNote ? 'Updating...' : 'Update Note'}
                              </Button>
                            ) : (
                              <Button onClick={handleCreateNote} className="gradient-button" disabled={!newNote.title.trim() || !newNote.content.trim() || isCreatingNote}>
                                {isCreatingNote ? 'Creating...' : 'Create Note'}
                              </Button>
                            )}
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {loadingNotes[selectedPartner.invitationId] ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : partnerNotes[selectedPartner.invitationId]?.length > 0 ? (
                      <div className="space-y-4">
                        {partnerNotes[selectedPartner.invitationId].map((note) => {
                          const isExpanded = expandedNotes[note.id] || false
                          return (
                            <Card key={note.id} className="bg-[#141414] border border-[#141414]">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div 
                                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => setExpandedNotes(prev => ({ ...prev, [note.id]: !isExpanded }))}
                                    >
                                      <CardTitle className="text-lg text-white">{note.title}</CardTitle>
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                      )}
                                    </div>
                                    <CardDescription className="text-gray-400 text-xs mt-1">
                                      {formatDate(note.created_at)}
                                      {note.updated_at !== note.created_at && (
                                        <span className="ml-2">(edited)</span>
                                      )}
                                    </CardDescription>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleStartEditNote(note)}
                                      className="text-gray-400 hover:text-purple-400"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteNote(note.id, selectedPartner.invitationId)}
                                      className="text-gray-400 hover:text-red-400"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardHeader>
                              {isExpanded && (
                                <CardContent>
                              <div className="prose prose-invert max-w-none">
                                <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {note.content}
                                </div>
                              </div>
                              {note.linked_projects && note.linked_projects.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-black">
                                  <Label className="text-gray-400 text-sm font-medium mb-2 block">Linked Projects (Sub-Projects):</Label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {note.linked_projects.map((project) => (
                                      <Card key={project.id} className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors">
                                        <CardContent className="p-4">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <Building2 className="w-4 h-4 text-purple-400" />
                                                <span className="text-white font-semibold">{project.name}</span>
                                                {project.visibility === 'private' && (
                                                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs">
                                                    Private
                                                  </Badge>
                                                )}
                                              </div>
                                              {project.description && (
                                                <p className="text-gray-400 text-xs line-clamp-2">{project.description}</p>
                                              )}
                                              <div className="space-y-2 mt-2">
                                                <div className="flex items-center gap-2">
                                                  <Badge
                                                    variant="outline"
                                                    className={
                                                      project.status === 'active'
                                                        ? 'bg-green-500/10 text-green-400 border-green-500/30 text-xs'
                                                        : project.status === 'completed'
                                                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs'
                                                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs'
                                                    }
                                                  >
                                                    {project.status}
                                                  </Badge>
                                                  {project.progress !== undefined && (
                                                    <span className="text-gray-400 text-xs">{project.progress}%</span>
                                                  )}
                                                </div>
                                                {project.progress !== undefined && (
                                                  <div className="w-full">
                                                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                                      <div 
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(project.progress, 100)}%` }}
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => router.push(`/publicprojects/${project.id}`)}
                                              className="text-purple-400 hover:text-purple-300"
                                            >
                                              <ExternalLink className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </CardContent>
                              )}
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-400">No notes yet</p>
                        <p className="text-gray-500 text-sm mt-1">Create a note to share updates with your partner</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Projects List */}
                <div className="space-y-4">
                  {selectedPartner.access.map((access) => {
                    const project = access.projects
                    if (!project) return null

                    const comments = projectComments[project.id] || []
                    const isCommentsExpanded = expandedComments[project.id] ?? true

                    return (
                      <Card key={access.id} className="bg-[#141414] border border-black shadow-xl hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="border-b border-black">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Building2 className="w-5 h-5 text-purple-400" />
                              </div>
                              <div>
                                <CardTitle className="text-xl text-white">
                                  {project.name}
                                </CardTitle>
                                {project.description && (
                                  <CardDescription className="text-gray-300 mt-1">
                                    {project.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <Badge
                              className={
                                project.status === 'active'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                  : project.status === 'completed'
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                              }
                            >
                              {project.status || 'Active'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          {/* Project Comments Section */}
                          <div className="space-y-4">
                            <div 
                              className="flex items-center justify-between cursor-pointer pb-3 border-b border-black/50"
                              onClick={() => setExpandedComments(prev => ({ ...prev, [project.id]: !(prev[project.id] ?? true) }))}
                            >
                              <CardTitle className="text-lg text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                  <MessageSquare className="w-5 h-5 text-blue-400" />
                                </div>
                                Project Comments
                                {comments.length > 0 && (
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                                    {comments.length}
                                  </Badge>
                                )}
                              </CardTitle>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedComments(prev => ({ ...prev, [project.id]: !(prev[project.id] ?? true) }))
                                }}
                                className="p-1 hover:bg-black/50 rounded transition-colors"
                                aria-label={isCommentsExpanded ? "Collapse" : "Expand"}
                              >
                                {isCommentsExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </button>
                            </div>

                            {isCommentsExpanded && (
                              <>
                                {/* Comments List */}
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {loadingComments[project.id] ? (
                                    <div className="flex justify-center py-8">
                                      <LoadingSpinner />
                                    </div>
                                  ) : comments.length > 0 ? (
                                    comments.map((comment) => {
                                      const isEditing = editingComment[comment.id] === comment.id
                                      const isOwner = comment.user_id === user?.id
                                      
                                      return (
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
                                              <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                  <p className="text-white font-semibold text-sm">
                                                    {comment.user.name || 'Unknown User'}
                                                  </p>
                                                  <span className="text-gray-500 text-xs">
                                                    {formatDate(comment.created_at)}
                                                  </span>
                                                  {comment.updated_at !== comment.created_at && (
                                                    <span className="text-gray-600 text-xs">(edited)</span>
                                                  )}
                                                </div>
                                                {!isEditing && (
                                                  <div className="flex items-center gap-2">
                                                    {isOwner && (
                                                      <button
                                                        type="button"
                                                        onClick={() => handleStartEdit(comment.id, comment.content)}
                                                        className="p-1.5 hover:bg-purple-500/20 rounded transition-colors text-gray-400 hover:text-purple-400"
                                                        title="Edit comment"
                                                      >
                                                        <Pencil className="w-4 h-4" />
                                                      </button>
                                                    )}
                                                    <button
                                                      type="button"
                                                      onClick={() => handleDeleteComment(comment.id, project.id)}
                                                      className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-gray-400 hover:text-red-400"
                                                      title="Delete comment"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                              {isEditing ? (
                                                <div className="space-y-2">
                                                  <Input
                                                    value={editCommentContent[comment.id] || ''}
                                                    onChange={(e) => setEditCommentContent(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                                    onKeyPress={(e) => {
                                                      if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault()
                                                        handleSaveEdit(comment.id, project.id)
                                                      } else if (e.key === 'Escape') {
                                                        e.preventDefault()
                                                        handleCancelEdit(comment.id)
                                                      }
                                                    }}
                                                    className="bg-gray-900 border-gray-700 text-white text-sm"
                                                    autoFocus
                                                  />
                                                  <div className="flex items-center gap-2">
                                                    <Button
                                                      size="sm"
                                                      onClick={() => handleSaveEdit(comment.id, project.id)}
                                                      disabled={!editCommentContent[comment.id]?.trim()}
                                                      className="gradient-button h-8 px-3"
                                                    >
                                                      <Check className="w-3 h-3 mr-1" />
                                                      Save
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleCancelEdit(comment.id)}
                                                      className="border-gray-700 h-8 px-3"
                                                    >
                                                      <X className="w-3 h-3 mr-1" />
                                                      Cancel
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <p className="text-gray-300 text-sm leading-relaxed">
                                                  {comment.content}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })
                                  ) : (
                                    <div className="text-center py-8">
                                      <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                      <p className="text-gray-400">No comments yet</p>
                                      <p className="text-gray-500 text-sm mt-1">Be the first to comment on this project</p>
                                    </div>
                                  )}
                                </div>

                                {/* Add Comment Form */}
                                <div className="pt-4 border-t border-black">
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <Input
                                        placeholder="Add a comment..."
                                        value={newComment[project.id] || ''}
                                        onChange={(e) => setNewComment(prev => ({ ...prev, [project.id]: e.target.value }))}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            handleAddComment(project.id)
                                          }
                                        }}
                                        className="bg-black border-black text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 pr-10"
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
                                      onClick={() => handleAddComment(project.id)}
                                      disabled={!newComment[project.id]?.trim()}
                                      className="gradient-button px-4"
                                    >
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {partners.length === 0 && selectedOrg && (
              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 shadow-xl">
                <CardContent className="py-16 text-center">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Partners</h3>
                  <p className="text-gray-400">No partners have accepted invitations for this organization yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyPartnersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <LoadingSpinner />
      </div>
    }>
      <MyPartnersContent />
    </Suspense>
  )
}


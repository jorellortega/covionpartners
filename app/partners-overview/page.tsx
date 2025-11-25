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
import {
  Calendar,
  DollarSign,
  Key,
  FileText,
  Info,
  Building2,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Wallet,
  Target,
  Users,
  Mail,
  MessageSquare,
  Send,
  ExternalLink,
  ArrowDownToLine,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface PartnerAccess {
  id: string
  project_id: string
  projects: {
    id: string
    name: string
    description?: string
    status: string
    deadline?: string
    progress?: number
    budget?: number
    created_at: string
    funding_goal?: number
    current_funding?: number
    min_investment?: number
    max_investment?: number
    investment_type?: string
    investment_pitch?: string
    investment_start?: string
    investment_end?: string
    payment_methods?: string[]
    show_invest?: boolean
  }
  partner_invitation_id: string
  partner_invitations: {
    id: string
    organization_id: string
    organizations: {
      id: string
      name: string
    }
  }
}

interface PartnerSettings {
  can_see_updates: boolean
  can_see_project_info: boolean
  can_see_dates: boolean
  can_see_expenses: boolean
  can_see_progress: boolean
  can_see_team_members: boolean
  can_see_budget: boolean
  can_see_funding: boolean
  can_see_roi: boolean
  can_see_balance: boolean
  can_see_revenue: boolean
  can_see_monthly_reports: boolean
  can_see_expenses_in_reports?: boolean
  can_see_net_profit_in_reports?: boolean
  can_see_overall_roi_in_reports?: boolean
}

interface ProjectUpdate {
  id: number
  title: string
  description: string
  created_at: string
  date: string
}

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  status: string
  created_at: string
}

interface TeamMember {
  id: string
  user_id: string
  project_id: string
  role: string
  status: string
  access_level?: number
  position?: string
  user: {
    id: string
    name: string | null
    email: string
    avatar_url: string | null
    role: string
  }
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

export default function PartnersOverviewPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [invitationKey, setInvitationKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [partnerAccess, setPartnerAccess] = useState<PartnerAccess[]>([])
  const [partnerSettings, setPartnerSettings] = useState<Record<string, PartnerSettings>>({})
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<PartnerAccess | null>(null)
  const [projectUpdates, setProjectUpdates] = useState<Record<string, ProjectUpdate[]>>({})
  const [projectExpenses, setProjectExpenses] = useState<Record<string, Expense[]>>({})
  const [projectTeamMembers, setProjectTeamMembers] = useState<Record<string, TeamMember[]>>({})
  const [projectComments, setProjectComments] = useState<Record<string, ProjectComment[]>>({})
  const [loadingUpdates, setLoadingUpdates] = useState<Record<string, boolean>>({})
  const [loadingExpenses, setLoadingExpenses] = useState<Record<string, boolean>>({})
  const [loadingTeamMembers, setLoadingTeamMembers] = useState<Record<string, boolean>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [isProjectInfoExpanded, setIsProjectInfoExpanded] = useState(false)
  const [partnerNotes, setPartnerNotes] = useState<Record<string, PartnerNote[]>>({})
  const [loadingNotes, setLoadingNotes] = useState<Record<string, boolean>>({})
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const [financialReports, setFinancialReports] = useState<any[]>([])
  const [loadingFinancialReports, setLoadingFinancialReports] = useState(false)
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false)
  const [selectedReportForWithdrawal, setSelectedReportForWithdrawal] = useState<any>(null)
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("")
  const [withdrawalNotes, setWithdrawalNotes] = useState<string>("")
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false)
  const [stripeOnboardingStatus, setStripeOnboardingStatus] = useState<Record<string, { completed: boolean; url?: string }>>({})

  // Define fetch functions with useCallback
  const fetchProjectUpdates = useCallback(async (projectId: string, invitationId: string) => {
    const settings = partnerSettings[invitationId]
    if (!settings?.can_see_updates) return

    setLoadingUpdates(prev => ({ ...prev, [projectId]: true }))
    try {
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setProjectUpdates(prev => ({ ...prev, [projectId]: data || [] }))
    } catch (error) {
      console.error('Error fetching updates:', error)
    } finally {
      setLoadingUpdates(prev => ({ ...prev, [projectId]: false }))
    }
  }, [partnerSettings])

  const fetchProjectExpenses = useCallback(async (projectId: string, invitationId: string) => {
    const settings = partnerSettings[invitationId]
    if (!settings?.can_see_expenses) return

    setLoadingExpenses(prev => ({ ...prev, [projectId]: true }))
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setProjectExpenses(prev => ({ ...prev, [projectId]: data || [] }))
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoadingExpenses(prev => ({ ...prev, [projectId]: false }))
    }
  }, [partnerSettings])

  const fetchProjectTeamMembers = useCallback(async (projectId: string, invitationId: string) => {
    const settings = partnerSettings[invitationId]
    if (!settings?.can_see_team_members) return

    setLoadingTeamMembers(prev => ({ ...prev, [projectId]: true }))
    try {
      // 1. Fetch project owner
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

      if (projectError) throw projectError

      // 2. Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (membersError) throw membersError

      // 3. Get all user IDs (team members + owner)
      const userIds = [
        projectData?.owner_id,
        ...(membersData || []).map(m => m.user_id)
      ].filter((id): id is string => !!id)

      // 4. Fetch user details
      let usersData: any[] = []
      if (userIds.length > 0) {
        const { data: fetchedUsers, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url, role')
          .in('id', userIds)

        if (usersError) {
          console.warn('Could not fetch user details:', usersError.message)
        } else {
          usersData = fetchedUsers || []
        }
      }

      // 5. Combine team members with user data
      const combinedData: TeamMember[] = (membersData || []).map((member) => {
        const userDetail = usersData.find(u => u.id === member.user_id)
        return {
          ...member,
          user: userDetail || {
            id: member.user_id,
            name: 'Unknown User',
            email: 'Unknown',
            avatar_url: null,
            role: 'viewer'
          }
        }
      })

      // 6. Add owner if not in team_members
      if (projectData?.owner_id && !membersData?.some(m => m.user_id === projectData.owner_id)) {
        const ownerDetail = usersData.find(u => u.id === projectData.owner_id)
        if (ownerDetail) {
          combinedData.unshift({
            id: `owner-${projectData.owner_id}`,
            user_id: projectData.owner_id,
            project_id: projectId,
            role: 'owner',
            status: 'active',
            user: ownerDetail
          })
        }
      }

      setProjectTeamMembers(prev => ({ ...prev, [projectId]: combinedData }))
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoadingTeamMembers(prev => ({ ...prev, [projectId]: false }))
    }
  }, [partnerSettings])

  const fetchPartnerNotes = useCallback(async (invitationId: string) => {
    setLoadingNotes(prev => ({ ...prev, [invitationId]: true }))
    try {
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
    } catch (error) {
      console.error('Error fetching partner notes:', error)
    } finally {
      setLoadingNotes(prev => ({ ...prev, [invitationId]: false }))
    }
  }, [])

  const fetchFinancialReports = useCallback(async (invitationId: string) => {
    setLoadingFinancialReports(true)
    try {
      console.log('🔍 Fetching financial reports for invitation:', invitationId)
      const { data, error } = await supabase
        .from('partner_financial_reports')
        .select('*')
        .eq('partner_invitation_id', invitationId)
        .order('report_month', { ascending: false })
        .limit(12)

      if (error) {
        console.error('❌ Error fetching financial reports:', error)
        throw error
      }
      
      console.log('✅ Financial reports fetched:', data?.length || 0, 'reports')
      setFinancialReports(data || [])
    } catch (error) {
      console.error('Error fetching financial reports:', error)
      toast.error('Failed to load financial reports')
    } finally {
      setLoadingFinancialReports(false)
    }
  }, [])

  const fetchProjectComments = useCallback(async (projectId: string, invitationId: string) => {
    const settings = partnerSettings[invitationId]
    // Use can_see_updates permission for comments, or we can add a new permission later
    if (!settings?.can_see_updates) return

    setLoadingComments(prev => ({ ...prev, [projectId]: true }))
    try {
      // Fetch comments (get newest first, then reverse to show oldest first with newest near input)
      const { data: commentsData, error: commentsError } = await supabase
        .from('project_comments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10)

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
  }, [partnerSettings])

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

        // Create notification for the organization owner when partner comments
        if (selectedProject) {
          try {
            // Get organization owner from the partner_invitations
            const { data: invitationData, error: inviteError } = await supabase
              .from('partner_invitations')
              .select(`
                id,
                organization_id,
                organizations (
                  id,
                  name,
                  owner_id
                )
              `)
              .eq('id', selectedProject.partner_invitation_id)
              .single()

            if (!inviteError && invitationData) {
              const organization = (invitationData.organizations as any)
              if (organization?.owner_id) {
                // Get partner user info
                const { data: partnerUser } = await supabase
                  .from('users')
                  .select('id, name, email')
                  .eq('id', user.id)
                  .single()

                const { error: notificationError } = await supabase
                  .from('notifications')
                  .insert({
                    user_id: organization.owner_id,
                    type: 'partner_project_comment',
                    title: 'Partner Commented on Project',
                    content: `${partnerUser?.name || user.email || 'A partner'} commented on project: "${selectedProject.projects.name}"`,
                    metadata: {
                      comment_id: data.id,
                      project_id: projectId,
                      project_name: selectedProject.projects.name,
                      partner_invitation_id: selectedProject.partner_invitation_id,
                      organization_id: organization.id,
                      organization_name: organization.name || 'Organization',
                      partner_user_id: user.id,
                      partner_name: partnerUser?.name || user.email || 'Partner',
                      comment_content: commentContent.substring(0, 100) // First 100 chars
                    },
                    read: false
                  })

                if (notificationError) {
                  console.error('Error creating notification:', notificationError)
                  // Don't throw error, just log it so the main operation still succeeds
                }
              }
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

  // Define fetchPartnerAccess with useCallback
  const fetchPartnerAccess = useCallback(async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const { data: access, error } = await supabase
        .from('partner_access')
        .select(`
          id,
          project_id,
          partner_invitation_id,
          projects (
            id,
            name,
            description,
            status,
            deadline,
            progress,
            budget,
            created_at,
            funding_goal,
            current_funding,
            min_investment,
            max_investment,
            investment_type,
            investment_pitch,
            investment_start,
            investment_end,
            payment_methods,
            show_invest
          ),
          partner_invitations!inner (
            id,
            organization_id,
            organizations (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error

      if (access) {
        setPartnerAccess(access as PartnerAccess[])
        
        // Fetch settings for each invitation
        const invitationIds = [...new Set(access.map((a: any) => a.partner_invitation_id))]
        const settingsPromises = invitationIds.map(invId => 
          supabase
            .from('organization_partner_settings')
            .select('*')
            .eq('partner_invitation_id', invId)
            .single()
        )
        
        const settingsResults = await Promise.all(settingsPromises)
        const settingsMap: Record<string, PartnerSettings> = {}
        
        settingsResults.forEach((result, index) => {
          if (!result.error && result.data) {
            settingsMap[invitationIds[index]] = result.data as PartnerSettings
          }
        })
        
        setPartnerSettings(settingsMap)

        // Fetch Stripe Connect onboarding status for each invitation
        const onboardingStatusMap: Record<string, { completed: boolean; url?: string }> = {}
        for (const invId of invitationIds) {
          const { data: invitation } = await supabase
            .from('partner_invitations')
            .select('stripe_connect_onboarding_completed, stripe_connect_onboarding_url')
            .eq('id', invId)
            .single()
          
          if (invitation) {
            onboardingStatusMap[invId] = {
              completed: invitation.stripe_connect_onboarding_completed || false,
              url: invitation.stripe_connect_onboarding_url || 'https://connect.stripe.com/setup/e/acct_1SXGEs9jVu4EeqMr/o2uHo472w1Fx'
            }
          }
        }
        setStripeOnboardingStatus(onboardingStatusMap)
      }
    } catch (error: any) {
      console.error('Error fetching partner access:', error)
      toast.error('Failed to load partner access')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Fetch partner access on mount
  useEffect(() => {
    if (user && !authLoading) {
      fetchPartnerAccess()
    }
  }, [user, authLoading, fetchPartnerAccess])

  // Auto-select first project when access is loaded
  useEffect(() => {
    if (partnerAccess.length > 0 && !selectedProject && Object.keys(partnerSettings).length > 0) {
      setSelectedProject(partnerAccess[0])
    }
  }, [partnerAccess, partnerSettings, selectedProject])

  // Reset project info expanded state when project changes
  useEffect(() => {
    setIsProjectInfoExpanded(false)
  }, [selectedProject?.id])

  // Auto-fetch details when project is selected and settings are loaded
  useEffect(() => {
    if (!selectedProject?.projects?.id || !selectedProject?.partner_invitation_id) return
    if (!partnerSettings[selectedProject.partner_invitation_id]) return
    
    const project = selectedProject.projects
    const invitationId = selectedProject.partner_invitation_id
    const settings = partnerSettings[invitationId]
    
    // Fetch data based on permissions
    if (settings.can_see_updates) {
      fetchProjectUpdates(project.id, invitationId)
      fetchProjectComments(project.id, invitationId)
      fetchPartnerNotes(invitationId)
    }
    if (settings.can_see_expenses) {
      fetchProjectExpenses(project.id, invitationId)
    }
    if (settings.can_see_team_members) {
      fetchProjectTeamMembers(project.id, invitationId)
    }
    if (settings.can_see_monthly_reports) {
      fetchFinancialReports(invitationId)
    }
  }, [
    selectedProject?.projects?.id,
    selectedProject?.partner_invitation_id,
    partnerSettings,
    fetchProjectUpdates,
    fetchProjectExpenses,
    fetchProjectTeamMembers,
    fetchProjectComments,
    fetchPartnerNotes,
    fetchFinancialReports
  ])

  const handleAcceptInvitation = async () => {
    if (!invitationKey.trim()) {
      toast.error('Please enter an invitation key')
      return
    }

    if (!user?.id) {
      toast.error('Please log in to accept an invitation')
      return
    }

    setIsSubmitting(true)
    try {
      // Get the invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('partner_invitations')
        .select('*, organizations(*)')
        .eq('invitation_key', invitationKey.trim())
        .eq('status', 'pending')
        .single()

      if (inviteError || !invitation) {
        throw new Error('Invalid or expired invitation key')
      }

      // Check expiration
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        throw new Error('This invitation has expired')
      }

      // Get projects for this organization that are assigned to this invitation
      const { data: accessList, error: accessError } = await supabase
        .from('partner_access')
        .select('*')
        .eq('partner_invitation_id', invitation.id)

      if (accessError) throw accessError

      // Update access to link to current user
      if (accessList && accessList.length > 0) {
        const { error: updateError } = await supabase
          .from('partner_access')
          .update({ user_id: user.id })
          .eq('partner_invitation_id', invitation.id)
          .is('user_id', null)

        if (updateError) throw updateError
      }

      // Update invitation status
      const { error: updateInviteError } = await supabase
        .from('partner_invitations')
        .update({ 
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      if (updateInviteError) throw updateInviteError

      // Get organization owner to notify them
      const organization = invitation.organizations as any
      if (organization?.owner_id) {
        try {
          // Get user info for notification
          const { data: partnerUser } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', user.id)
            .single()

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: organization.owner_id,
              type: 'partner_invitation_accepted',
              title: 'Partner Invitation Accepted',
              content: `${partnerUser?.name || user.email || 'A partner'} has accepted your partner invitation`,
              metadata: {
                partner_invitation_id: invitation.id,
                organization_id: invitation.organization_id,
                organization_name: organization.name || 'Organization',
                partner_user_id: user.id,
                partner_name: partnerUser?.name || user.email || 'Partner',
                partner_email: user.email || ''
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

      toast.success('Invitation accepted successfully!')
      setInvitationKey('')
      fetchPartnerAccess()
    } catch (error: any) {
      console.error('Error accepting invitation:', error)
      toast.error(error.message || 'Failed to accept invitation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }

  const formatCurrency = (amount?: number) => {
    if (amount === null || amount === undefined) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatMonth = (monthStr: string | Date) => {
    try {
      // Handle both DATE format (YYYY-MM-DD) and month string format (YYYY-MM)
      let date: Date
      if (monthStr instanceof Date) {
        date = monthStr
      } else if (typeof monthStr === 'string') {
        // Remove timezone info if present (split on 'T' or space)
        const dateStr = monthStr.includes('T') ? monthStr.split('T')[0] : monthStr.split(' ')[0]
        const parts = dateStr.split('-')
        
        if (parts.length >= 2) {
          // Parse year and month directly to avoid timezone conversion issues
          const year = parseInt(parts[0], 10)
          const month = parseInt(parts[1], 10)
          // Create date in local timezone to avoid UTC conversion issues
          date = new Date(year, month - 1, 1)
        } else {
          return 'Invalid date'
        }
      } else {
        return 'Invalid date'
      }
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    } catch {
      return 'Invalid date'
    }
  }

  const handleRequestWithdrawal = async () => {
    if (!selectedReportForWithdrawal || !selectedProject) return

    const amount = parseFloat(withdrawalAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid withdrawal amount')
      return
    }

    if (selectedReportForWithdrawal.partner_profit_share && amount > selectedReportForWithdrawal.partner_profit_share) {
      toast.error(`Withdrawal amount cannot exceed your profit share of ${formatCurrency(selectedReportForWithdrawal.partner_profit_share)}`)
      return
    }

    setRequestingWithdrawal(true)
    try {
      const response = await fetch('/api/partners/request-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          partnerInvitationId: selectedProject.partner_invitation_id,
          organizationId: selectedProject.partner_invitations.organization_id,
          financialReportId: selectedReportForWithdrawal.id,
          notes: withdrawalNotes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if Stripe Connect onboarding is required
        if (data.requiresOnboarding) {
          toast.error('Stripe Connect onboarding required', {
            description: 'Please complete Stripe Connect onboarding to request withdrawals',
            action: {
              label: 'Complete Onboarding',
              onClick: () => window.open(data.onboardingUrl || 'https://connect.stripe.com/setup/e/acct_1SXGEs9jVu4EeqMr/o2uHo472w1Fx', '_blank')
            },
            duration: 8000
          })
          return
        }
        throw new Error(data.error || 'Failed to request withdrawal')
      }

      toast.success('Withdrawal request submitted successfully')
      setWithdrawalDialogOpen(false)
      setSelectedReportForWithdrawal(null)
      setWithdrawalAmount("")
      setWithdrawalNotes("")
    } catch (error: any) {
      console.error('Error requesting withdrawal:', error)
      toast.error(error.message || 'Failed to request withdrawal')
    } finally {
      setRequestingWithdrawal(false)
    }
  }

  const openWithdrawalDialog = (report: any) => {
    setSelectedReportForWithdrawal(report)
    setWithdrawalAmount(report.partner_profit_share?.toString() || "")
    setWithdrawalNotes("")
    setWithdrawalDialogOpen(true)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  const hasAccess = partnerAccess.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 text-center md:text-left">
          <div className="inline-block mb-3">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent mb-2">
              Partners Overview
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto md:mx-0"></div>
          </div>
          <p className="text-gray-300 mt-3">View and manage projects you have been granted access to as a partner</p>
        </div>

        {/* Invitation Key Entry */}
        {!hasAccess && (
          <Card className="mb-8 bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-2xl shadow-purple-500/10 backdrop-blur-sm hover:shadow-purple-500/20 transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Key className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white font-bold">Accept Partner Invitation</CardTitle>
                  <CardDescription className="text-gray-300 mt-1">
                    Enter your invitation key to access partner projects
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="invitationKey" className="text-white font-medium flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-400" />
                  Invitation Key
                </Label>
                <Input
                  id="invitationKey"
                  value={invitationKey}
                  onChange={(e) => setInvitationKey(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  className="bg-gray-900/50 border-gray-700 text-white mt-2 h-12 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  onKeyPress={(e) => e.key === 'Enter' && handleAcceptInvitation()}
                />
              </div>
              <Button
                onClick={handleAcceptInvitation}
                disabled={isSubmitting || !invitationKey.trim()}
                className="w-full gradient-button h-12 text-base font-semibold"
              >
                {isSubmitting ? 'Accepting...' : 'Accept Invitation'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Project Selector and Details */}
        {hasAccess && (
          <div className="space-y-6">
            {/* Project Selector */}
            <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-purple-500/20 shadow-xl backdrop-blur-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-white font-bold flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Building2 className="w-5 h-5 text-purple-400" />
                  </div>
                  Select Project
                </CardTitle>
                <CardDescription className="text-gray-300 mt-2">
                  Choose a project to view its details and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedProject?.id || ""}
                  onValueChange={(value) => {
                    const access = partnerAccess.find(a => a.id === value)
                    if (access) {
                      setSelectedProject(access)
                    }
                  }}
                >
                  <SelectTrigger className="w-full h-12 bg-gray-900/50 border-gray-700 text-white hover:border-purple-500/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all">
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {partnerAccess.map((access) => {
                      const project = access.projects
                      const organization = access.partner_invitations.organizations
                      if (!project) return null
                      return (
                        <SelectItem
                          key={access.id}
                          value={access.id}
                          className="text-white focus:bg-purple-500/20 focus:text-purple-200 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{project.name}</span>
                            <span className="text-gray-400">-</span>
                            <span className="text-gray-400">{organization?.name || 'Organization'}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Project Details */}
            {selectedProject && (
              <div className="space-y-6 transition-opacity duration-500">
                {/* Project Header */}
                <Card className="bg-[#141414] border border-black shadow-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Building2 className="w-6 h-6 text-purple-400" />
                          </div>
                          <CardTitle className="text-3xl text-white font-bold">
                            {selectedProject.projects.name}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-gray-300 text-lg mt-2 flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {selectedProject.partner_invitations.organizations?.name || 'Organization'}
                        </CardDescription>
                      </div>
                      <Badge
                        className={
                          selectedProject.projects.status === 'active'
                            ? 'bg-green-500/20 text-green-400 border-green-500/50 px-4 py-2 text-sm font-semibold'
                            : selectedProject.projects.status === 'completed'
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 px-4 py-2 text-sm font-semibold'
                            : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50 px-4 py-2 text-sm font-semibold'
                        }
                      >
                        {selectedProject.projects.status || 'Active'}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>

                {/* Project Info */}
                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_project_info && (
                  <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader 
                      className="border-b border-gray-700/50 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => setIsProjectInfoExpanded(!isProjectInfoExpanded)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <CardTitle className="text-xl text-white flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                              <Info className="w-5 h-5 text-blue-400" />
                            </div>
                            Project Information
                          </CardTitle>
                          {!isProjectInfoExpanded && partnerSettings[selectedProject.partner_invitation_id]?.can_see_progress && selectedProject.projects.progress !== null && selectedProject.projects.progress !== undefined && (
                            <div className="flex items-center gap-2 ml-4">
                              <TrendingUp className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-300 font-semibold">{selectedProject.projects.progress || 0}%</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsProjectInfoExpanded(!isProjectInfoExpanded)
                          }}
                          className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                          aria-label={isProjectInfoExpanded ? "Collapse" : "Expand"}
                        >
                          {isProjectInfoExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </CardHeader>
                    {isProjectInfoExpanded && (
                      <CardContent className="pt-6 transition-all duration-300">
                        <div className="space-y-6">
                          {selectedProject.projects.description && (
                            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                              <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide">Description</Label>
                              <p className="text-gray-200 mt-2 leading-relaxed">
                                {selectedProject.projects.description || 'No description available'}
                              </p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {partnerSettings[selectedProject.partner_invitation_id]?.can_see_dates && (
                              <>
                                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-colors">
                                  <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Created
                                  </Label>
                                  <p className="text-white mt-2 text-lg font-semibold">{formatDate(selectedProject.projects.created_at)}</p>
                                </div>
                                {selectedProject.projects.deadline && (
                                  <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-colors">
                                    <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      Deadline
                                    </Label>
                                    <p className="text-white mt-2 text-lg font-semibold">{formatDate(selectedProject.projects.deadline)}</p>
                                  </div>
                                )}
                              </>
                            )}
                            {partnerSettings[selectedProject.partner_invitation_id]?.can_see_progress && (
                              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-colors">
                                <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Progress
                                </Label>
                                <div className="mt-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-white text-lg font-semibold">{selectedProject.projects.progress || 0}%</p>
                                  </div>
                                  <div className="w-full bg-gray-700/50 rounded-full h-2.5">
                                    <div 
                                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                                      style={{ width: `${selectedProject.projects.progress || 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            {partnerSettings[selectedProject.partner_invitation_id]?.can_see_budget && selectedProject.projects.budget && (
                              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-colors">
                                <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  Budget
                                </Label>
                                <p className="text-white mt-2 text-lg font-semibold">{formatCurrency(selectedProject.projects.budget)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* Updates */}
                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_updates && (
                  <Card className="bg-[#141414] border border-black shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="border-b border-black">
                      <CardTitle className="text-xl text-white flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <FileText className="w-5 h-5 text-green-400" />
                        </div>
                        Recent Updates
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {loadingUpdates[selectedProject.projects.id] ? (
                        <div className="flex justify-center py-12">
                          <LoadingSpinner />
                        </div>
                      ) : projectUpdates[selectedProject.projects.id]?.length > 0 ? (
                        <div className="space-y-3">
                          {projectUpdates[selectedProject.projects.id].map((update) => (
                            <div 
                              key={update.id} 
                              className="group p-4 bg-black rounded-lg hover:bg-[#0a0a0a] cursor-pointer transition-all duration-300 border border-black"
                              onClick={() => router.push(`/updates/${update.id}`)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="text-white font-semibold text-lg group-hover:text-purple-300 transition-colors">{update.title}</h4>
                                  <p className="text-gray-400 text-sm mt-2 line-clamp-2 leading-relaxed">{update.description}</p>
                                  <div className="flex items-center gap-2 mt-3">
                                    <Calendar className="w-3 h-3 text-gray-500" />
                                    <p className="text-gray-500 text-xs">{formatDate(update.date)}</p>
                                  </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No updates available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Partner Notes */}
                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_updates && (
                  <Card className="bg-[#141414] border border-black shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="border-b border-black">
                      <CardTitle className="text-xl text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        Partner Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {loadingNotes[selectedProject.partner_invitation_id] ? (
                        <div className="flex justify-center py-12">
                          <LoadingSpinner />
                        </div>
                      ) : partnerNotes[selectedProject.partner_invitation_id]?.length > 0 ? (
                        <div className="space-y-4">
                          {partnerNotes[selectedProject.partner_invitation_id].map((note) => {
                            const isExpanded = expandedNotes[note.id] || false
                            return (
                              <Card key={note.id} className="bg-[#141414] border border-[#141414]">
                                <CardHeader className="pb-3">
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
                                  </CardDescription>
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
                                        <Card key={project.id} className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer" onClick={() => router.push(`/publicprojects/${project.id}`)}>
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
                                              <ExternalLink className="w-4 h-4 text-purple-400 flex-shrink-0" />
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
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No notes available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Expenses */}
                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_expenses && (
                  <Card className="bg-[#141414] border border-black shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="border-b border-black">
                      <CardTitle className="text-xl text-white flex items-center gap-3">
                        <div className="p-2 bg-yellow-500/20 rounded-lg">
                          <DollarSign className="w-5 h-5 text-yellow-400" />
                        </div>
                        Expenses
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {loadingExpenses[selectedProject.projects.id] ? (
                        <div className="flex justify-center py-12">
                          <LoadingSpinner />
                        </div>
                      ) : projectExpenses[selectedProject.projects.id]?.length > 0 ? (
                        <div className="space-y-3">
                          {projectExpenses[selectedProject.projects.id].map((expense) => (
                            <div 
                              key={expense.id} 
                              className="flex justify-between items-center p-4 bg-black rounded-lg border border-black hover:bg-[#0a0a0a] transition-all duration-300"
                            >
                              <div className="flex-1">
                                <p className="text-white font-semibold text-lg">{expense.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                                  <Badge 
                                    className={
                                      expense.status === 'approved'
                                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                        : expense.status === 'pending'
                                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                        : 'bg-red-500/20 text-red-400 border-red-500/50'
                                    }
                                  >
                                    {expense.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <p className="text-white font-bold text-xl">{formatCurrency(expense.amount)}</p>
                              </div>
                            </div>
                          ))}
                          <div className="mt-4 pt-4 border-t border-black">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400 font-medium">Total</span>
                              <span className="text-white font-bold text-xl">
                                {formatCurrency(
                                  projectExpenses[selectedProject.projects.id]?.reduce((sum, exp) => sum + exp.amount, 0) || 0
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No expenses available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Team Members */}
                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_team_members && (
                  <Card className="bg-[#141414] border border-black shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="border-b border-black">
                      <CardTitle className="text-xl text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                          <Users className="w-5 h-5 text-indigo-400" />
                        </div>
                        Team Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {loadingTeamMembers[selectedProject.projects.id] ? (
                        <div className="flex justify-center py-12">
                          <LoadingSpinner />
                        </div>
                      ) : projectTeamMembers[selectedProject.projects.id]?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {projectTeamMembers[selectedProject.projects.id].map((member) => (
                            <div 
                              key={member.id} 
                              className="p-4 bg-black rounded-lg border border-black hover:bg-[#0a0a0a] hover:border-purple-500/50 cursor-pointer transition-all duration-300 group"
                              onClick={() => router.push(`/profile/${member.user.id}`)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                                  {member.user.avatar_url ? (
                                    <img 
                                      src={member.user.avatar_url} 
                                      alt={member.user.name || 'User'} 
                                      className="w-10 h-10 rounded-full"
                                    />
                                  ) : (
                                    <span className="text-purple-400 font-semibold group-hover:text-purple-300 transition-colors">
                                      {(member.user.name || member.user.email || 'U')[0].toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-semibold text-lg truncate group-hover:text-purple-300 transition-colors">
                                    {member.user.name || 'Unknown User'}
                                  </p>
                                  {member.position && (
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs mt-1">
                                      {member.position}
                                    </Badge>
                                  )}
                                  {member.access_level && (
                                    <p className="text-gray-400 text-xs mt-1">Access Level: {member.access_level}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Mail className="w-3 h-3 text-gray-500" />
                                    <p className="text-gray-400 text-sm truncate">{member.user.email}</p>
                                  </div>
                                  {member.role === 'owner' && (
                                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 text-xs mt-2">
                                      Owner
                                    </Badge>
                                  )}
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all flex-shrink-0 opacity-0 group-hover:opacity-100" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No team members available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Project Comments */}
                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_updates && (
                  <Card className="bg-[#141414] border border-black shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="border-b border-black">
                      <CardTitle className="text-xl text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <MessageSquare className="w-5 h-5 text-blue-400" />
                        </div>
                        Project Comments
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {loadingComments[selectedProject.projects.id] ? (
                        <div className="flex justify-center py-12">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Comments List */}
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {projectComments[selectedProject.projects.id]?.length > 0 ? (
                              projectComments[selectedProject.projects.id].map((comment) => (
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
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="text-white font-semibold text-sm">
                                          {comment.user.name || 'Unknown User'}
                                        </p>
                                        <span className="text-gray-500 text-xs">
                                          {formatDate(comment.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-gray-300 text-sm leading-relaxed">
                                        {comment.content}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
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
                                <Input
                                  placeholder="Add a comment..."
                                  value={newComment[selectedProject.projects.id] || ''}
                                  onChange={(e) => setNewComment(prev => ({ ...prev, [selectedProject.projects.id]: e.target.value }))}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault()
                                      handleAddComment(selectedProject.projects.id)
                                    }
                                  }}
                                  className="bg-black border-black text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                                />
                                <Button
                                  onClick={() => handleAddComment(selectedProject.projects.id)}
                                  disabled={!newComment[selectedProject.projects.id]?.trim()}
                                  className="gradient-button px-4"
                                >
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Financial Reports */}
                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_monthly_reports && (
                  <Card className="bg-[#141414] border border-black shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="border-b border-black">
                      <CardTitle className="text-xl text-white flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <FileText className="w-5 h-5 text-green-400" />
                        </div>
                        Financial Reports
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {loadingFinancialReports ? (
                        <div className="flex justify-center py-12">
                          <LoadingSpinner />
                        </div>
                      ) : financialReports.length > 0 ? (
                        <div className="space-y-4">
                          {financialReports.map((report) => (
                            <div key={report.id} className="p-4 bg-black rounded-lg border border-black">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-semibold text-lg">
                                  {formatMonth(report.report_month)}
                                </h3>
                                {report.sent_at && (
                                  <span className="text-gray-400 text-xs">
                                    Sent {new Date(report.sent_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_revenue && (
                                  <div>
                                    <div className="text-sm text-gray-400 mb-1">Revenue</div>
                                    <div className="text-xl font-bold text-green-400">
                                      {formatCurrency(report.total_revenue)}
                                    </div>
                                  </div>
                                )}
                                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_expenses_in_reports !== false && (
                                  <div>
                                    <div className="text-sm text-gray-400 mb-1">Expenses</div>
                                    <div className="text-xl font-bold text-red-400">
                                      {formatCurrency(report.total_expenses)}
                                    </div>
                                  </div>
                                )}
                                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_net_profit_in_reports !== false && (
                                  <div>
                                    <div className="text-sm text-gray-400 mb-1">Net Profit/Loss</div>
                                    <div className={`text-xl font-bold ${report.net_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                      {formatCurrency(report.net_profit)}
                                    </div>
                                  </div>
                                )}
                                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_overall_roi_in_reports !== false && 
                                 partnerSettings[selectedProject.partner_invitation_id]?.can_see_roi && 
                                 report.roi_percentage !== null && (
                                  <div>
                                    <div className="text-sm text-gray-400 mb-1">Overall ROI</div>
                                    <div className="text-xl font-bold text-purple-400">
                                      {report.roi_percentage.toFixed(2)}%
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Partner-Specific Metrics */}
                              {(report.partner_share_percentage && report.partner_share_percentage > 0) && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                  <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                                    <Wallet className="w-4 h-4 text-purple-400" />
                                    Your Investment Details
                                  </h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {report.partner_investment_amount && report.partner_investment_amount > 0 && (
                                      <div>
                                        <div className="text-sm text-gray-400 mb-1">Your Investment</div>
                                        <div className="text-lg font-bold text-blue-400">
                                          {formatCurrency(report.partner_investment_amount)}
                                        </div>
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-sm text-gray-400 mb-1">Your Share</div>
                                      <div className="text-lg font-bold text-purple-400">
                                        {report.partner_share_percentage.toFixed(2)}%
                                      </div>
                                    </div>
                                    {report.partner_profit_share !== null && report.partner_profit_share !== undefined && (
                                      <div>
                                        <div className="text-sm text-gray-400 mb-1">Your Profit Share</div>
                                        <div className={`text-lg font-bold ${report.partner_profit_share >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                          {formatCurrency(report.partner_profit_share)}
                                        </div>
                                      </div>
                                    )}
                                    {partnerSettings[selectedProject.partner_invitation_id]?.can_see_roi && report.partner_roi_percentage !== null && (
                                      <div>
                                        <div className="text-sm text-gray-400 mb-1">Your ROI</div>
                                        <div className={`text-lg font-bold ${report.partner_roi_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                          {report.partner_roi_percentage.toFixed(2)}%
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  {report.partner_profit_share && report.partner_profit_share > 0 && (
                                    <div className="mt-4">
                                      {stripeOnboardingStatus[selectedProject.partner_invitation_id]?.completed ? (
                                        <Button
                                          onClick={() => openWithdrawalDialog(report)}
                                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                        >
                                          <ArrowDownToLine className="w-4 h-4 mr-2" />
                                          Request Withdrawal
                                        </Button>
                                      ) : (
                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                          <div className="flex items-start gap-3">
                                            <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                              <p className="text-yellow-400 font-semibold mb-2">
                                                Stripe Connect Onboarding Required
                                              </p>
                                              <p className="text-yellow-300 text-sm mb-3">
                                                You must complete Stripe Connect onboarding before you can request withdrawals. This allows us to securely transfer your profit share to your account.
                                              </p>
                                              <Button
                                                onClick={() => window.open(stripeOnboardingStatus[selectedProject.partner_invitation_id]?.url || 'https://connect.stripe.com/setup/e/acct_1SXGEs9jVu4EeqMr/o2uHo472w1Fx', '_blank')}
                                                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                                              >
                                                Complete Onboarding
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {report.net_profit < 0 && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                  <p className="text-red-400 text-sm">
                                    This month resulted in a loss. Expenses exceeded revenue.
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No financial reports available yet</p>
                          <p className="text-gray-500 text-sm mt-1">Reports will appear here once sent by the organization</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Investment */}
                {partnerSettings[selectedProject.partner_invitation_id]?.can_see_funding && selectedProject.projects.show_invest && (
                  <Card className="bg-[#141414] border border-black shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="border-b border-black">
                      <CardTitle className="text-xl text-white flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <Wallet className="w-5 h-5 text-purple-400" />
                        </div>
                        Investment Opportunity
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Funding Progress */}
                        {selectedProject.projects.funding_goal && selectedProject.projects.current_funding !== undefined && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-gray-400 text-sm font-medium">Funding Progress</Label>
                              <span className="text-white font-semibold">
                                {formatCurrency(selectedProject.projects.current_funding || 0)} / {formatCurrency(selectedProject.projects.funding_goal)}
                              </span>
                            </div>
                            <div className="w-full bg-gray-700/50 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${selectedProject.projects.funding_goal && selectedProject.projects.current_funding 
                                    ? Math.min((selectedProject.projects.current_funding / selectedProject.projects.funding_goal * 100), 100) 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                            <div className="text-right text-sm text-purple-400">
                              {selectedProject.projects.funding_goal && selectedProject.projects.current_funding 
                                ? ((selectedProject.projects.current_funding / selectedProject.projects.funding_goal * 100).toFixed(1)) 
                                : 0}% funded
                            </div>
                          </div>
                        )}

                        {/* Investment Type */}
                        {selectedProject.projects.investment_type && (
                          <div className="p-4 bg-black rounded-lg border border-black">
                            <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-2 block">Investment Type</Label>
                            <div className="flex items-center gap-2">
                              {selectedProject.projects.investment_type === 'equity' && <DollarSign className="w-4 h-4 text-purple-400" />}
                              {selectedProject.projects.investment_type === 'debt' && <Building2 className="w-4 h-4 text-purple-400" />}
                              {selectedProject.projects.investment_type === 'revenue_share' && <Target className="w-4 h-4 text-purple-400" />}
                              {selectedProject.projects.investment_type === 'donation' && <Wallet className="w-4 h-4 text-purple-400" />}
                              <span className="text-white font-semibold capitalize">
                                {selectedProject.projects.investment_type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Investment Range */}
                        {(selectedProject.projects.min_investment || selectedProject.projects.max_investment) && (
                          <div className="p-4 bg-black rounded-lg border border-black">
                            <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-2 block">Investment Range</Label>
                            <div className="flex items-center gap-4">
                              {selectedProject.projects.min_investment && (
                                <div>
                                  <span className="text-gray-400 text-xs">Min:</span>
                                  <span className="text-white font-semibold ml-2">{formatCurrency(selectedProject.projects.min_investment)}</span>
                                </div>
                              )}
                              {selectedProject.projects.max_investment && (
                                <div>
                                  <span className="text-gray-400 text-xs">Max:</span>
                                  <span className="text-white font-semibold ml-2">{formatCurrency(selectedProject.projects.max_investment)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Investment Pitch */}
                        {selectedProject.projects.investment_pitch && (
                          <div className="p-4 bg-black rounded-lg border border-black">
                            <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-2 block">Investment Pitch</Label>
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                              {selectedProject.projects.investment_pitch}
                            </p>
                          </div>
                        )}

                        {/* Payment Methods */}
                        {selectedProject.projects.payment_methods && selectedProject.projects.payment_methods.length > 0 && (
                          <div className="p-4 bg-black rounded-lg border border-black">
                            <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-2 block">Payment Methods</Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedProject.projects.payment_methods.map((method, index) => (
                                <Badge key={index} variant="outline" className="bg-gray-800/50 text-xs">
                                  {method}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Investment Period */}
                        {(selectedProject.projects.investment_start || selectedProject.projects.investment_end) && (
                          <div className="p-4 bg-black rounded-lg border border-black">
                            <Label className="text-gray-400 text-sm font-medium uppercase tracking-wide mb-2 block">Investment Period</Label>
                            <div className="text-sm text-gray-300">
                              {selectedProject.projects.investment_start && (
                                <div>Start: {formatDate(selectedProject.projects.investment_start)}</div>
                              )}
                              {selectedProject.projects.investment_end && (
                                <div>End: {formatDate(selectedProject.projects.investment_end)}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Invest Button */}
                        <Button
                          onClick={() => router.push(`/invest?project=${selectedProject.projects.id}`)}
                          className="w-full gradient-button mt-4"
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          Invest in this Project
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {hasAccess && partnerAccess.length === 0 && (
              <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 shadow-xl">
                <CardContent className="py-16 text-center">
                  <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Projects Available</h3>
                  <p className="text-gray-400">Accept an invitation to get started with partner projects.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Withdrawal Request Dialog */}
      <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Request Withdrawal</DialogTitle>
            <DialogDescription className="text-gray-400">
              Request to withdraw your profit share from this financial report
            </DialogDescription>
          </DialogHeader>
          
          {selectedReportForWithdrawal && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-black rounded-lg border border-gray-700">
                <div className="text-sm text-gray-400 mb-1">Available Profit Share</div>
                <div className="text-2xl font-bold text-green-400">
                  {formatCurrency(selectedReportForWithdrawal.partner_profit_share)}
                </div>
              </div>

              <div>
                <Label htmlFor="withdrawal-amount" className="text-white mb-2 block">
                  Withdrawal Amount
                </Label>
                <Input
                  id="withdrawal-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedReportForWithdrawal.partner_profit_share}
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="0.00"
                  className="bg-black border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum: {formatCurrency(selectedReportForWithdrawal.partner_profit_share)}
                </p>
              </div>

              <div>
                <Label htmlFor="withdrawal-notes" className="text-white mb-2 block">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="withdrawal-notes"
                  value={withdrawalNotes}
                  onChange={(e) => setWithdrawalNotes(e.target.value)}
                  placeholder="Add any notes about this withdrawal request..."
                  className="bg-black border-gray-700 text-white min-h-[100px]"
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400">
                  <Info className="w-4 h-4 inline mr-2" />
                  Your withdrawal request will be sent to the organization owner for approval. 
                  Once approved, funds will be transferred to your connected payment account.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawalDialogOpen(false)}
              disabled={requestingWithdrawal}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestWithdrawal}
              disabled={requestingWithdrawal || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {requestingWithdrawal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
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
  Building2,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  Key,
  ArrowRight,
  FileText,
  TrendingUp,
  Users,
  Clock,
  Info,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [loadingUpdates, setLoadingUpdates] = useState<Record<string, boolean>>({})
  const [loadingExpenses, setLoadingExpenses] = useState<Record<string, boolean>>({})

  // Fetch partner access on mount
  useEffect(() => {
    if (user && !authLoading) {
      fetchPartnerAccess()
    }
  }, [user, authLoading])

  const fetchPartnerAccess = async () => {
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
            created_at
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
      }
    } catch (error: any) {
      console.error('Error fetching partner access:', error)
      toast.error('Failed to load partner access')
    } finally {
      setLoading(false)
    }
  }

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

  const fetchProjectUpdates = async (projectId: string, invitationId: string) => {
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
  }

  const fetchProjectExpenses = async (projectId: string, invitationId: string) => {
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  const hasAccess = partnerAccess.length > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Partners Overview</h1>
          <p className="text-gray-400">View projects you have been granted access to as a partner</p>
        </div>

        {/* Invitation Key Entry */}
        {!hasAccess && (
          <Card className="mb-8 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Key className="w-5 h-5" />
                Accept Partner Invitation
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter your invitation key to access partner projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invitationKey" className="text-white">Invitation Key</Label>
                  <Input
                    id="invitationKey"
                    value={invitationKey}
                    onChange={(e) => setInvitationKey(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                    onKeyPress={(e) => e.key === 'Enter' && handleAcceptInvitation()}
                  />
                </div>
                <Button
                  onClick={handleAcceptInvitation}
                  disabled={isSubmitting || !invitationKey.trim()}
                  className="w-full gradient-button"
                >
                  {isSubmitting ? 'Accepting...' : 'Accept Invitation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects List */}
        {hasAccess && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partnerAccess.map((access) => {
              const project = access.projects
              const organization = access.partner_invitations.organizations
              const settings = partnerSettings[access.partner_invitation_id]
              
              if (!project || !settings) return null

              return (
                <Card
                  key={access.id}
                  className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedProject(access)
                    fetchProjectUpdates(project.id, access.partner_invitation_id)
                    fetchProjectExpenses(project.id, access.partner_invitation_id)
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{project.name}</CardTitle>
                        <CardDescription className="text-gray-400 text-sm mt-1">
                          {organization?.name || 'Organization'}
                        </CardDescription>
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
                  <CardContent>
                    <div className="space-y-3">
                      {settings.can_see_project_info && project.description && (
                        <p className="text-gray-300 text-sm line-clamp-2">{project.description}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-sm">
                        {settings.can_see_dates && project.deadline && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(project.deadline)}</span>
                          </div>
                        )}
                        {settings.can_see_progress && project.progress !== null && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <TrendingUp className="w-4 h-4" />
                            <span>{project.progress}%</span>
                          </div>
                        )}
                        {settings.can_see_budget && project.budget && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatCurrency(project.budget)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2">
                        <Eye className="w-3 h-3" />
                        <span>Partner Access</span>
                        <ArrowRight className="w-3 h-3 ml-auto" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {hasAccess && partnerAccess.length === 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">No projects available. Accept an invitation to get started.</p>
            </CardContent>
          </Card>
        )}

        {/* Project Details Dialog */}
        <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 border-gray-700">
            {selectedProject && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-white text-2xl">
                    {selectedProject.projects.name}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {selectedProject.partner_invitations.organizations?.name || 'Organization'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                  {/* Project Info */}
                  {partnerSettings[selectedProject.partner_invitation_id]?.can_see_project_info && (
                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Info className="w-5 h-5" />
                          Project Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-gray-400">Description</Label>
                            <p className="text-white mt-1">
                              {selectedProject.projects.description || 'No description available'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-gray-400">Status</Label>
                            <div className="mt-1">
                              <Badge
                                className={
                                  selectedProject.projects.status === 'active'
                                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                    : selectedProject.projects.status === 'completed'
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                    : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                }
                              >
                                {selectedProject.projects.status || 'Active'}
                              </Badge>
                            </div>
                          </div>
                          {partnerSettings[selectedProject.partner_invitation_id]?.can_see_dates && (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-gray-400">Created</Label>
                                <p className="text-white mt-1">{formatDate(selectedProject.projects.created_at)}</p>
                              </div>
                              {selectedProject.projects.deadline && (
                                <div>
                                  <Label className="text-gray-400">Deadline</Label>
                                  <p className="text-white mt-1">{formatDate(selectedProject.projects.deadline)}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {partnerSettings[selectedProject.partner_invitation_id]?.can_see_progress && (
                            <div>
                              <Label className="text-gray-400">Progress</Label>
                              <p className="text-white mt-1">{selectedProject.projects.progress || 0}%</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Updates */}
                  {partnerSettings[selectedProject.partner_invitation_id]?.can_see_updates && (
                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Recent Updates
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingUpdates[selectedProject.projects.id] ? (
                          <LoadingSpinner />
                        ) : projectUpdates[selectedProject.projects.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {projectUpdates[selectedProject.projects.id].map((update) => (
                              <div 
                                key={update.id} 
                                className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer transition-colors"
                                onClick={() => router.push(`/updates/${update.id}`)}
                              >
                                <h4 className="text-white font-semibold">{update.title}</h4>
                                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{update.description}</p>
                                <p className="text-gray-500 text-xs mt-2">{formatDate(update.date)}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400">No updates available</p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Expenses */}
                  {partnerSettings[selectedProject.partner_invitation_id]?.can_see_expenses && (
                    <Card className="bg-gray-900/50 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Expenses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingExpenses[selectedProject.projects.id] ? (
                          <LoadingSpinner />
                        ) : projectExpenses[selectedProject.projects.id]?.length > 0 ? (
                          <div className="space-y-2">
                            {projectExpenses[selectedProject.projects.id].map((expense) => (
                              <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                                <div>
                                  <p className="text-white font-medium">{expense.description}</p>
                                  <p className="text-gray-400 text-sm">{expense.category}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-white font-semibold">{formatCurrency(expense.amount)}</p>
                                  <Badge className="mt-1" variant="outline">{expense.status}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400">No expenses available</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


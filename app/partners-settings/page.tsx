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

  useEffect(() => {
    if (user && !authLoading) {
      fetchOrganizations()
    }
  }, [user, authLoading])

  useEffect(() => {
    if (selectedOrg) {
      fetchInvitations()
      fetchProjects()
    }
  }, [selectedOrg])

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

      // Create default settings
      const { error: settingsError } = await supabase
        .from('organization_partner_settings')
        .insert({
          organization_id: selectedOrg,
          partner_invitation_id: invitation.id,
          can_see_updates: false,
          can_see_project_info: true,
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
      // Create default settings if they don't exist
      setEditingSettings({
        id: '',
        organization_id: selectedOrg!,
        partner_invitation_id: invitation.id,
        can_see_updates: false,
        can_see_project_info: true,
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <LoadingSpinner />
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">You don't own any organizations. Create an organization first to manage partners.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Partner Settings</h1>
          <p className="text-gray-400">Manage partner invitations and control what they can see</p>
        </div>

        {/* Organization Selector */}
        <Card className="mb-6 bg-gray-800/50 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label className="text-white whitespace-nowrap">Organization:</Label>
              <Select value={selectedOrg || ''} onValueChange={setSelectedOrg}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white w-full md:w-[300px]">
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Create Invitation Button */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Partner Invitations</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-button">
                <Plus className="w-4 h-4 mr-2" />
                Create Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create Partner Invitation</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Generate an invitation key for partners to access your organization's projects
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label className="text-white">Email (Optional)</Label>
                  <Input
                    value={newInvitation.email}
                    onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                    placeholder="partner@example.com"
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                  />
                </div>
                <div>
                  <Label className="text-white">Expires In (Days)</Label>
                  <Select
                    value={newInvitation.expires_in_days}
                    onValueChange={(value) => setNewInvitation({ ...newInvitation, expires_in_days: value })}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">No expiration</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Projects (Select projects to grant access)</Label>
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {projects.map((project) => (
                      <div key={project.id} className="flex items-center space-x-2">
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
                          className="w-4 h-4"
                        />
                        <Label htmlFor={`project-${project.id}`} className="text-white cursor-pointer">
                          {project.name}
                        </Label>
                      </div>
                    ))}
                    {projects.length === 0 && (
                      <p className="text-gray-400 text-sm">No projects available. Create projects first.</p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateInvitation} className="gradient-button">Create</Button>
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
              <Card key={invitation.id} className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        {invitation.email || 'Partner Invitation'}
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-2">
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          <div className="flex items-center gap-2">
                            <span>Key: <code className="bg-gray-900 px-2 py-1 rounded">{invitation.invitation_key}</code></span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-1.5 text-gray-400 hover:text-white"
                              onClick={() => handleRegenerateKey(invitation.id)}
                              title="Generate New Key"
                            >
                              <Key className="w-3 h-3" />
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                          {invitation.expires_at ? (
                            <span>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</span>
                          ) : (
                            <span>Never expires</span>
                          )}
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
                    <Badge className={statusColor}>
                      {invitation.status === 'accepted' ? 'Accepted' :
                       invitation.status === 'revoked' ? 'Revoked' :
                       isExpired ? 'Expired' : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyKey(invitation.invitation_key)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Key
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSettings(invitation)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Visibility Settings
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenExpirationEdit(invitation)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Expiration
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Projects
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add Projects to Invitation</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-64 overflow-y-auto mt-4">
                          {projects.map((project) => (
                            <div key={project.id} className="flex items-center space-x-2">
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
                                className="w-4 h-4"
                              />
                              <Label htmlFor={`add-project-${project.id}`} className="text-white cursor-pointer">
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
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  </div>

                  {/* Quick Visibility Summary */}
                  {settings && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <p className="text-sm text-gray-400 mb-2">Visibility Settings:</p>
                      <div className="flex flex-wrap gap-2">
                        {settings.can_see_updates && <Badge variant="outline" className="bg-green-500/10">Updates</Badge>}
                        {settings.can_see_project_info && <Badge variant="outline" className="bg-green-500/10">Info</Badge>}
                        {settings.can_see_dates && <Badge variant="outline" className="bg-green-500/10">Dates</Badge>}
                        {settings.can_see_expenses && <Badge variant="outline" className="bg-green-500/10">Expenses</Badge>}
                        {settings.can_see_progress && <Badge variant="outline" className="bg-green-500/10">Progress</Badge>}
                        {settings.can_see_budget && <Badge variant="outline" className="bg-green-500/10">Budget</Badge>}
                        {settings.can_see_funding && <Badge variant="outline" className="bg-green-500/10">Funding</Badge>}
                        {settings.can_see_team_members && <Badge variant="outline" className="bg-green-500/10">Team</Badge>}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {invitations.length === 0 && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="py-12 text-center">
                <p className="text-gray-400">No partner invitations yet. Create one to get started.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Dialog */}
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Visibility Settings</DialogTitle>
              <DialogDescription className="text-gray-400">
                Control what partners can see for this invitation
              </DialogDescription>
            </DialogHeader>
            {editingSettings && (
              <div className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-gray-400" />
                      <Label className="text-white">Project Information</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_project_info}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_project_info: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <Label className="text-white">Updates</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_updates}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_updates: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <Label className="text-white">Dates & Deadlines</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_dates}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_dates: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <Label className="text-white">Expenses</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_expenses}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_expenses: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-gray-400" />
                      <Label className="text-white">Progress</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_progress}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_progress: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <Label className="text-white">Budget</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_budget}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_budget: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <Label className="text-white">Funding</Label>
                    </div>
                    <Switch
                      checked={editingSettings.can_see_funding}
                      onCheckedChange={(checked) =>
                        setEditingSettings({ ...editingSettings, can_see_funding: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-400" />
                      <Label className="text-white">Team Members</Label>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSettings} className="gradient-button">Save Settings</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Expiration Dialog */}
        <Dialog open={isExpirationDialogOpen} onOpenChange={setIsExpirationDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Expiration Date</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update when this invitation expires, or set it to never expire
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-white">Expiration</Label>
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
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">No expiration</SelectItem>
                    <SelectItem value="date">Set specific date</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newExpiration !== 'never' && (
                <div>
                  <Label className="text-white">Expiration Date</Label>
                  <Input
                    type="date"
                    value={newExpiration && newExpiration !== 'never' ? newExpiration : ''}
                    onChange={(e) => setNewExpiration(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white mt-2"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExpirationDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveExpiration} className="gradient-button">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}


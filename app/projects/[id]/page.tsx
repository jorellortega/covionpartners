"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Users,
  FileText,
  BarChart2,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  RefreshCw,
  UserPlus,
  Loader2,
  Check,
  Home,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { useTeamMembers, TeamMemberWithUser } from "@/hooks/useTeamMembers"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Project, User, TeamMember, MediaFile } from "@/types"
import { supabase } from "@/lib/supabase"
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
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { TaskList } from '@/components/task-list'

// Project status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "on hold":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getStatusStyles()} border`} variant="outline">
      {status}
    </Badge>
  )
}

// Helper component for displaying project status and progress
function StatusCard({ project }: { project: Project | null }) {
  if (!project) return <LoadingSpinner />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status & Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Status</span>
          <StatusBadge status={project.status || 'N/A'} />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Number(project.progress ?? 0).toFixed(0)}%</span>
          </div>
          <Progress value={Number(project.progress ?? 0)} className="w-full" />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            <span>Deadline</span>
          </div>
          <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
        </div>
         <div className="flex items-center justify-between text-sm text-muted-foreground">
           <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            <span>Created</span>
          </div>
          <span>{project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper component for displaying detailed project information
function ProjectInfoCard({ project }: { project: Project | null }) {
  if (!project) return <LoadingSpinner />

  // Function to format currency, handling null/undefined
  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount ?? 0))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Information</CardTitle>
         <CardDescription>Detailed overview of the project.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center">
          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground mr-2">Type:</span>
          <span>{project.type || 'N/A'}</span>
        </div>
         <div className="flex items-center">
           <Target className="mr-2 h-4 w-4 text-muted-foreground" />
           <span className="text-muted-foreground mr-2">ROI:</span>
           <span>{Number(project.roi ?? 0).toFixed(0)}%</span>
         </div>
        <div className="flex items-center">
          <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground mr-2">Budget:</span>
          <span>{formatCurrency(project.budget)}</span>
        </div>
        <div className="flex items-center">
           <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground mr-2">Invested:</span>
          <span>{formatCurrency(project.invested)}</span>
        </div>
         <div className="flex items-center">
           <Users className="mr-2 h-4 w-4 text-muted-foreground" />
           <span className="text-muted-foreground mr-2">Owner:</span>
           <span>{project.owner_name || project.owner_id || 'N/A'}</span>
         </div>
         <div className="flex items-center col-span-1 md:col-span-2">
           <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
           <span className="text-muted-foreground mr-2">Description:</span>
           <span className="whitespace-pre-wrap">{project.description || 'No description provided.'}</span>
         </div>
      </CardContent>
    </Card>
  )
}

// Fixing linter errors by providing default values
const safeNumber = (value: number | null | undefined) => value ?? 0;

export default function ProjectDetails() {
  const params = useParams()
  const projectId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { projects, loading: projectsLoading } = useProjects(user?.id || '')
  const { teamMembers, loading, addTeamMember, updateTeamMember, removeTeamMember, refreshTeamMembers } = useTeamMembers(projectId)
  const [project, setProject] = useState<Project | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithUser | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [availableUsers, setAvailableUsers] = useState<{
    id: string;
    project_id: string;
    user_id: string | null;
    email: string | null;
    role: string;
    status: string;
  }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newUserData, setNewUserData] = useState({
    email: '',
    name: '',
    role: ''
  })
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editProjectData, setEditProjectData] = useState<{
    name: string;
    description: string;
    status: string;
    progress: number;
  }>({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'Not Started',
    progress: project?.progress || 0,
  })
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    refreshTeamMembers()
  }, [projectId])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!projectId) {
      router.push('/projects')
      return
    }

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (error) throw error

        if (data) {
          const validatedProject = {
            ...data,
            name: data.name || 'Unnamed Project',
            type: data.type || 'General',
            status: data.status || 'active',
            progress: typeof data.progress === 'number' ? data.progress : 0,
            deadline: data.deadline || new Date().toISOString(),
            budget: typeof data.budget === 'number' ? data.budget : 0,
            invested: typeof data.invested === 'number' ? data.invested : 0,
            roi: typeof data.roi === 'number' ? data.roi : 0,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.updated_at || new Date().toISOString(),
            owner_id: data.owner_id || user?.id || 'unknown'
          }
          setProject(validatedProject)

          // Fetch owner's information
          const { data: ownerData, error: ownerError } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', validatedProject.owner_id)
            .single()

          if (!ownerError && ownerData) {
            setProject(prev => ({
              ...prev!,
              owner_name: ownerData.name || ownerData.email
            }))
          }
        } else {
          router.push('/projects')
        }
      } catch (error) {
        console.error('Error fetching project:', error)
        router.push('/projects')
      }
    }

    fetchProject()
  }, [projectId, user, authLoading, router])

  // Fetch available users that can be added to the project
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .neq('project_id', projectId) // Exclude members already in this project
          .eq('status', 'active') // Only get active members

        if (error) throw error
        setAvailableUsers(data || [])
      } catch (error) {
        console.error('Error fetching team members:', error)
      }
    }

    if (isAddDialogOpen) {
      fetchUsers()
    }
  }, [isAddDialogOpen, projectId])

  // Initialize edit form when dialog opens
  useEffect(() => {
    if (isEditDialogOpen && project) {
      setEditProjectData({
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress || 0
      })
    }
  }, [isEditDialogOpen, project])

  const handleEditMember = (member: TeamMemberWithUser) => {
    setSelectedMember(member)
    setIsEditDialogOpen(true)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      const { error } = await removeTeamMember(memberId)
      if (error) {
        console.error('Error removing team member:', error)
        // You might want to show a toast notification here
      }
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId || !selectedRole) {
      return
    }

    setIsLoading(true)
    try {
      // Get the selected team member
      const selectedMember = availableUsers.find(m => m.id === selectedUserId)
      if (!selectedMember) {
        throw new Error('Selected team member not found')
      }

      // Add the team member to this project
      const { error: teamError } = await supabase
        .from('team_members')
        .insert([{
          project_id: projectId,
          user_id: selectedMember.user_id,
          role: selectedRole,
          status: 'active',
          joined_at: new Date().toISOString()
        }])

      if (teamError) throw teamError
      
      // Refresh team members and reset form
      await refreshTeamMembers()
      setSelectedUserId('')
      setSelectedRole('')
      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.error('Error adding team member:', error)
      alert(error.message || 'Error adding team member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserData.email || !selectedRole) {
      return
    }

    setIsCreatingUser(true)
    try {
      // Create team member directly with email
      const { error: teamError } = await supabase
        .from('team_members')
        .insert([{
          project_id: projectId,
          user_id: null, // This will be a non-authenticated team member
          email: newUserData.email, // Add the email field
          role: selectedRole,
          status: 'active',
          joined_at: new Date().toISOString()
        }])

      if (teamError) {
        throw new Error(`Error adding team member: ${teamError.message}`)
      }

      // Refresh team members list
      await refreshTeamMembers()

      // Reset form and close dialog
      setNewUserData({ email: '', name: '', role: '' })
      setSelectedRole('')
      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.error('Error creating team member:', error)
      alert(error.message || 'Error creating team member')
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project || !user) return
    setIsDeleteDialogOpen(true)
  }
  
  const confirmDeleteProject = async () => {
    if (!project || !user) return

    setIsLoading(true)
    try {
      // --- Start Deleting Dependencies --- 
      
      // 1. Delete Team Members associated with the project
      console.log(`Deleting team members for project ${project.id}...`);
      const { error: teamError } = await supabase
        .from('team_members')
        .delete()
        .eq('project_id', project.id)
      if (teamError) {
           console.warn(`Could not delete some team members: ${teamError.message}`)
      }

      // 2. Delete Project Roles associated with the project
      console.log(`Deleting project roles for project ${project.id}...`);
      const { error: roleError } = await supabase
        .from('project_roles')
        .delete()
        .eq('project_id', project.id)
      if (roleError) {
        console.warn(`Could not delete project roles: ${roleError.message}`)
      }
      
      // 3. Delete Project Resources associated with the project
      console.log(`Deleting project resources for project ${project.id}...`);
      const { error: resourceError } = await supabase
        .from('project_resources')
        .delete()
        .eq('project_id', project.id)
      if (resourceError) {
        console.warn(`Could not delete project resources: ${resourceError.message}`);
      }

      // Add other potential dependencies here if needed (e.g., transactions, events)
      // Example: Delete Transactions
      // console.log(`Deleting transactions for project ${project.id}...`);
      // const { error: transactionError } = await supabase
      //   .from('transactions')
      //   .delete()
      //   .eq('project_id', project.id);
      // if (transactionError) {
      //   console.warn(`Could not delete transactions: ${transactionError.message}`);
      // }

      // --- Finished Deleting Table Dependencies --- 

      // 4. Delete Media Files from Storage
      if (project.media_files && project.media_files.length > 0) {
        const filePaths = project.media_files
                                .map(f => f.name ? `projects/${project.id}/${f.name}` : null)
                                .filter(Boolean) as string[];

        if (filePaths.length > 0) {
            console.log(`Attempting to delete ${filePaths.length} files from storage bucket 'partnerfiles'...`);
          const { error: storageError } = await supabase.storage
            .from('partnerfiles')
            .remove(filePaths)

          if (storageError) {
             console.warn(`Could not delete some files from storage: ${storageError.message}`)
          }
        }
      }

      // 5. Log IDs before attempting project deletion
      console.log(`Attempting final project delete. User ID: ${user.id}, Project Owner ID: ${project.owner_id}`)

      // --- Delete Project Itself --- 
      const { data: deletedData, error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)
        .eq('owner_id', user.id)
        .select()

      // Check if the deletion actually happened or if it failed due to RLS/ownership/FK
      if (projectError || !deletedData || deletedData.length === 0) {
        let errorMessage = projectError?.message || 'Deletion failed. The project might not exist or you might not be the owner.';
        if (projectError?.message.includes('violates row-level security policy') || projectError?.code === 'PGRST116') {
          errorMessage = `Deletion failed. You might not be the project owner or a security policy prevented it. Specific error: ${projectError?.message}`;
        } else if (projectError?.message.includes('violates foreign key constraint')) {
           // Add more context to the foreign key error message
           errorMessage = `Deletion failed due to data dependencies. Ensure related items (like resources, roles, transactions, etc.) are removed first. Specific error: ${projectError.message}`;
        } else if (projectError) {
          errorMessage = `Failed to delete project: ${projectError.message}`;
        }
        throw new Error(errorMessage);
      }

      toast.success("Project deleted successfully!")
      router.push('/projects')
    } catch (error: any) {
      console.error('Error deleting project:', error)
      toast.error(`Error deleting project: ${error.message}`)
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return

    setIsUploadingMedia(true)
    const files = Array.from(e.target.files)

    try {
      const uploadPromises = files.map(async (file) => {
        // Create a unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `projects/${projectId}/${fileName}`

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('partnerfiles')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw uploadError
        }

        console.log('File uploaded successfully:', uploadData)

        // Get aspect ratio for images
        let aspectRatio: MediaFile['aspect_ratio'] = '16:9'
        if (file.type.startsWith('image/')) {
          const img = new Image()
          img.src = URL.createObjectURL(file)
          await new Promise((resolve) => {
            img.onload = () => {
              const ratio = img.width / img.height
              if (ratio > 1.7) aspectRatio = '16:9'
              else if (ratio < 0.6) aspectRatio = '9:16'
              else aspectRatio = 'square'
              resolve(null)
            }
          })
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('partnerfiles')
          .getPublicUrl(filePath)

        // Create media file record
        const mediaFile: MediaFile = {
          name: fileName,
          type: file.type,
          size: file.size,
          url: publicUrl,
          aspect_ratio: aspectRatio,
          created_at: new Date().toISOString()
        }

        return mediaFile
      })

      const newMediaFiles = await Promise.all(uploadPromises)
      console.log('New media files:', newMediaFiles)

      // First get the current project to ensure we have the latest media_files
      const { data: currentProject, error: fetchError } = await supabase
        .from('projects')
        .select('media_files')
        .eq('id', projectId)
        .single()

      if (fetchError) {
        console.error('Error fetching current project:', fetchError)
        throw fetchError
      }

      const updatedMediaFiles = [
        ...(currentProject?.media_files || []),
        ...newMediaFiles
      ]

      console.log('Updating project with media files:', updatedMediaFiles)

      // Update project with new media files
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          media_files: updatedMediaFiles
        })
        .eq('id', projectId)

      if (updateError) {
        console.error('Error updating project:', updateError)
        throw updateError
      }

      // Update local state
      setProject(prev => ({
        ...prev!,
        media_files: updatedMediaFiles
      }))

      console.log('Media upload and database update completed successfully')

    } catch (error) {
      console.error('Detailed error uploading media:', error)
      alert('Failed to upload media. Please try again.')
    } finally {
      setIsUploadingMedia(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleDeleteMedia = async (fileName: string) => {
    if (!confirm('Are you sure you want to delete this media file?')) return

    try {
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('partnerfiles')
        .remove([`projects/${projectId}/${fileName}`])

      if (deleteError) throw deleteError

      // Update project
      const updatedMediaFiles = project?.media_files?.filter(f => f.name !== fileName) || []
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          media_files: updatedMediaFiles
        })
        .eq('id', projectId)

      if (updateError) throw updateError

      // Update local state
      setProject(prev => ({
        ...prev!,
        media_files: updatedMediaFiles
      }))

    } catch (error) {
      console.error('Error deleting media:', error)
      alert('Failed to delete media. Please try again.')
    }
  }

  const handleUpdateProject = async () => {
    if (!project) return;
    
    try {
      setIsUpdating(true)
      const { error } = await supabase
        .from('projects')
        .update({
          name: editProjectData.name,
          description: editProjectData.description,
          status: editProjectData.status,
          progress: typeof editProjectData.progress === 'number' ? editProjectData.progress : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id)

      if (error) throw error;

      // Update local state
      setProject({
        ...project,
        name: editProjectData.name,
        description: editProjectData.description,
        status: editProjectData.status,
        progress: editProjectData.progress,
        updated_at: new Date().toISOString()
      })

      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Failed to update project. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApproveRequest = async (memberId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'active' })
        .eq('id', memberId);

      if (error) throw error;
      
      toast.success('Team member approved successfully!');
      refreshTeamMembers();
    } catch (error: any) {
      console.error('Error approving team member:', error);
      toast.error('Failed to approve team member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async (memberId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      toast.success('Join request rejected');
      refreshTeamMembers();
    } catch (error: any) {
      console.error('Error rejecting team member:', error);
      toast.error('Failed to reject join request');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while authentication or projects are loading
  if (authLoading || projectsLoading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Show not found state if no project is found after loading
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Project not found</h2>
          <Button onClick={() => router.push('/projects')} className="gradient-button">
              Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  // Safely format date strings
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Safely format numbers
  const formatNumber = (num: number) => {
    try {
      return num.toLocaleString()
    } catch (error) {
      return '0'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            className="hover:bg-gray-800/50"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <Button
            variant="ghost"
            className="hover:bg-gray-800/50"
            onClick={() => router.push('/dashboard')}
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>

        <div className="space-y-6">
          <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
            {/* Edit Project Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Project</DialogTitle>
                  <DialogDescription>
                    Update project details and settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                      value={editProjectData.name}
                      onChange={(e) => setEditProjectData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter project name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={editProjectData.description}
                      onChange={(e) => setEditProjectData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Project description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editProjectData.status}
                        onValueChange={(value) => setEditProjectData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Progress ({editProjectData.progress}%)</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={editProjectData.progress || 0}
                      onChange={(e) => setEditProjectData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-purple-500"
                    />
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${editProjectData.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="gradient-button" onClick={handleUpdateProject}>
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Project Info */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Project Access */}
                <Card className="leonardo-card border-gray-800">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h1 className="text-2xl font-bold text-white mr-2">{project.name}</h1>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        className="border-gray-700 bg-gray-800/30 text-white hover:bg-gray-800/50"
                        onClick={() => {
                          const key = project?.project_key || 'COV-' + Math.random().toString(36).substring(2, 7).toUpperCase();
                          navigator.clipboard.writeText(key);
                          toast.success("Project key copied to clipboard!");
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Project
                      </Button>
                      {user && user.role !== 'investor' && (
                        <>
                          <Button
                            variant="outline"
                            className="border-gray-700 bg-gray-800/30 text-white hover:bg-gray-800/50"
                            onClick={() => setIsEditDialogOpen(true)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Project
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Project Description */}
                <Card className="leonardo-card border-gray-800">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">Project Description</CardTitle>
                    <CardDescription className="text-gray-400 text-sm sm:text-base">
                      Detailed overview of the project
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                        {project.description || 'No description available.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Media */}
                <Card className="leonardo-card border-gray-800">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">Project Media</CardTitle>
                        <CardDescription className="text-gray-400 text-sm sm:text-base">
                          Images, videos, and other media files
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => document.getElementById('media-upload')?.click()} 
                        className="gradient-button"
                        disabled={isUploadingMedia}
                      >
                        {isUploadingMedia ? (
                          <>
                            <LoadingSpinner className="w-4 h-4 mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Add Media
                          </>
                        )}
                      </Button>
                      <input
                        type="file"
                        id="media-upload"
                        className="hidden"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaUpload}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {project.media_files?.map((file, index) => (
                        <div key={index} className="relative group">
                          {file.type.startsWith('image/') ? (
                            <div className={`relative overflow-hidden rounded-lg ${
                              file.aspect_ratio === '9:16' ? 'aspect-[9/16]' :
                              file.aspect_ratio === 'square' ? 'aspect-square' :
                              'aspect-[16/9]'
                            }`}>
                              <img
                                src={file.url}
                                alt={file.name}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : file.type.startsWith('video/') ? (
                            <div className={`relative overflow-hidden rounded-lg ${
                              file.aspect_ratio === '9:16' ? 'aspect-[9/16]' :
                              file.aspect_ratio === 'square' ? 'aspect-square' :
                              'aspect-[16/9]'
                            }`}>
                              <video
                                src={file.url}
                                controls
                                className="object-cover w-full h-full"
                              />
                            </div>
                          ) : null}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-white hover:text-red-400"
                              onClick={() => handleDeleteMedia(file.name)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(!project.media_files || project.media_files.length === 0) && (
                        <div className="col-span-full text-center py-8">
                          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-400">No media files</h3>
                          <p className="text-gray-500 mt-1">Upload images or videos to showcase your project</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Project Overview */}
                <Card className="mb-6">
                  <CardHeader className="p-4">
                    <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row items-start md:items-center justify-between w-full">
                      <div>
                        <CardTitle>Project Overview</CardTitle>
                        <CardDescription>Key details and progress of the project</CardDescription>
                      </div>
                      {user?.role !== 'investor' && (
                        <div className="flex gap-2 w-full md:w-auto justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditDialogOpen(true)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit Project
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 sm:p-4 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center text-gray-400 mb-2 text-sm sm:text-base">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>Created</span>
                          </div>
                          <div className="text-white font-medium text-sm sm:text-base">
                            {formatDate(project.created_at)}
                          </div>
                        </div>
                        <div className="p-3 sm:p-4 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center text-gray-400 mb-2 text-sm sm:text-base">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>Deadline</span>
                          </div>
                          <div className="text-white font-medium text-sm sm:text-base">
                            {formatDate(project.deadline)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Progress:</span>
                          <div className="w-full">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${safeNumber(project.progress)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 sm:p-4 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center text-gray-400 mb-2 text-sm sm:text-base">
                            <DollarSign className="w-4 h-4 mr-2" />
                            <span>Budget</span>
                          </div>
                          <div className="text-white font-medium text-sm sm:text-base">${formatNumber(project.budget)}</div>
                        </div>
                        <div className="p-3 sm:p-4 bg-gray-800/30 rounded-lg">
                          <div className="flex items-center text-gray-400 mb-2 text-sm sm:text-base">
                            <Building2 className="w-4 h-4 mr-2" />
                            <span>Type</span>
                          </div>
                          <div className="text-white font-medium text-sm sm:text-base">{project.type || 'Unknown'}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Access */}
                <Card className="mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Project Access</CardTitle>
                        <CardDescription>Share access to this project with team members</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="bg-gray-800/30 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">Project Key</div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              navigator.clipboard.writeText(project?.project_key || 'COV-' + Math.random().toString(36).substring(2, 7).toUpperCase());
                              toast.success("Project key copied to clipboard!");
                            }}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Key
                          </Button>
                        </div>
                        <div className="font-mono text-xl bg-gray-900/50 p-3 rounded flex items-center justify-center">
                          {project?.project_key || 'COV-' + Math.random().toString(36).substring(2, 7).toUpperCase()}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          Share this key with users you want to invite to the project. They can use it to request access.
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-sm font-medium">Pending Join Requests</div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={refreshTeamMembers}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {teamMembers
                            .filter(member => member.status === 'pending')
                            .map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-medium">
                                      {member.user.name?.charAt(0) || member.user.email?.charAt(0) || '?'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-white font-medium">
                                      {member.user.name || member.user.email}
                              </div>
                            <div className="text-sm text-gray-400">
                                      Requested {new Date(member.joined_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                                <div className="flex items-center gap-2">
                            <Button
                                    variant="outline"
                              size="sm"
                                    className="text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                    onClick={() => handleApproveRequest(member.id)}
                            >
                                    <Check className="w-4 h-4" />
                            </Button>
                            <Button
                                    variant="outline"
                              size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                    onClick={() => handleRejectRequest(member.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                          {!loading && teamMembers.filter(member => member.status === 'pending').length === 0 && (
                        <div className="text-center py-6">
                          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-400">
                                No pending requests
                          </h3>
                          <p className="text-gray-500 mt-1">
                                Share your project key to invite team members
                          </p>
                        </div>
                      )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Details */}
                <div className="space-y-6">
                  <div className="bg-card p-6 rounded-lg border">
                    <h2 className="text-2xl font-bold mb-4">Project Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground">{project.description}</p>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Status</h3>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            project.status === 'active' ? 'bg-green-500' :
                            project.status === 'pending' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} />
                          <span className="capitalize">{project.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <TaskList projectId={project.id} />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-md w-full mx-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-bold">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-gray-400 mt-2">
                Are you sure you want to delete this project? This will also delete associated team members, roles, resources, and media files. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-end mt-4 space-x-2">
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-gray-800/50"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={confirmDeleteProject}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Project"
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


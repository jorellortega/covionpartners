"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  CheckSquare,
  Plus,
  Lock,
  Unlock,
  MessageCircle,
  Send,
  Settings,
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
import { Textarea } from "@/components/ui/textarea"

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
            <span className="text-gray-400 flex items-center">
              <BarChart2 className="w-4 h-4 mr-2" />
              Progress
            </span>
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
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editProjectData, setEditProjectData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || '',
    progress: project?.progress || 0,
  })
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
  })
  const [editingTask, setEditingTask] = useState<any>(null)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [schedule, setSchedule] = useState<any[]>([])
  const [isEditingSchedule, setIsEditingSchedule] = useState(false)
  const [editingScheduleItem, setEditingScheduleItem] = useState<any>(null)
  const [isDeletingTask, setIsDeletingTask] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isDeletingSchedule, setIsDeletingSchedule] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)
  const [comments, setComments] = useState<Array<{
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    user?: {
      name: string;
      email: string;
    };
  }>>([])
  const [newComment, setNewComment] = useState('')
  const [isDeletingComment, setIsDeletingComment] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

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
    if (isEditing && project) {
      setEditProjectData({
        name: project.name,
        description: project.description,
        status: project.status,
        progress: project.progress || 0,
      })
    }
  }, [isEditing, project])

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!projectId) return
      
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('due_date', { ascending: true })

        if (error) throw error
        setTasks(data || [])
      } catch (error) {
        console.error('Error fetching tasks:', error)
        toast.error('Failed to load tasks')
      }
    }

    fetchTasks()
  }, [projectId])

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!projectId) return;

      try {
        const { data, error } = await supabase
          .from('schedule')
          .select('*')
          .eq('project_id', projectId)
          .order('start_time', { ascending: true });

        if (error) throw error;
        setSchedule(data || []);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        toast.error('Failed to load schedule');
      }
    };

    fetchSchedule();
  }, [projectId]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!projectId) return;
      
      try {
        // First fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('project_comments')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (commentsError) throw commentsError;

        // Then fetch user details for each comment
        const commentsWithUsers = await Promise.all(
          (commentsData || []).map(async (comment) => {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', comment.user_id)
              .single();

            if (userError) {
              console.error('Error fetching user data:', userError);
              return {
                ...comment,
                user: { name: 'Unknown User', email: null }
              };
            }

            return {
              ...comment,
              user: userData
            };
          })
        );
        
        setComments(commentsWithUsers);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      }
    };

    fetchComments();
  }, [projectId]);

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
    if (!project) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id)

      if (error) throw error;

      toast.success('Project deleted successfully')
      router.push('/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
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
      const { error } = await supabase
        .from('projects')
        .update({
          name: editProjectData.name,
          description: editProjectData.description,
          status: editProjectData.status,
          progress: editProjectData.progress,
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

      setIsEditing(false)
      toast.success('Project updated successfully')
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
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

  const handleAddTask = async () => {
    if (!user || !projectId) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          project_id: projectId,
          created_by: user.id,
          status: 'pending',
          assigned_to: newTask.assigned_to || null,
        }])
        .select()
        .single()

      if (error) throw error

      setTasks(prev => [...prev, data])
      setIsAddingTask(false)
      setNewTask({
        title: '',
        description: '',
        assigned_to: '',
        due_date: '',
        priority: 'medium',
      })
      toast.success('Task added successfully')
    } catch (error) {
      console.error('Error adding task:', error)
      toast.error('Failed to add task')
    }
  }

  const handleEditTask = async () => {
    if (!editingTask || !projectId) return

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editingTask.title,
          description: editingTask.description,
          due_date: editingTask.due_date,
          priority: editingTask.priority,
          status: editingTask.status,
          assigned_to: editingTask.assigned_to || null,
        })
        .eq('id', editingTask.id)

      if (error) throw error

      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? editingTask : task
      ))
      setIsEditingTask(false)
      setEditingTask(null)
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.filter(task => task.id !== taskId))
      setIsDeletingTask(false)
      setTaskToDelete(null)
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  const startEditingTask = (task: any) => {
    setEditingTask({ ...task })
    setIsEditingTask(true)
  }

  // Add new schedule item button handler
  const handleAddNewScheduleClick = () => {
    setEditingScheduleItem({
      description: '',
      notes: '',
      start_time: new Date().toISOString().split('T')[0],
      project_id: projectId
    });
    setIsEditingSchedule(true);
  };

  // Add Schedule Item
  const handleAddScheduleItem = async () => {
    if (!projectId || !user || !editingScheduleItem?.description || !editingScheduleItem?.start_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newItem = {
        project_id: projectId,
        description: editingScheduleItem.description,
        notes: editingScheduleItem.notes || null,
        start_time: new Date(editingScheduleItem.start_time).toISOString(),
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('schedule')
        .insert([newItem])
        .select()
        .single();

      if (error) throw error;

      setSchedule(prev => [...prev, data]);
      setIsEditingSchedule(false);
      setEditingScheduleItem(null);
      toast.success('Schedule item added successfully');
    } catch (error) {
      console.error('Error adding schedule item:', error);
      toast.error('Failed to add schedule item');
    }
  };

  // Edit Schedule Item
  const handleEditScheduleItem = async () => {
    if (!editingScheduleItem?.id || !projectId) return;

    try {
      const { error } = await supabase
        .from('schedule')
        .update({
          description: editingScheduleItem.description,
          notes: editingScheduleItem.notes,
          start_time: editingScheduleItem.start_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingScheduleItem.id);

      if (error) throw error;

      setSchedule(prev => prev.map(item =>
        item.id === editingScheduleItem.id ? editingScheduleItem : item
      ));
      setIsEditingSchedule(false);
      setEditingScheduleItem(null);
      toast.success('Schedule item updated successfully');
    } catch (error) {
      console.error('Error updating schedule item:', error);
      toast.error('Failed to update schedule item');
    }
  };

  // Delete Schedule Item
  const handleDeleteScheduleItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('schedule')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setSchedule(prev => prev.filter(item => item.id !== itemId));
      setIsDeletingSchedule(false);
      setScheduleToDelete(null);
      toast.success('Schedule item deleted successfully');
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      toast.error('Failed to delete schedule item');
    }
  };

  // Start editing a schedule item
  const startEditingScheduleItem = (item: any) => {
    setEditingScheduleItem({ ...item });
    setIsEditingSchedule(true);
  };

  // Explicitly type 'prev' in functions
  const handleChange = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>, field: keyof T, value: any) => {
    setter((prev: T) => ({ ...prev, [field]: value }))
  }

  const checkTeamMembership = async () => {
    if (!user || !projectId) return false;
    
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking team membership:', error);
        return false;
      }

      console.log('Team membership check result:', data);
      return !!data;
    } catch (error) {
      console.error('Error in team membership check:', error);
      return false;
    }
  };

  const handleAddComment = async () => {
    if (!user || !projectId || !newComment.trim()) {
      console.error('Missing required data:', { user, projectId, newComment });
      toast.error('Please ensure you are logged in and have entered a comment');
      return;
    }

    try {
      // Prepare comment data
      const commentData = {
        project_id: projectId,
        user_id: user.id,
        content: newComment.trim(),
        created_at: new Date().toISOString()
      };

      console.log('Submitting comment with data:', commentData);

      // Insert the comment
      const { data: insertedComment, error: insertError } = await supabase
        .from('project_comments')
        .insert([commentData])
        .select()
        .single();

      if (insertError) {
        console.error('Error adding comment:', insertError);
        throw new Error(insertError.message || 'Failed to add comment');
      }

      if (!insertedComment) {
        throw new Error('No data returned from comment insertion');
      }

      // Get the user data
      const { data: userData } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', user.id)
        .single();

      // Add the comment with user data to the state
      const commentWithUser = {
        ...insertedComment,
        user: userData || { name: user.email, email: user.email }
      };

      setComments(prev => [commentWithUser, ...prev]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error: any) {
      console.error('Error in handleAddComment:', error);
      toast.error(error.message || 'Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(comment => comment.id !== commentId));
      setIsDeletingComment(false);
      setCommentToDelete(null);
      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleTogglePublic = async () => {
    if (!project) return;
    
    try {
      const newVisibility = project.visibility === 'public' ? 'private' : 'public';
      const { error } = await supabase
        .from('projects')
        .update({ visibility: newVisibility })
        .eq('id', project.id);

      if (error) {
        console.error('Database error:', error);
        throw new Error(error.message || 'Failed to update project visibility');
      }

      // Update local state
      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          visibility: newVisibility,
          updated_at: new Date().toISOString()
        };
      });

      toast.success(`Project is now ${newVisibility}`);
    } catch (error: any) {
      console.error('Error updating project visibility:', error);
      toast.error(error.message || 'Failed to update project visibility');
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
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4">
          <Button
            variant="ghost"
              className="text-gray-400 hover:text-purple-400 w-fit"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
            
            <div className="flex flex-col space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{project?.name}</h1>
                <p className="text-gray-400 text-sm sm:text-base mt-1">{project?.description || 'No description available'}</p>
        </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
                <StatusBadge status={project?.status || 'Unknown'} />
                </div>
              </div>
              </div>
            </div>
          </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Project Info */}
          <div className="lg:col-span-2 space-y-6">
                {/* Project Media */}
                <Card className="leonardo-card border-gray-800">
              <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                    <CardTitle>Project Media</CardTitle>
                    <CardDescription className="text-gray-400">
                          Images, videos, and other media files
                        </CardDescription>
                      </div>
                  {user?.role !== 'viewer' && user?.role !== 'investor' && (
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
                  )}
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
              <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project?.media_files?.map((file, index) => (
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
                      {user?.role !== 'investor' && (
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
                      )}
                        </div>
                      ))}
                  {(!project?.media_files || project.media_files.length === 0) && (
                        <div className="col-span-full text-center py-8">
                          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-400">No media files</h3>
                          <p className="text-gray-500 mt-1">Upload images or videos to showcase your project</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Project Description */}
                <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
                <CardDescription className="text-gray-400">
                      Detailed overview of the project
                    </CardDescription>
                  </CardHeader>
              <CardContent>
                    <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    {project?.description || 'No description available.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Project Access */}
                {user?.role !== 'viewer' && (
                  <Card className="leonardo-card border-gray-800">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Project Access</CardTitle>
                          <CardDescription className="text-gray-400">
                            Share access to this project with team members
                          </CardDescription>
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
                )}

            {/* Schedule Section */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Project Schedule
                    </CardTitle>
                    <CardDescription>Track important project dates and milestones</CardDescription>
                      </div>
                  {user?.role !== 'viewer' && (
                    <Button
                      onClick={handleAddNewScheduleClick}
                      className="gradient-button w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Schedule Item
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schedule.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between p-4 rounded-lg border border-gray-800 bg-gray-900/50 hover:bg-gray-900/80 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="min-w-[100px] text-sm text-gray-400">
                          {new Date(item.start_time).toLocaleDateString()}
                      </div>
                      <div>
                          <h4 className="text-lg font-medium text-white">{item.description}</h4>
                          {item.notes && (
                            <p className="mt-1 text-sm text-gray-400">{item.notes}</p>
                          )}
                        </div>
                      </div>
                      {user?.role !== 'viewer' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-blue-400"
                            onClick={() => {
                              setEditingScheduleItem(item);
                              setIsEditingSchedule(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-400"
                            onClick={() => {
                              setScheduleToDelete(item.id)
                              setIsDeletingSchedule(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      </div>
                  ))}
                    </div>
              </CardContent>
            </Card>

            {/* Tasks Section */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <CheckSquare className="w-5 h-5 mr-2" />
                      Project Tasks
                    </CardTitle>
                    <CardDescription>Manage project tasks and assignments</CardDescription>
                  </div>
                  {user?.role !== 'viewer' && (
                    <Button onClick={() => setIsAddingTask(true)} className="gradient-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Task
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button
                    variant="outline"
                    className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/30"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pending ({tasks.filter(task => task.status === 'pending').length})
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    In Progress ({tasks.filter(task => task.status === 'in_progress').length})
                  </Button>
                  <Button
                    variant="outline"
                    className="bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completed ({tasks.filter(task => task.status === 'completed').length})
                  </Button>
                </div>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-lg font-semibold text-white">{task.title}</h4>
                          <p className="text-sm text-gray-400">{task.description}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-gray-400 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {new Date(task.due_date).toLocaleDateString()} at {new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              task.priority === 'high'
                                ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                : task.priority === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                : 'bg-green-500/20 text-green-400 border-green-500/50'
                            }
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        {user?.role !== 'viewer' && (
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${
                                  task.status === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                    : 'text-yellow-400/50 hover:text-yellow-400 hover:bg-yellow-500/20'
                                }`}
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('tasks')
                                    .update({ status: 'pending' })
                                    .eq('id', task.id);
                                  if (!error) {
                                    setTasks(prev => prev.map(t => 
                                      t.id === task.id ? { ...t, status: 'pending' } : t
                                    ));
                                  }
                                }}
                              >
                                <Clock className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${
                                  task.status === 'in_progress'
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                    : 'text-blue-400/50 hover:text-blue-400 hover:bg-blue-500/20'
                                }`}
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('tasks')
                                    .update({ status: 'in_progress' })
                                    .eq('id', task.id);
                                  if (!error) {
                                    setTasks(prev => prev.map(t => 
                                      t.id === task.id ? { ...t, status: 'in_progress' } : t
                                    ));
                                  }
                                }}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className={`${
                                  task.status === 'completed'
                                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                    : 'text-green-400/50 hover:text-green-400 hover:bg-green-500/20'
                                }`}
                                onClick={async () => {
                                  const { error } = await supabase
                                    .from('tasks')
                                    .update({ status: 'completed' })
                                    .eq('id', task.id);
                                  if (!error) {
                                    setTasks(prev => prev.map(t => 
                                      t.id === task.id ? { ...t, status: 'completed' } : t
                                    ));
                                  }
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-blue-400"
                                onClick={() => startEditingTask(task)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-red-400"
                                onClick={() => {
                                  setTaskToDelete(task.id)
                                  setIsDeletingTask(true)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Project Comments
                    </CardTitle>
                    <CardDescription>Discuss project details and updates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Add Comment */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {user?.name?.[0] || user?.email?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">
                          {user?.name || user?.email || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-400">Commenting as yourself</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 min-h-[80px] bg-gray-800/30"
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className="gradient-button self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div key={comment.id} className="flex gap-4 p-4 bg-gray-800/30 rounded-lg">
                        <Avatar>
                          <AvatarFallback>
                            {comment.user?.name?.[0] || comment.user?.email?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {comment.user?.name || comment.user?.email || 'Unknown User'}
                              </span>
                              <span className="text-sm text-gray-400">
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                            </div>
                            {comment.user_id === user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-red-400"
                                onClick={() => {
                                  setCommentToDelete(comment.id);
                                  setIsDeletingComment(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <p className="mt-2 text-gray-300">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <div className="text-center py-6">
                        <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400">No comments yet</h3>
                        <p className="text-gray-500 mt-1">Be the first to comment on this project</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
                  </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Team Members
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Project team and collaborators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                            <span className="text-white font-medium">
                              {member.user?.name?.[0] || member.user?.email?.[0] || '?'}
                            </span>
                </div>
                          <div>
                            <h4 className="font-medium text-white">{member.user?.name || member.user?.email}</h4>
                            <p className="text-sm text-gray-400">{member.role}</p>
              </div>
            </div>
                        {user?.role !== 'viewer' && user?.role !== 'investor' && (
                        <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditMember(member)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
        </div>
                        )}
      </div>
                    </div>
                  ))}
                  {user?.role !== 'viewer' && user?.role !== 'investor' && (
                    <Button
                      className="w-full gradient-button"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Team Member
                    </Button>
                  )}
                  </div>
              </CardContent>
            </Card>

            {/* Project Actions */}
            {user?.role !== 'viewer' && (
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Actions
                  </CardTitle>
                  <CardDescription>Manage project settings and visibility</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[200px] justify-center items-center gap-2 bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-4 h-4" /> Edit Project
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[200px] justify-center items-center gap-2 bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      <Trash2 className="w-4 h-4" /> Delete Project
                    </Button>
                    <Button
                      variant="outline"
                      className={`flex-1 min-w-[200px] justify-center items-center gap-2 ${
                        project?.visibility === 'public'
                          ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                          : 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                      }`}
                      onClick={handleTogglePublic}
                    >
                      {project?.visibility === 'public' ? (
                        <>
                          <Lock className="w-4 h-4" /> Make Private
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4" /> Make Public
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
              </div>
            </div>
          </main>

      {/* Edit Project Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
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
                value={editProjectData.progress}
                onChange={(e) => setEditProjectData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProject} className="gradient-button">
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteProject} className="bg-red-500 hover:bg-red-600">
              Delete Project
            </Button>
    </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>Create a new task for your project</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="Enter task title"
              />
    </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            <div>
              <Label>Assigned To</Label>
              <Select
                value={newTask.assigned_to}
                onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(member => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="datetime-local"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={newTask.priority}
                onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setIsAddingTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} className="gradient-button">
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditingTask} onOpenChange={setIsEditingTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editingTask?.title || ''}
                onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={editingTask?.description || ''}
                onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="datetime-local"
                value={editingTask?.due_date || ''}
                onChange={(e) => setEditingTask(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={editingTask?.priority || 'medium'}
                onValueChange={(value) => setEditingTask(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editingTask?.status || 'pending'}
                onValueChange={(value) => setEditingTask(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button variant="outline" onClick={() => setIsEditingTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTask} className="gradient-button">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditingSchedule} onOpenChange={setIsEditingSchedule}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingScheduleItem?.id ? 'Edit Schedule Item' : 'Add Schedule Item'}</DialogTitle>
            <DialogDescription>
              {editingScheduleItem?.id ? 'Update the schedule item details' : 'Add a new schedule item'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editingScheduleItem?.description || ''}
                onChange={(e) => setEditingScheduleItem(prev => ({
                  ...prev,
                  description: e.target.value
                }))}
                placeholder="Enter description"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                value={editingScheduleItem?.notes || ''}
                onChange={(e) => setEditingScheduleItem(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                placeholder="Add any additional notes"
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={editingScheduleItem?.start_time ? new Date(editingScheduleItem.start_time).toISOString().split('T')[0] : ''}
                onChange={(e) => setEditingScheduleItem(prev => ({
                  ...prev,
                  start_time: e.target.value
                }))}
              />
            </div>
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => {
                setIsEditingSchedule(false);
                setEditingScheduleItem(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={editingScheduleItem?.id ? handleEditScheduleItem : handleAddScheduleItem}
                className="gradient-button"
              >
                {editingScheduleItem?.id ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Task Confirmation Dialog */}
      <Dialog open={isDeletingTask} onOpenChange={setIsDeletingTask}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeletingTask(false)
                setTaskToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
              onClick={() => taskToDelete && handleDeleteTask(taskToDelete)}
            >
              Delete Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Schedule Confirmation Dialog */}
      <Dialog open={isDeletingSchedule} onOpenChange={setIsDeletingSchedule}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Schedule Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeletingSchedule(false)
                setScheduleToDelete(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
              onClick={() => scheduleToDelete && handleDeleteScheduleItem(scheduleToDelete)}
            >
              Delete Schedule Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Confirmation Dialog */}
      <Dialog open={isDeletingComment} onOpenChange={setIsDeletingComment}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeletingComment(false);
                setCommentToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
              onClick={() => commentToDelete && handleDeleteComment(commentToDelete)}
            >
              Delete Comment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
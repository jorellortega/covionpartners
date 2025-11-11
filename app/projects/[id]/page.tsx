"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
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
  Download,
  Briefcase,
  Link,
  User as UserIcon,
  Video,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileType,
  FileJson,
  FileX,
  Eye,
  Archive,
  StickyNote,
  List,
  Grid,
  AlignJustify,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { useTeamMembers, TeamMemberWithUser } from "@/hooks/useTeamMembers"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Project, User, TeamMember, MediaFile, ProjectFile } from "@/types"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { TaskList } from '@/components/task-list'
import { Textarea } from "@/components/ui/textarea"
import { QRCodeCanvas } from 'qrcode.react'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MultiSelect } from "@/components/ui/multiselect"
import Image from "next/image"
import Cropper from 'react-easy-crop'

// Project status badge component
function StatusBadge({ status, projectId, onStatusChange }: { status: string, projectId: string, onStatusChange?: (newStatus: string) => void }) {
  const [isUpdating, setIsUpdating] = useState(false)

  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "on hold":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!onStatusChange) return
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId)

      if (error) throw error
      if (!data) throw new Error('No task returned from insert')
      if (!data) throw new Error('No task returned from insert')
      onStatusChange(newStatus)
      toast.success('Status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!onStatusChange) {
  return (
    <Badge className={`${getStatusStyles()} border`} variant="outline">
      {status}
    </Badge>
    )
  }

  return (
    <Select
      value={status.toLowerCase()}
      onValueChange={handleStatusUpdate}
      disabled={isUpdating}
    >
      <SelectTrigger className={`w-[130px] ${getStatusStyles()} border hover:bg-gray-800/50`}>
        <SelectValue>
          {isUpdating ? (
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </div>
          ) : (
            status
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending" className="text-yellow-400 hover:bg-yellow-500/20 focus:bg-yellow-500/20">
          Pending
        </SelectItem>
        <SelectItem value="active" className="text-green-400 hover:bg-green-500/20 focus:bg-green-500/20">
          Active
        </SelectItem>
        <SelectItem value="completed" className="text-blue-400 hover:bg-blue-500/20 focus:bg-blue-500/20">
          Completed
        </SelectItem>
        <SelectItem value="on hold" className="text-red-400 hover:bg-red-500/20 focus:bg-red-500/20">
          On Hold
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

// Helper component for displaying project status and progress
function StatusCard({ project, onStatusChange, canChangeStatus }: { project: Project | null, onStatusChange?: (newStatus: string) => void, canChangeStatus?: boolean }) {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeadlineDialog, setShowDeadlineDialog] = useState(false)
  const [newDeadline, setNewDeadline] = useState(project?.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '')

  if (!project) return null;

  const handleDeadlineUpdate = async () => {
    if (!project) return
    
    setIsUpdating(true)
    try {
      let deadlineValue = null
      
      // If a deadline is provided, format it properly
      if (newDeadline && newDeadline.trim()) {
        const deadlineDate = new Date(newDeadline)
        deadlineDate.setHours(23, 59, 59, 999)
        deadlineValue = deadlineDate.toISOString()
      }
      
      const { error } = await supabase
        .from('projects')
        .update({ deadline: deadlineValue })
        .eq('id', project.id)

      if (error) throw error
      if (!data) throw new Error('No task returned from update')
      if (!data) throw new Error('No task returned from update')
      
      toast.success('Deadline updated successfully')
      setShowDeadlineDialog(false)
      
      // Update the local project state instead of reloading the page
      if (project) {
        project.deadline = deadlineValue || undefined
      }
      
      // Refresh the page to show updated deadline
      window.location.reload()
    } catch (error) {
      console.error('Error updating deadline:', error)
      toast.error('Failed to update deadline')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status & Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Current Status</span>
          <StatusBadge 
            status={project.status || 'N/A'} 
            projectId={project.id}
            onStatusChange={onStatusChange}
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400 flex items-center">
              <BarChart2 className="w-4 h-4 mr-2" />
              Progress
            </span>
            <span>{Number(project.progress ?? 0).toFixed(0)}%</span>
          </div>
          <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${Number(project.progress ?? 0)}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            <span>Deadline</span>
          </div>
          {canChangeStatus ? (
            <button
              onClick={() => setShowDeadlineDialog(true)}
              className="hover:text-primary transition-colors"
            >
              {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
            </button>
          ) : (
            <span>{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
          )}
        </div>
        <Dialog open={showDeadlineDialog} onOpenChange={setShowDeadlineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Deadline</DialogTitle>
              <DialogDescription>
                Choose a new deadline for this project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeadlineDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeadlineUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Deadline'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
  if (!project) return null;

  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetValue, setBudgetValue] = useState(project.budget?.toString() || '0')
  const [isEditingType, setIsEditingType] = useState(false)
  const [typeValue, setTypeValue] = useState(project.type || '')
  const [isUpdating, setIsUpdating] = useState(false)

  const validProjectTypes = ["investment", "collaboration", "development", "research", "consulting"]

  // Function to format currency, handling null/undefined
  const formatCurrency = (amount: number | null | undefined) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount ?? 0))
  }

  const handleBudgetUpdate = async () => {
    try {
      setIsUpdating(true)
      const { error } = await supabase
        .from('projects')
        .update({ budget: Number(budgetValue) })
        .eq('id', project.id)

      if (error) throw error

      // Update the project object
      project.budget = Number(budgetValue)
      setIsEditingBudget(false)
      toast.success('Budget updated successfully')
    } catch (error) {
      console.error('Error updating budget:', error)
      toast.error('Failed to update budget')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleTypeUpdate = async () => {
    try {
      setIsUpdating(true)
      const { error } = await supabase
        .from('projects')
        .update({ type: typeValue })
        .eq('id', project.id)

      if (error) throw error

      // Update the project object
      project.type = typeValue
      setIsEditingType(false)
      toast.success('Project type updated successfully')
    } catch (error) {
      console.error('Error updating project type:', error)
      toast.error('Failed to update project type')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="border-purple-500/20">
      <CardHeader>
        <CardTitle className="text-purple-500">Project Information</CardTitle>
        <CardDescription>Detailed overview of the project.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex items-center">
          <Building2 className="mr-2 h-4 w-4 text-purple-500" />
          <span className="text-muted-foreground mr-2">Type:</span>
          {isEditingType ? (
            <div className="flex items-center gap-2">
              <Select value={typeValue} onValueChange={setTypeValue}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {validProjectTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTypeUpdate}
                disabled={isUpdating}
                className="hover:bg-purple-500 hover:text-white"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingType(false)
                  setTypeValue(project.type || '')
                }}
                className="hover:bg-purple-500/10 hover:text-purple-500"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{project.type ? project.type.charAt(0).toUpperCase() + project.type.slice(1) : 'N/A'}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingType(true)}
                className="hover:bg-purple-500/10 hover:text-purple-500"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <Target className="mr-2 h-4 w-4 text-purple-500" />
          <span className="text-muted-foreground mr-2">ROI:</span>
          <span>{Number(project.roi ?? 0).toFixed(0)}%</span>
        </div>
        <div className="flex items-center">
          <DollarSign className="mr-2 h-4 w-4 text-purple-500" />
          <span className="text-muted-foreground mr-2">Budget:</span>
          {isEditingBudget ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                className="w-32 border-purple-500/20 focus:border-purple-500"
                min="0"
                step="0.01"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleBudgetUpdate}
                disabled={isUpdating}
                className="border-purple-500/20 hover:bg-purple-500/10"
              >
                {isUpdating ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditingBudget(false)
                  setBudgetValue(project.budget?.toString() || '0')
                }}
                className="hover:bg-purple-500/10"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{formatCurrency(project.budget)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingBudget(true)}
                className="hover:bg-purple-500/10"
              >
                <Pencil className="h-4 w-4 text-purple-500" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <DollarSign className="mr-2 h-4 w-4 text-purple-500" />
          <span className="text-muted-foreground mr-2">Invested:</span>
          <span>{formatCurrency(project.invested)}</span>
        </div>
        <div className="flex items-center">
          <Users className="mr-2 h-4 w-4 text-purple-500" />
          <span className="text-muted-foreground mr-2">Owner:</span>
          <span>{project.owner_name || project.owner_id || 'N/A'}</span>
        </div>
        <div className="flex items-center col-span-1 md:col-span-2">
          <FileText className="mr-2 h-4 w-4 text-purple-500" />
          <span className="text-muted-foreground mr-2">Description:</span>
          <span className="whitespace-pre-wrap">{project.description || 'No description provided.'}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Fixing linter errors by providing default values
const safeNumber = (value: number | null | undefined) => value ?? 0;

// Add formatFileSize function before getFileIcon
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Update getFileIcon function with correct icon names
const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-400" />
  if (fileType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-purple-400" />
  if (fileType.startsWith('audio/')) return <FileAudio className="w-5 h-5 text-green-400" />
  if (fileType.includes('pdf')) return <FileType className="w-5 h-5 text-red-400" />
  if (fileType.includes('word') || fileType.includes('doc')) return <FileText className="w-5 h-5 text-blue-500" />
  if (fileType.includes('excel') || fileType.includes('sheet')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return <FileText className="w-5 h-5 text-orange-500" />
  if (fileType.includes('zip') || fileType.includes('rar')) return <FileArchive className="w-5 h-5 text-yellow-400" />
  if (fileType.includes('code') || fileType.includes('text')) return <FileCode className="w-5 h-5 text-gray-400" />
  if (fileType.includes('json')) return <FileJson className="w-5 h-5 text-gray-400" />
  return <FileX className="w-5 h-5 text-gray-400" />
}

export default function ProjectDetails() {
  // All hooks must be at the top, before any return
  const params = useParams()
  const projectId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { projects, loading: projectsLoading, deleteProject } = useProjects(user?.id || '')
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
    goals: (project as any)?.goals || '',
    target_market: (project as any)?.target_market || '',
  })
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_users: [] as string[],
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
  const [enhancingComment, setEnhancingComment] = useState(false)
  const [isDeletingComment, setIsDeletingComment] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)
  const [isRenamingFile, setIsRenamingFile] = useState(false)
  const [fileToRename, setFileToRename] = useState<MediaFile | null>(null)
  const [newFileName, setNewFileName] = useState('')
  const [isAddingPosition, setIsAddingPosition] = useState(false)
  const [isEditingPosition, setIsEditingPosition] = useState(false)
  const [editingPosition, setEditingPosition] = useState<any>(null)
  const [newPosition, setNewPosition] = useState({
    title: '',
    description: '',
    role_type: '',
    commitment: ''
  })
  const [isAddingLink, setIsAddingLink] = useState(false)
  const [isEditingLink, setIsEditingLink] = useState(false)
  const [editingLink, setEditingLink] = useState<any>(null)
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: ''
  })

  const normalizeAssigneeIds = (value: any): string[] => {
    if (Array.isArray(value)) {
      return value.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed)
          ? parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
          : [value]
      } catch {
        return [value]
      }
    }

    return []
  }

  const normalizeTask = (task: any) => ({
    ...task,
    assigned_users: normalizeAssigneeIds(task?.assigned_users),
  })

  const getTaskAssigneeIds = (task: any): string[] => {
    const assigned = normalizeAssigneeIds(task?.assigned_users)
    if (assigned.length > 0) {
      return assigned
    }

    if (typeof task?.assigned_to === 'string' && task.assigned_to.trim().length > 0) {
      return [task.assigned_to]
    }

    return []
  }

  const assignableMembers = teamMembers.filter(member => typeof member.user_id === 'string' && member.user_id.trim().length > 0)

  const uniqueAssignableMembers = useMemo(() => {
    const seen = new Set<string>()
    return assignableMembers.filter(member => {
      if (!member.user_id) return false
      if (seen.has(member.user_id)) return false
      seen.add(member.user_id)
      return true
    })
  }, [assignableMembers])
  const [selectedImage, setSelectedImage] = useState<number>(0)
  const [editPosition, setEditPosition] = useState('');
  const [editAccessLevel, setEditAccessLevel] = useState('1');
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [croppingImage, setCroppingImage] = useState<string | null>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState(project?.description || '');
  const [expenses, setExpenses] = useState<any[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editExpense, setEditExpense] = useState<any>(null)
  const [showEditExpense, setShowEditExpense] = useState(false)
  const [showDeleteExpense, setShowDeleteExpense] = useState(false)
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    status: 'Pending',
    due_date: '',
    receipt_url: '',
    notes: ''
  })
  const [showDeadlineDialog, setShowDeadlineDialog] = useState(false)
  const [newDeadline, setNewDeadline] = useState(project?.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '')
  const [isRenamingTeamFile, setIsRenamingTeamFile] = useState(false);
  const [teamFileToRename, setTeamFileToRename] = useState<MediaFile | null>(null);
  const [newTeamFileName, setNewTeamFileName] = useState('');
  const [pendingTeamFiles, setPendingTeamFiles] = useState<File[]>([]);
  const [isTeamFileNameDialogOpen, setIsTeamFileNameDialogOpen] = useState(false);
  const [teamFileNameInput, setTeamFileNameInput] = useState('');
  const [teamFileToUpload, setTeamFileToUpload] = useState<File | null>(null);
  const [teamFiles, setTeamFiles] = useState<ProjectFile[]>([]);
  const [uploadAccessLevel, setUploadAccessLevel] = useState<number>(3);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingAccessLevel, setEditingAccessLevel] = useState<number>(3);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [newLabelStatus, setNewLabelStatus] = useState('draft');
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState("")
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [loadingNotes, setLoadingNotes] = useState(false)
  const [enhancingNote, setEnhancingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingNoteTitle, setEditingNoteTitle] = useState("")
  const [editingNoteContent, setEditingNoteContent] = useState("")
  
  // Card visibility toggle states
  const [updatingProjectInfoSetting, setUpdatingProjectInfoSetting] = useState(false)
  const [updatingProjectOverviewSetting, setUpdatingProjectOverviewSetting] = useState(false)
  const [updatingProjectExpensesSetting, setUpdatingProjectExpensesSetting] = useState(false)
  const [updatingProjectAccessSetting, setUpdatingProjectAccessSetting] = useState(false);
  // Add state for view mode
  const [fileViewMode, setFileViewMode] = useState<'list' | 'grid' | 'compact'>('compact');

  const fetchTeamFiles = async () => {
    if (!projectId) return;
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('team_only', true)
      .order('created_at', { ascending: false });
    console.log('Fetched team files:', data);
    console.log('Fetch error:', error);
    if (!error && data) setTeamFiles(data);
  };
  useEffect(() => { fetchTeamFiles(); }, [projectId, isUploadingMedia]);

  // --- Project Files (Team Only) Upload ---
  const handleTeamFileUpload = async (file: File, userFileName: string) => {
    setIsUploadingMedia(true);
    try {
      const fileExt = file.name.split('.').pop();
      const storageFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `project-files/${projectId}/${storageFileName}`;
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('partnerfiles').upload(filePath, file);
      if (uploadError) throw uploadError;
      // Get public URL
      const { data: urlData } = supabase.storage.from('partnerfiles').getPublicUrl(filePath);
      // Insert into project_files table
      const { error: insertError } = await supabase.from('project_files').insert({
        project_id: projectId,
        name: userFileName,
        storage_name: storageFileName,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
        aspect_ratio: undefined,
        team_only: true,
        access_level: userUploadAccessLevel,
      });
      if (insertError) throw insertError;
      fetchTeamFiles();
      toast.success('File uploaded!');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setIsUploadingMedia(false);
    }
  };
  const handleConfirmTeamFileName = async () => {
    if (!teamFileToUpload || !teamFileNameInput.trim()) return;
    setIsTeamFileNameDialogOpen(false);
    const ext = teamFileToUpload.name.split('.').pop();
    const userFileName = `${teamFileNameInput.trim()}.${ext}`;
    await handleTeamFileUpload(teamFileToUpload, userFileName);
    setTeamFileToUpload(null);
    setTeamFileNameInput('');
    setPendingTeamFiles([]);
  };
  // --- Project Files (Team Only) Delete ---
  const handleDeleteTeamFile = async (file: ProjectFile) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      // Remove from storage
      await supabase.storage.from('partnerfiles').remove([`project-files/${projectId}/${file.storage_name}`]);
      // Remove from table
      await supabase.from('project_files').delete().eq('id', file.id);
      fetchTeamFiles();
      toast.success('File deleted!');
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleRenameTeamFile = async () => {
    if (!teamFileToRename || !newTeamFileName.trim() || !project) return;
    try {
      const originalExt = teamFileToRename.name.split('.').pop();
      const newNameWithExt = `${newTeamFileName.trim()}.${originalExt}`;
      const updatedFile = { ...teamFileToRename, name: newNameWithExt };
      const updatedMediaFiles = project.media_files?.map(file =>
        file.name === teamFileToRename.name ? updatedFile : file
      ) || [];
      const { error: updateError } = await supabase
        .from('projects')
        .update({ media_files: updatedMediaFiles })
        .eq('id', projectId);
      if (updateError) throw updateError;
      setProject(prev => prev ? { ...prev, media_files: updatedMediaFiles } : prev);
      setIsRenamingTeamFile(false);
      setTeamFileToRename(null);
      setNewTeamFileName('');
      toast.success('File renamed successfully');
    } catch (error) {
      toast.error('Failed to rename file');
    }
  };

  const handleDeadlineUpdate = async () => {
    if (!project) return;
    
    try {
      let deadlineValue = null;
      
      // If a deadline is provided, format it properly
      if (newDeadline && newDeadline.trim()) {
        const deadlineDate = new Date(newDeadline);
        deadlineDate.setHours(23, 59, 59, 999);
        deadlineValue = deadlineDate.toISOString();
      }
      
      const { error } = await supabase
        .from('projects')
        .update({ deadline: deadlineValue })
        .eq('id', project.id);

      if (error) throw error;
      
      toast.success('Deadline updated successfully');
      setShowDeadlineDialog(false);
      
      // Update the local project state
      setProject(prev => prev ? { ...prev, deadline: deadlineValue || undefined } : prev);
      
    } catch (error) {
      console.error('Error updating deadline:', error);
      toast.error('Failed to update deadline');
    }
  };

  useEffect(() => {
    if (!projectId) return

    console.log('[ProjectPage] refreshTeamMembers effect fired', {
      projectId,
      authLoading,
      hasUser: !!user,
      userId: user?.id
    })

    if (authLoading || !user) {
      console.log('[ProjectPage] Skipping team member refresh until auth ready')
      return
    }

    refreshTeamMembers()
  }, [projectId, authLoading, user, refreshTeamMembers])

  useEffect(() => {
    console.log('[ProjectPage] auth guard check', {
      authLoading,
      hasUser: !!user,
      userId: user?.id,
      projectId
    })

    if (authLoading) {
      console.log('[ProjectPage] auth still loading, delaying data fetch')
      return
    }

    if (!user) {
      console.warn('[ProjectPage] No authenticated user after auth load, redirecting to login')
      router.push('/login')
      return
    }

    if (!projectId) {
      console.warn('[ProjectPage] Missing projectId, redirecting to projects list')
      router.push('/projects')
      return
    }

    const fetchProject = async () => {
      try {
        console.log('[ProjectPage] Fetching project data', { projectId, userId: user.id })

        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (error) {
          console.error('[ProjectPage] Error fetching project', { projectId, error })
          throw error
        }

        if (data) {
          console.log('[ProjectPage] Project data received', {
            projectId,
            ownerId: data.owner_id,
            status: data.status,
            progress: data.progress
          })

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
            owner_id: data.owner_id || user?.id || 'unknown',
            show_project_access: typeof data.show_project_access === 'boolean' ? data.show_project_access : true
          }
          setProject(validatedProject)

          // Fetch owner's information
          const { data: ownerData, error: ownerError } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', validatedProject.owner_id)
            .single()

          if (!ownerError && ownerData) {
            console.log('[ProjectPage] Owner info loaded', {
              ownerId: validatedProject.owner_id,
              ownerName: ownerData.name || ownerData.email
            })
            setProject(prev => ({
              ...prev!,
              owner_name: ownerData.name || ownerData.email
            }))
          } else if (ownerError) {
            console.warn('[ProjectPage] Failed to load owner info', {
              ownerId: validatedProject.owner_id,
              error: ownerError
            })
          }
        } else {
          console.warn('[ProjectPage] No project found, redirecting to projects list', { projectId })
          router.push('/projects')
        }
      } catch (error) {
        console.error('[ProjectPage] Exception fetching project', error)
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
        name: project.name ?? '',
        description: project.description ?? '',
        status: project.status ?? 'active',
        progress: project.progress || 0,
        goals: (project as any)?.goals || '',
        target_market: (project as any)?.target_market || '',
      })
    }
  }, [isEditing, project])

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      if (!projectId) return
      
      try {
        let query = supabase
          .from('tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('due_date', { ascending: true })
        const { data, error } = await query

        if (error) throw error
        const normalizedTasks = (data || []).map(normalizeTask)
        const filteredTasks =
          user?.role === 'viewer' || user?.role === 'investor'
            ? normalizedTasks.filter(task => getTaskAssigneeIds(task).includes(user.id))
            : normalizedTasks

        setTasks(filteredTasks)
      } catch (error) {
        console.error('Error fetching tasks:', error)
        toast.error('Failed to load tasks')
      }
    }

    fetchTasks()
  }, [projectId, user])

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
        // First fetch comments (get newest first, then reverse to show oldest first with newest near input)
        const { data: commentsData, error: commentsError } = await supabase
          .from('project_comments')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(50);

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
        
        // Reverse to show oldest first (newest near input)
        const reversedComments = commentsWithUsers.reverse();
        setComments(reversedComments);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast.error('Failed to load comments');
      }
    };

    fetchComments();
  }, [projectId]);

  // Fetch notes for this project
  useEffect(() => {
    if (!projectId || typeof projectId !== 'string' || projectId.length < 10) return;
    const fetchNotes = async () => {
      setLoadingNotes(true)
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .eq('entity_type', 'project')
          .eq('entity_id', projectId)
          .order('created_at', { ascending: false })
        if (error) {
          console.error('Error fetching notes:', error)
        }
        setNotes(data || [])
      } catch (err) {
        console.error('Error in fetchNotes:', err)
      } finally {
        setLoadingNotes(false)
      }
    }
    fetchNotes()
  }, [projectId])

  const handleRefreshNotes = async () => {
    if (!projectId || typeof projectId !== 'string' || projectId.length < 10) return;
    setLoadingNotes(true)
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', projectId)
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error refreshing notes:', error)
      }
      setNotes(data || [])
    } catch (err) {
      console.error('Error in handleRefreshNotes:', err)
    } finally {
      setLoadingNotes(false)
    }
  }

  const handleAddNote = async () => {
    if ((!newNote.trim() && !newNoteTitle.trim()) || !user) return
    const { data, error } = await supabase
      .from('notes')
      .insert([{
        entity_type: 'project',
        entity_id: projectId,
        content: newNote.trim(),
        created_by: user.id,
        created_at: new Date().toISOString(),
        note_title: newNoteTitle.trim(),
        entity_title: project?.name || '',
      }])
      .select()
      .single()
    if (!error && data) {
      setNotes(prev => [data, ...prev])
      setNewNote("")
      setNewNoteTitle("")
    }
  }

  const handleEnhanceNote = async () => {
    const currentNote = newNote.trim()
    if (!currentNote) {
      toast.error('Please enter note content to enhance')
      return
    }

    setEnhancingNote(true)
    try {
      const response = await fetch('/api/enhance-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentNote })
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Enhancement failed')
      }

      const data = await response.json()
      setNewNote(data.message)
      toast.success('Note enhanced with AI')
    } catch (error: any) {
      console.error('Note enhancement error:', error)
      toast.error(error?.message || 'Failed to enhance note')
    } finally {
      setEnhancingNote(false)
    }
  }
  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', noteId)
    if (!error) setNotes(prev => prev.filter(n => n.id !== noteId))
  }

  const handleEditMember = (member: TeamMemberWithUser) => {
    setSelectedMember(member)
    setEditPosition(member.position || '')
    setEditAccessLevel(member.access_level ? String(member.access_level) : '1')
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
      const { error } = await deleteProject(project.id)

      if (error) throw error;

      toast.success('Project deleted successfully')
      router.push('/projects')
    } catch (error: any) {
      console.error('Error deleting project:', error)
      toast.error(error.message || 'Failed to delete project')
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const refreshProjectMedia = async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('media_files')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      setProject(prev => prev ? { ...prev, media_files: data?.media_files || [] } : prev);
    } catch (error) {
      console.error('Error refreshing project media:', error);
    }
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, teamOnly = false, userFileName?: string) => {
    if (!e.target.files || !e.target.files.length) return

    setIsUploadingMedia(true)
    const files = Array.from(e.target.files)

    try {
      // Fetch current media_files from the database
      const { data: projectData, error: fetchError } = await supabase
        .from('projects')
        .select('media_files')
        .eq('id', projectId)
        .single()
      if (fetchError) throw fetchError
      const currentMediaFiles = projectData?.media_files || []

      const newMediaFiles = await Promise.all(files.map(async (file) => {
        // Use userFileName for display, generate unique storage_name for storage
        const fileExt = file.name.split('.').pop()
        const storageFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `projects/${projectId}/${storageFileName}`

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('partnerfiles')
          .upload(filePath, file)
        if (uploadError) throw uploadError

        // Get aspect ratio for images
        let aspectRatio: MediaFile['aspect_ratio'] = '16:9'
        if (file.type.startsWith('image/')) {
          const img = new window.Image()
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
          name: userFileName ? userFileName : file.name, // user-chosen name
          storage_name: storageFileName, // actual storage name
          type: file.type,
          size: file.size,
          url: publicUrl,
          aspect_ratio: aspectRatio,
          created_at: new Date().toISOString(),
          ...(teamOnly ? { team_only: true } : {})
        }
        return mediaFile
      }))

      // Update the database with the new media_files array
      const updatedMediaFiles = [...currentMediaFiles, ...newMediaFiles]
      const { error: updateError } = await supabase
        .from('projects')
        .update({ media_files: updatedMediaFiles })
        .eq('id', projectId)
      if (updateError) throw updateError

      // Update local state
      setProject(prev => prev ? { ...prev, media_files: updatedMediaFiles } : prev)
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
    // Find the file object by display name or storage_name
    const fileObj = project?.media_files?.find(f => f.name === fileName || f.storage_name === fileName);
    if (!fileObj) return;
    const storageName = fileObj.storage_name || fileObj.name;
    if (!confirm('Are you sure you want to delete this media file?')) return

    try {
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('partnerfiles')
        .remove([`projects/${projectId}/${storageName}`])

      if (deleteError) throw deleteError

      // Update project
      const updatedMediaFiles = project?.media_files?.filter(f => f.name !== fileObj.name) || []
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
          status: (['active', 'inactive', 'completed'].includes(editProjectData.status) ? editProjectData.status : 'active') as 'active' | 'inactive' | 'completed',
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
        status: (['active', 'inactive', 'completed'].includes(editProjectData.status) ? editProjectData.status : 'active') as 'active' | 'inactive' | 'completed',
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
      const uniqueAssignees = Array.from(new Set(normalizeAssigneeIds(newTask.assigned_users)))
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
          assigned_users: uniqueAssignees,
          project_id: projectId,
          created_by: user.id,
          status: 'pending',
          assigned_to: uniqueAssignees.length === 1 ? uniqueAssignees[0] : null,
        }])
        .select()
        .single()

      if (error) throw error

      setTasks(prev => [...prev, normalizeTask(data)])
      setIsAddingTask(false)
      setNewTask({
        title: '',
        description: '',
        assigned_users: [],
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
      const uniqueAssignees = Array.from(new Set(normalizeAssigneeIds(editingTask.assigned_users)))
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: editingTask.title,
          description: editingTask.description,
          due_date: editingTask.due_date,
          priority: editingTask.priority,
          status: editingTask.status,
          assigned_users: uniqueAssignees,
          assigned_to: uniqueAssignees.length === 1 ? uniqueAssignees[0] : null,
        })
        .eq('id', editingTask.id)
        .select()
        .single()

      if (error) throw error

      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? normalizeTask(data) : task
      ))
      setIsEditingTask(false)
      setEditingTask(null)
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const updateTaskAssignees = async (taskId: string, assigneeIds: string[]) => {
    try {
      const uniqueAssignees = Array.from(new Set(normalizeAssigneeIds(assigneeIds)))
      const { data, error } = await supabase
        .from('tasks')
        .update({
          assigned_users: uniqueAssignees,
          assigned_to: uniqueAssignees.length === 1 ? uniqueAssignees[0] : null,
        })
        .eq('id', taskId)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No task returned from assignee update')

      setTasks(prev => prev.map(task =>
        task.id === taskId ? normalizeTask(data) : task
      ))
    } catch (error) {
      console.error('Error updating task assignees:', error)
      toast.error('Failed to update task assignees')
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
    setEditingTask(normalizeTask(task))
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

      // Add comment at the end (since we display oldest first)
      setComments(prev => [...prev, commentWithUser]);
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error: any) {
      console.error('Error in handleAddComment:', error);
      toast.error(error.message || 'Failed to add comment. Please try again.');
    }
  };

  const handleEnhanceComment = async () => {
    const currentMessage = newComment.trim()
    if (!currentMessage) {
      toast.error('Please enter a message to enhance')
      return
    }

    setEnhancingComment(true)
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
      setNewComment(data.message)
      toast.success('Comment enhanced with AI')
    } catch (error: any) {
      console.error('Comment enhancement error:', error)
      toast.error(error?.message || 'Failed to enhance comment')
    } finally {
      setEnhancingComment(false)
    }
  }

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
        .eq('id', project.id)
      if (error) throw error
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

  const handleRenameFile = async () => {
    if (!fileToRename || !newFileName.trim() || !project) return;

    try {
      // Get file extension from original name
      const originalExt = fileToRename.name.split('.').pop();
      // Create new filename with same extension
      const newNameWithExt = `${newFileName.trim()}.${originalExt}`
      const updatedFile = {
        ...fileToRename,
        name: newNameWithExt
      };

      // Update the media_files array
      const updatedMediaFiles = project.media_files?.map(file => 
        file.name === fileToRename.name ? updatedFile : file
      ) || [];

      // Update project in database
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          media_files: updatedMediaFiles
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      // Update local state
      setProject(prev => ({
        ...prev!,
        media_files: updatedMediaFiles
      }));

      setIsRenamingFile(false);
      setFileToRename(null);
      setNewFileName('');
      toast.success('File renamed successfully');
    } catch (error) {
      console.error('Error renaming file:', error);
      toast.error('Failed to rename file');
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ position: editPosition, access_level: editAccessLevel })
        .eq('id', selectedMember.id)
      if (error) throw error
      setIsEditDialogOpen(false)
      setSelectedMember(null)
      setEditPosition('')
      setEditAccessLevel('1')
      toast.success('Team member updated successfully')
    } catch (error) {
      console.error('Error updating team member:', error)
      toast.error('Failed to update team member')
    }
  }

  const handleEditPosition = (position: any, index: number) => {
    setEditingPosition(position)
    setIsEditingPosition(true)
  }

  const handleDeletePosition = (index: number) => {
    if (confirm('Are you sure you want to delete this position?')) {
      const updatedPositions = (project as any).open_positions?.filter((_: any, i: number) => i !== index) || []
      setProject(prev => ({ ...prev!, open_positions: updatedPositions }))
      setIsAddingPosition(false)
      setIsEditingPosition(false)
      setEditingPosition(null)
      setNewPosition({
        title: '',
        description: '',
        role_type: '',
        commitment: ''
      })
    }
  }

  const handleSavePosition = async () => {
    if (!newPosition.title || !newPosition.description || !newPosition.role_type || !newPosition.commitment) {
      toast.error('Please fill in all required fields')
      return
    }

    const updatedPositions = (project as any).open_positions?.map((position: any, i: number) => 
      i === editingPosition ? { ...position, ...newPosition } : position
    ) || []

    setProject(prev => ({ ...prev!, open_positions: updatedPositions }))
    setIsAddingPosition(false)
    setIsEditingPosition(false)
    setEditingPosition(null)
    setNewPosition({
      title: '',
      description: '',
      role_type: '',
      commitment: ''
    })
    toast.success('Position updated successfully')
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!project || !user || user.role === 'viewer') return
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', project.id)

      if (error) throw error
      setProject({ ...project, status: newStatus } as any)
      toast.success('Status updated successfully')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleAddLink = async () => {
    if (!project) {
      toast.error('Project not found')
      return
    }

    try {
      let normalizedUrl = newLink.url.trim();
      if (!normalizedUrl) {
        toast.error('Please enter a URL');
        return;
      }
      // Auto-prepend protocol if missing
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      // Validate URL format
      try {
        new URL(normalizedUrl);
      } catch (e) {
        toast.error('Please enter a valid URL');
        return;
      }

      const updatedLinks = [...(project.external_links || []), { ...newLink, url: normalizedUrl }]
      // Update in Supabase
      const { error } = await supabase
        .from('projects')
        .update({ external_links: updatedLinks })
        .eq('id', project.id)
      if (error) throw error

      setProject(prev => ({ ...prev!, external_links: updatedLinks }))
      setNewLink({ title: '', url: '', description: '' })
      setIsAddingLink(false)
      toast.success('Link added successfully')
    } catch (error) {
      console.error('Error adding link:', error)
      toast.error('Failed to add link')
    }
  }

  const handleUpdateLink = async () => {
    if (!project || !editingLink) return

    try {
      const updatedLinks = project.external_links?.map((link: any) =>
        link.id === editingLink.id ? { ...editingLink, ...newLink } : link
      ) || []
      // Update in Supabase
      const { error } = await supabase
        .from('projects')
        .update({ external_links: updatedLinks })
        .eq('id', project.id)
      if (error) throw error

      setProject(prev => ({ ...prev!, external_links: updatedLinks }))
      setEditingLink(null)
      setNewLink({ title: '', url: '', description: '' })
      setIsEditingLink(false)
      toast.success('Link updated successfully')
    } catch (error) {
      console.error('Error updating link:', error)
      toast.error('Failed to update link')
    }
  }

  const handleDeleteLink = async (index: number) => {
    if (!project) {
      toast.error('Project not found')
      return
    }

    if (confirm('Are you sure you want to delete this link?')) {
      const updatedLinks = project.external_links?.filter((_, i) => i !== index) || []
      // Update in Supabase
      const { error } = await supabase
        .from('projects')
        .update({ external_links: updatedLinks })
        .eq('id', project.id)
      if (error) {
        toast.error('Failed to delete link')
        return
      }
      setProject(prev => ({ ...prev!, external_links: updatedLinks }))
      toast.success('Link deleted successfully')
    }
  }

  const handleTogglePublicFunding = async () => {
    if (!project) {
      toast.error('Project not found')
      return
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ 
          accepts_support: !project.accepts_support 
        })
        .eq('id', project.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProject(data);
      toast.success(data.accepts_support 
        ? "Support project enabled"
        : "Support project disabled"
      );
    } catch (error) {
      console.error('Error toggling support project:', error);
      toast.error("Failed to toggle support project status");
    }
  };

  const onCropComplete = useCallback((_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const showCropper = (imgUrl: string) => {
    setCroppingImage(imgUrl)
    setIsCropOpen(true)
  }

  const getCroppedImg = async (imageSrc: string, crop: any) => {
    // Utility to crop image using canvas
    const createImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image()
      img.addEventListener('load', () => resolve(img))
      img.addEventListener('error', error => reject(error))
      img.setAttribute('crossOrigin', 'anonymous')
      img.src = url
    })
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    canvas.width = crop.width
    canvas.height = crop.height
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height
    )
    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
      }, 'image/png')
    })
  }

  const handleCropSave = async () => {
    if (!croppingImage || !croppedAreaPixels) return
    setIsUploadingMedia(true)
    try {
      const croppedBlob = await getCroppedImg(croppingImage, croppedAreaPixels)
      const fileExt = 'png'
      const fileName = `${Date.now()}-cropped.png`
      const filePath = `projects/${projectId}/${fileName}`
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('partnerfiles').upload(filePath, croppedBlob, { upsert: true, contentType: 'image/png' })
      if (uploadError) throw uploadError
      // Get public URL
      const { data: { publicUrl } } = supabase.storage.from('partnerfiles').getPublicUrl(filePath)
      // Replace the original image in media_files
      const updatedMediaFiles = project?.media_files?.map((file, idx) =>
        idx === selectedImage ? { ...file, url: publicUrl, name: fileName } : file
      ) || []
      // Update DB
      const { error: updateError } = await supabase.from('projects').update({ media_files: updatedMediaFiles }).eq('id', projectId)
      if (updateError) throw updateError
      setProject(prev => prev ? { ...prev, media_files: updatedMediaFiles } : prev)
      setIsCropOpen(false)
      setCroppingImage(null)
      toast.success('Image cropped and updated!')
    } catch (err) {
      toast.error('Failed to crop image')
    } finally {
      setIsUploadingMedia(false)
    }
  }

  const handleSaveDescription = async () => {
    if (!project) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update({ description: editedDescription, updated_at: new Date().toISOString() })
        .eq('id', project.id);
      if (error) throw error;
      setProject({ ...project, description: editedDescription, updated_at: new Date().toISOString() });
      setIsEditingDescription(false);
      toast.success('Description updated');
    } catch (error) {
      toast.error('Failed to update description');
    }
  };
  const handleDeleteDescription = async () => {
    setEditedDescription('');
    await handleSaveDescription();
  };

  const fetchExpenses = async () => {
    if (!project) return
    try {
      setLoadingExpenses(true)
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          user:user_id (
            id,
            email
          )
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
      toast.error('Failed to fetch expenses')
    } finally {
      setLoadingExpenses(false)
    }
  }

  // Add fetchExpenses to the useEffect that runs when project changes
  useEffect(() => {
    if (project) {
      fetchExpenses()
    }
  }, [project])

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

  const isOwner = user?.id === project?.owner_id;
  const currentMember = teamMembers.find(m => m.user_id === user?.id);
  const isAccessLevel1 = !isOwner && String(currentMember?.access_level) === '1';
  const isAccessLevel2 = !isOwner && String(currentMember?.access_level) === '2';
  const isAccessLevel3 = !isOwner && String(currentMember?.access_level) === '3';
  const canChangeStatus = !!(user && user.role !== 'viewer' && !isAccessLevel1 && !isAccessLevel2 && !isAccessLevel3);

  const handleAddExpense = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{
          project_id: projectId,
          user_id: user?.id,
          description: newExpense.description,
          amount: Number(newExpense.amount),
          category: newExpense.category,
          status: newExpense.status,
          due_date: newExpense.due_date,
          receipt_url: newExpense.receipt_url,
          notes: newExpense.notes
        }])
        .select(`
          *,
          user:user_id (
            id,
            email
          )
        `)
        .single();

      if (error) throw error;
      setExpenses(prev => [data, ...prev]);
      setNewExpense({ description: '', amount: '', category: '', status: 'Pending', due_date: '', receipt_url: '', notes: '' });
      setShowAddExpense(false);
      toast.success('Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleEditExpense = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          description: editExpense.description,
          amount: Number(editExpense.amount),
          category: editExpense.category,
          status: editExpense.status,
          due_date: editExpense.due_date,
          receipt_url: editExpense.receipt_url,
          notes: editExpense.notes
        })
        .eq('id', editExpense.id)
        .select(`
          *,
          user:user_id (
            id,
            email
          )
        `)
        .single();

      if (error) throw error;
      setExpenses(prev => prev.map(expense =>
        expense.id === editExpense.id ? data : expense
      ));
      setEditExpense(null);
      setShowEditExpense(false);
      toast.success('Expense updated successfully');
    } catch (error) {
      console.error('Error editing expense:', error);
      toast.error('Failed to update expense');
    }
  };

  const handleDeleteExpense = async () => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', editExpense.id);
      if (error) throw error;
      setExpenses(prev => prev.filter(expense => expense.id !== editExpense.id));
      setEditExpense(null);
      setShowDeleteExpense(false);
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleTeamFilesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    setPendingTeamFiles(Array.from(e.target.files));
    setTeamFileToUpload(e.target.files[0]);
    setTeamFileNameInput(e.target.files[0].name.split('.').slice(0, -1).join('.') || e.target.files[0].name);
    setIsTeamFileNameDialogOpen(true);
  };

  // --- Project Files (Team Only) Edit Access Level ---
  const handleEditAccessLevel = (file: ProjectFile) => {
    setEditingFileId(file.id);
    setEditingAccessLevel(file.access_level);
    setEditingFileName(null); // Disable file name editing
  };
  const handleSaveAccessLevel = async (file: ProjectFile) => {
    await supabase.from('project_files').update({ access_level: editingAccessLevel }).eq('id', file.id);
    setEditingFileId(null);
    fetchTeamFiles();
    toast.success('Access level updated!');
  };

  const userAccessLevel = isOwner ? 5 : Number(currentMember?.access_level) || 99;
  const visibleFiles: ProjectFile[] = teamFiles.filter((file: ProjectFile) => userAccessLevel >= file.access_level);

  const allowedAccessLevels = [1, 2, 3, 4, 5];
  const canSeeProjectFilesCard = isOwner || allowedAccessLevels.includes(Number(currentMember?.access_level));

  // Determine if the user can set access level
  const canSetAccessLevel = isOwner || [4, 5].includes(Number(currentMember?.access_level));
  const userUploadAccessLevel = canSetAccessLevel ? uploadAccessLevel : 1;

  // Add these logs before the Project Files card render
  console.log('Can see project files card:', canSeeProjectFilesCard);
  console.log('Current member:', currentMember);
  console.log('User access level:', userAccessLevel);
  console.log('Visible files:', visibleFiles);

  const allSelected = visibleFiles.length > 0 && selectedFileIds.length === visibleFiles.length;
  const isIndeterminate = selectedFileIds.length > 0 && selectedFileIds.length < visibleFiles.length;

  const handleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(visibleFiles.map((file) => file.id));
    }
  };

  const handleDeselectAll = () => setSelectedFileIds([]);

  const handleDeleteSelected = async () => {
    if (!selectedFileIds.length) return;
    
    // Add confirmation dialog
    if (!confirm(`Are you sure you want to delete ${selectedFileIds.length} selected file${selectedFileIds.length > 1 ? 's' : ''}?`)) {
      return;
    }

    try {
      // Delete each selected file
      for (const fileId of selectedFileIds) {
        const file = teamFiles.find(f => f.id === fileId);
        if (!file) continue;

        // Delete from storage
        const { error: deleteError } = await supabase.storage
          .from('partnerfiles')
          .remove([`projects/${projectId}/${file.storage_name}`]);

        if (deleteError) throw deleteError;

        // Delete from database
        const { error: dbError } = await supabase
          .from('project_files')
          .delete()
          .eq('id', fileId);

        if (dbError) throw dbError;
      }

      // Refresh files list
      await fetchTeamFiles();
      setSelectedFileIds([]);
      toast.success('Selected files deleted successfully');
    } catch (error) {
      console.error('Error deleting files:', error);
      toast.error('Failed to delete files');
    }
  };

  const handleStartEditFileName = (file: ProjectFile) => {
    setEditingFileName(file.id);
    setNewFileName(file.name.split('.')[0]);
    setEditingFileId(null); // Disable access level editing
  };

  const handleSaveFileName = async (file: ProjectFile) => {
    if (!newFileName.trim()) return;
    
    try {
      const fileExt = file.name.split('.').pop();
      const newNameWithExt = `${newFileName.trim()}.${fileExt}`;
      
      const { error } = await supabase
        .from('project_files')
        .update({ name: newNameWithExt })
        .eq('id', file.id);

      if (error) throw error;
      
      await fetchTeamFiles();
      setEditingFileName(null);
      setNewFileName('');
      toast.success('File renamed successfully');
    } catch (error) {
      toast.error('Failed to rename file');
    }
  };

  const handleCancelEditFileName = () => {
    setEditingFileName(null);
    setNewFileName('');
  };

  // Add this function to handle label updates
  const handleSaveLabel = async (file: ProjectFile) => {
    if (!newLabel.trim() && !newLabelStatus) return;
    
    try {
      const { error } = await supabase
        .from('project_files')
        .update({ 
          custom_label: newLabel.trim() || null,
          label_status: newLabelStatus
        })
        .eq('id', file.id);

      if (error) throw error;
      
      await fetchTeamFiles();
      setEditingLabel(null);
      setNewLabel('');
      setNewLabelStatus('draft');
      toast.success('Label updated successfully');
    } catch (error) {
      toast.error('Failed to update label');
    }
  };

  // Add this function to get label icon
  const getLabelIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4 text-gray-400" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_review':
        return <Eye className="w-4 h-4 text-blue-400" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleStartEditNote = (note: any) => {
    setEditingNoteId(note.id)
    setEditingNoteTitle(note.note_title || "")
    setEditingNoteContent(note.content || "")
  }
  const handleCancelEditNote = () => {
    setEditingNoteId(null)
    setEditingNoteTitle("")
    setEditingNoteContent("")
  }
  const handleSaveEditNote = async () => {
    if (!editingNoteId || (!editingNoteTitle.trim() && !editingNoteContent.trim())) return
    const { data, error } = await supabase
      .from('notes')
      .update({
        note_title: editingNoteTitle.trim(),
        content: editingNoteContent.trim(),
      })
      .eq('id', editingNoteId)
      .select()
      .single()
    if (!error && data) {
      setNotes(prev => prev.map(n => n.id === editingNoteId ? data : n))
      handleCancelEditNote()
    }
  }

  // Card visibility toggle handlers
  const handleToggleProjectInfo = async () => {
    if (!project) return;
    setUpdatingProjectInfoSetting(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ show_project_info: !project.show_project_info })
        .eq('id', project.id)
        .select()
        .single();
      if (error) throw error;
      setProject(data);
      toast.success(`Project Information card is now ${data.show_project_info ? 'visible' : 'hidden'}`);
    } catch (err) {
      toast.error('Failed to update project information visibility');
    } finally {
      setUpdatingProjectInfoSetting(false);
    }
  };

  const handleToggleProjectOverview = async () => {
    if (!project) return;
    setUpdatingProjectOverviewSetting(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ show_project_overview: !project.show_project_overview })
        .eq('id', project.id)
        .select()
        .single();
      if (error) throw error;
      setProject(data);
      toast.success(`Project Overview card is now ${data.show_project_overview ? 'visible' : 'hidden'}`);
    } catch (err) {
      toast.error('Failed to update project overview visibility');
    } finally {
      setUpdatingProjectOverviewSetting(false);
    }
  };

  const handleToggleProjectExpenses = async () => {
    if (!project) return;
    setUpdatingProjectExpensesSetting(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({ show_project_expenses: !project.show_project_expenses })
        .eq('id', project.id)
        .select()
        .single();
      if (error) throw error;
      setProject(data);
      toast.success(`Project Expenses card is now ${data.show_project_expenses ? 'visible' : 'hidden'}`);
    } catch (err) {
      toast.error('Failed to update project expenses visibility');
    } finally {
      setUpdatingProjectExpensesSetting(false);
    }
  };

  const handleToggleProjectAccess = async () => {
    if (!project) return;
    setUpdatingProjectAccessSetting(true);
    try {
      const nextValue = !(project.show_project_access ?? true);
      const { data, error } = await supabase
        .from('projects')
        .update({ show_project_access: nextValue })
        .eq('id', project.id)
        .select()
        .single();
      if (error) throw error;
      setProject(data);
      toast.success(`Project Access card is now ${data.show_project_access ? 'visible' : 'hidden'}`);
    } catch (err) {
      console.error('Failed updating Project Access visibility', err);
      toast.error('Failed to update Project Access visibility');
    } finally {
      setUpdatingProjectAccessSetting(false);
    }
  };

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
                <StatusBadge 
                  status={project?.status || 'N/A'} 
                  projectId={project.id}
                  onStatusChange={canChangeStatus ? handleStatusChange : undefined}
                />
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle>Project Media</CardTitle>
                        <CardDescription className="text-gray-400">
                          Images, videos, documents, and external links
                        </CardDescription>
                      </div>
                      {!isAccessLevel1 && !isAccessLevel2 && user?.role !== 'viewer' && user?.role !== 'investor' && (
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <Button 
                            onClick={() => document.getElementById('media-upload')?.click()} 
                            className="gradient-button w-full sm:w-auto"
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
                          <Button 
                            onClick={() => setIsAddingLink(true)}
                            className="gradient-button w-full sm:w-auto"
                          >
                            <Link className="w-4 h-4 mr-2" />
                            Add Link
                          </Button>
                        </div>
                      )}
                      <input
                        type="file"
                        id="media-upload"
                        className="hidden"
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        multiple
                        onChange={handleMediaUpload}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Main Display */}
                    {project?.media_files && project.media_files.length > 0 && (
                      <div className="space-y-4">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-gray-800/30 flex items-center justify-center">
                          {project.media_files[selectedImage].type.startsWith('image/') ? (
                            <>
                            <Image
                              src={project.media_files[selectedImage].url}
                              alt={project.media_files[selectedImage].name}
                              fill
                                className="object-contain w-full h-full"
                              />
                              {!isAccessLevel1 && !isAccessLevel2 && user?.role !== 'viewer' && user?.role !== 'investor' && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white z-10"
                                  onClick={() => { const url = project?.media_files?.[selectedImage]?.url; if (typeof url === 'string') showCropper(url) }}
                                  title="Edit Image"
                                >
                                  <Pencil className="w-5 h-5" />
                                </Button>
                              )}
                            </>
                          ) : project.media_files[selectedImage].type.startsWith('video/') ? (
                            <video
                              src={project.media_files[selectedImage].url}
                              controls
                              className="w-full h-full object-contain"
                            />
                          ) : project.media_files[selectedImage].type.startsWith('audio/') ? (
                            <audio controls className="w-full">
                              <source src={project.media_files[selectedImage].url} type={project.media_files[selectedImage].type} />
                              Your browser does not support the audio element.
                            </audio>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                          {!isAccessLevel1 && !isAccessLevel2 && user?.role !== 'viewer' && user?.role !== 'investor' && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-white hover:text-red-400 bg-black/50"
                                onClick={() => handleDeleteMedia(project.media_files![selectedImage].name)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Thumbnails */}
                        <div className="grid grid-cols-6 gap-2">
                          {project.media_files.map((file, index) => (
                            <div
                              key={index}
                              className={`relative aspect-video cursor-pointer rounded-md overflow-hidden bg-gray-900 flex items-center justify-center group ${index === selectedImage ? 'ring-2 ring-blue-500' : ''}`}
                              onClick={() => setSelectedImage(index)}
                            >
                              {file.type.startsWith('image/') ? (
                                <Image
                                  src={file.url}
                                  alt={file.name}
                                  fill
                                  className="object-contain w-full h-full p-1"
                                />
                              ) : file.type.startsWith('video/') ? (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <Video className="w-6 h-6 text-gray-400" />
                                </div>
                              ) : file.type.startsWith('audio/') ? (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <audio controls className="w-full">
                                    <source src={file.url} type={file.type} />
                                    Your browser does not support the audio element.
                                  </audio>
                                </div>
                              ) : (
                                <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              {!isAccessLevel1 && !isAccessLevel2 && user?.role !== 'viewer' && user?.role !== 'investor' && (
                                <button
                                  className="absolute top-1 right-1 z-10 p-1 rounded-full bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={e => { e.stopPropagation(); handleDeleteMedia(file.name); }}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Files List */}
                    {project?.media_files?.some(file => 
                      !file.type.startsWith('image/') && !file.type.startsWith('video/')
                    ) && (
                      <div className="mt-6 border-t border-gray-800 pt-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-4">Uploaded Files</h4>
                        <div className="space-y-2">
                          {project?.media_files?.filter(file => 
                            !file.type.startsWith('image/') && !file.type.startsWith('video/')
                          ).map((file, index) => (
                            <div 
                              key={index} 
                              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg group hover:bg-gray-800/70 transition-colors"
                            >
                              <div className="flex items-center space-x-3 min-w-0 flex-1">
                                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-blue-400"
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                {!isAccessLevel1 && !isAccessLevel2 && user?.role !== 'viewer' && user?.role !== 'investor' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-blue-400"
                                      onClick={() => {
                                        setFileToRename(file);
                                        setNewFileName(file.name.split('.')[0]);
                                        setIsRenamingFile(true);
                                      }}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-red-400"
                                      onClick={() => handleDeleteMedia(file.name)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* External Links List */}
                    {project?.external_links && project.external_links.length > 0 && (
                      <div className="mt-6 border-t border-gray-800 pt-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-4">External Links</h4>
                        <ul className="space-y-2">
                          {project.external_links.map((link, idx) => (
                            <li key={idx}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                              >
                                {link.title || link.url}
                              </a>
                              {link.description && (
                                <span className="ml-2 text-gray-400 text-xs">{link.description}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(!project?.media_files || project.media_files.length === 0) && (
                      <div className="col-span-full text-center py-8">
                        <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-400">No media files</h3>
                        <p className="text-gray-500 mt-1">Upload images, videos, or documents to showcase your project</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {canSeeProjectFilesCard && (
                  <Card className="leonardo-card border-gray-800 mt-6">
                    <CardHeader>
                      <div className="mb-2">
                        <CardTitle>Project Files</CardTitle>
                        <CardDescription className="text-gray-400">
                          Files only visible to the project team, based on your access level
                        </CardDescription>
                      </div>
                      <div className="flex flex-row flex-wrap items-center justify-between gap-2 w-full">
                        {/* Left group: view switcher, View All Files, Level dropdown */}
                        <div className="flex flex-row flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
                            <Button
                              variant={fileViewMode === 'list' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setFileViewMode('list')}
                              className="h-8 w-8 p-0"
                              aria-label="List view"
                            >
                              <List className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={fileViewMode === 'grid' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setFileViewMode('grid')}
                              className="h-8 w-8 p-0"
                              aria-label="Grid view"
                            >
                              <Grid className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={fileViewMode === 'compact' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setFileViewMode('compact')}
                              className="h-8 w-8 p-0"
                              aria-label="Compact view"
                            >
                              <AlignJustify className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/projectfiles/${projectId}`)}
                            className="w-auto"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            View All Files
                          </Button>
                          {user && !['viewer', 'investor'].includes(user.role) && currentMember && canSetAccessLevel && (
                            <Select value={String(uploadAccessLevel)} onValueChange={v => setUploadAccessLevel(Number(v))}>
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Access Level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">Level 1</SelectItem>
                                <SelectItem value="2">Level 2</SelectItem>
                                <SelectItem value="3">Level 3</SelectItem>
                                <SelectItem value="4">Level 4</SelectItem>
                                <SelectItem value="5">Level 5</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        {/* Right: Add File button */}
                        {user && !['viewer', 'investor'].includes(user.role) && currentMember && (
                          <Button
                            onClick={() => document.getElementById('team-files-upload')?.click()}
                            className="gradient-button w-auto ml-auto"
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
                                Add File
                              </>
                            )}
                          </Button>
                        )}
                        <input
                          type="file"
                          id="team-files-upload"
                          className="hidden"
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                          multiple={false}
                          onChange={e => {
                            if (!e.target.files || !e.target.files.length) return;
                            setPendingTeamFiles(Array.from(e.target.files));
                            setTeamFileToUpload(e.target.files[0]);
                            setTeamFileNameInput(e.target.files[0].name.split('.').slice(0, -1).join('.') || e.target.files[0].name);
                            setIsTeamFileNameDialogOpen(true);
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!currentMember ? (
                        <div className="text-center py-8 text-gray-400">
                          You must be a team member to view project files.
                        </div>
                      ) : visibleFiles.length > 0 ? (
                        <div>
                          {fileViewMode === 'list' && (
                            <div className="space-y-2">
                              {visibleFiles.slice(0, 7).map((file: ProjectFile, index: number) => (
                                <div key={file.id} className="flex flex-col md:flex-row items-start md:items-center p-3 bg-gray-800/50 rounded-lg group hover:bg-gray-800/70 transition-colors w-full">
                                  {/* Left: File info */}
                                  <div className="flex items-center min-w-0 flex-1 gap-2 w-full">
                                    <input
                                      type="checkbox"
                                      checked={selectedFileIds.includes(file.id)}
                                      onChange={() => handleSelectFile(file.id)}
                                      className="accent-purple-500 w-4 h-4"
                                      aria-label={`Select file ${file.name}`}
                                    />
                                    <span className="text-xs text-gray-400 w-5 text-right">{index + 1}</span>
                                    {getFileIcon(file.type)}
                                    <div className="min-w-0 flex flex-col w-full">
                                      {editingFileName === file.id ? (
                                        <div className="flex items-center gap-2 w-full">
                                          <Input
                                            value={newFileName}
                                            onChange={(e) => setNewFileName(e.target.value)}
                                            className="h-8 text-sm w-full"
                                            autoFocus
                                          />
                                          <Button
                                            size="sm"
                                            onClick={() => handleSaveFileName(file)}
                                            className="h-8"
                                          >
                                            Save
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCancelEditFileName}
                                            className="h-8"
                                          >
                                            Cancel
                                          </Button>
                                        </div>
                                      ) : (
                                        <p 
                                          className="text-lg font-bold text-white truncate cursor-pointer hover:text-blue-400 w-full"
                                          onClick={() => handleStartEditFileName(file)}
                                        >
                                          {file.name}
                                        </p>
                                      )}
                                      <p className="text-xs text-gray-400 flex items-center gap-2 w-full">
                                        <span className="hidden md:inline opacity-50">{new Date(file.created_at).toLocaleDateString()}</span> • <span className="hidden md:inline opacity-25">Access Level:</span>
                                        {editingFileId === file.id ? (
                                          <span className="flex items-center gap-1 ml-1">
                                            <Select value={String(editingAccessLevel)} onValueChange={v => setEditingAccessLevel(Number(v))}>
                                              <SelectTrigger className="w-[70px] h-6 text-xs">
                                                <SelectValue placeholder="Level" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="1">1</SelectItem>
                                                <SelectItem value="2">2</SelectItem>
                                                <SelectItem value="3">3</SelectItem>
                                                <SelectItem value="4">4</SelectItem>
                                                <SelectItem value="5">5</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Button size="sm" className="ml-1 px-2 py-1 text-xs" onClick={() => handleSaveAccessLevel(file)}>Save</Button>
                                            <Button size="sm" variant="outline" className="ml-1 px-2 py-1 text-xs" onClick={() => setEditingFileId(null)}>Cancel</Button>
                                          </span>
                                        ) : (
                                          <span className="ml-1 opacity-25 hidden md:inline">{file.access_level}</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  {/* Middle: Label badge */}
                                  <div className="flex-1 flex justify-center mt-2 md:mt-0 w-full">
                                    {editingLabel === file.id ? (
                                      <div className="flex items-center gap-2 w-full">
                                        <Select value={newLabelStatus} onValueChange={setNewLabelStatus}>
                                          <SelectTrigger className="w-[120px] h-6 text-xs">
                                            <SelectValue placeholder="Status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="in_review">In Review</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Input
                                          value={newLabel}
                                          onChange={(e) => setNewLabel(e.target.value)}
                                          placeholder="Custom label (optional)"
                                          className="h-6 text-xs w-[150px]"
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => handleSaveLabel(file)}
                                          className="h-6 text-xs"
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingLabel(null);
                                            setNewLabel('');
                                            setNewLabelStatus('draft');
                                          }}
                                          className="h-6 text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-400">{file.custom_label || file.label_status || "draft"}</span>
                                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => { setEditingLabel(file.id); setNewLabel(file.custom_label || ""); setNewLabelStatus(file.label_status || "draft"); }}><Pencil className="w-4 h-4" /></Button>
                                      </div>
                                    )}
                                  </div>
                                  {/* Right: Actions */}
                                  <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-blue-400"
                                      onClick={() => window.open(file.url, '_blank')}
                                      title="Download File"
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-blue-400"
                                      onClick={() => handleStartEditFileName(file)}
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-400 hover:text-red-300"
                                      onClick={() => handleDeleteTeamFile(file)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {fileViewMode === 'grid' && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {visibleFiles.slice(0, 7).map((file: ProjectFile) => (
                                <div key={file.id} className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg group hover:bg-gray-800/70 transition-colors">
                                  <div className="mb-2">{getFileIcon(file.type)}</div>
                                  {editingFileName === file.id ? (
                                    <div className="flex flex-col items-center w-full gap-2">
                                      <Input
                                        value={newFileName}
                                        onChange={(e) => setNewFileName(e.target.value)}
                                        className="h-8 text-sm w-full"
                                        autoFocus
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleSaveFileName(file)} className="h-8">Save</Button>
                                        <Button size="sm" variant="outline" onClick={handleCancelEditFileName} className="h-8">Cancel</Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="font-semibold text-white text-center truncate w-full mb-1 cursor-pointer hover:text-blue-400" onClick={() => handleStartEditFileName(file)}>{file.name}</div>
                                  )}
                                  <div className="text-xs text-gray-400 mb-2">{formatFileSize(file.size)}</div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-400">{file.custom_label || file.label_status || "draft"}</span>
                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => { setEditingLabel(file.id); setNewLabel(file.custom_label || ""); setNewLabelStatus(file.label_status || "draft"); }}><Pencil className="w-4 h-4" /></Button>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => window.open(file.url, '_blank')} title="Download File"><Download className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => handleStartEditFileName(file)}><Pencil className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteTeamFile(file)}><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {fileViewMode === 'compact' && (
                            <div className="divide-y divide-gray-800 border border-gray-800 rounded-lg overflow-hidden">
                              {visibleFiles.slice(0, 7).map((file: ProjectFile) => (
                                <div key={file.id} className="flex items-center px-3 py-2 bg-gray-900 hover:bg-gray-800 transition-colors">
                                  <span className="mr-2">{getFileIcon(file.type)}</span>
                                  {editingFileName === file.id ? (
                                    <Input
                                      value={newFileName}
                                      onChange={(e) => setNewFileName(e.target.value)}
                                      className="h-8 text-sm flex-1"
                                      autoFocus
                                      onBlur={handleCancelEditFileName}
                                      onKeyDown={e => { if (e.key === 'Enter') handleSaveFileName(file); }}
                                    />
                                  ) : (
                                    <span className="flex-1 truncate text-white text-sm cursor-pointer hover:text-blue-400" onClick={() => handleStartEditFileName(file)}>{file.name}</span>
                                  )}
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => window.open(file.url, '_blank')} title="Download File"><Download className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => handleStartEditFileName(file)}><Pencil className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteTeamFile(file)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                              ))}
                            </div>
                          )}
                          {visibleFiles.length > 7 && (
                            <div className="text-center mt-4">
                              <Button
                                variant="outline"
                                className="bg-black text-white rounded-lg font-semibold text-base px-6 py-3 flex items-center justify-center mx-auto hover:bg-gray-900 border-none shadow-none"
                                onClick={() => router.push(`/projectfiles/${projectId}`)}
                              >
                                <FileText className="w-5 h-5 mr-2" />
                                View All Files
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          No files found for this project.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Add/Edit/Delete Expense Dialogs */}
                <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Description" value={newExpense.description} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} />
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">$</span>
                        <Input
                          placeholder="Amount"
                          type="number"
                          className="pl-8"
                          value={newExpense.amount}
                          onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                        />
                      </div>
                      <Input placeholder="Category" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} />
                      <Select value={newExpense.status} onValueChange={v => setNewExpense({ ...newExpense, status: v })}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Due Date" type="date" value={newExpense.due_date} onChange={e => setNewExpense({ ...newExpense, due_date: e.target.value })} />
                      <Input placeholder="Receipt URL" value={newExpense.receipt_url} onChange={e => setNewExpense({ ...newExpense, receipt_url: e.target.value })} />
                      <Input placeholder="Notes" value={newExpense.notes} onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })} />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddExpense(false)}>Cancel</Button>
                      <Button onClick={handleAddExpense}>Add</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={showEditExpense} onOpenChange={setShowEditExpense}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Expense</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input placeholder="Description" value={editExpense?.description || ''} onChange={e => setEditExpense({ ...editExpense, description: e.target.value })} />
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">$</span>
                        <Input
                          placeholder="Amount"
                          type="number"
                          className="pl-8"
                          value={editExpense?.amount ?? ''}
                          onChange={e => setEditExpense({ ...editExpense, amount: e.target.value })}
                        />
                      </div>
                      <Input placeholder="Category" value={editExpense?.category || ''} onChange={e => setEditExpense({ ...editExpense, category: e.target.value })} />
                      <Select value={editExpense?.status || ''} onValueChange={v => setEditExpense({ ...editExpense, status: v })}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value="Paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input placeholder="Due Date" type="date" value={editExpense?.due_date || ''} onChange={e => setEditExpense({ ...editExpense, due_date: e.target.value })} />
                      <Input placeholder="Receipt URL" value={editExpense?.receipt_url || ''} onChange={e => setEditExpense({ ...editExpense, receipt_url: e.target.value })} />
                      <Input placeholder="Notes" value={editExpense?.notes || ''} onChange={e => setEditExpense({ ...editExpense, notes: e.target.value })} />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowEditExpense(false)}>Cancel</Button>
                      <Button onClick={handleEditExpense}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={showDeleteExpense} onOpenChange={setShowDeleteExpense}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Expense</DialogTitle>
                      <DialogDescription>Are you sure you want to delete this expense?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowDeleteExpense(false)}>Cancel</Button>
                      <Button variant="destructive" onClick={handleDeleteExpense}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Project Access */}
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Switch
                      checked={project?.show_project_access ?? true}
                      onCheckedChange={handleToggleProjectAccess}
                      disabled={updatingProjectAccessSetting}
                    />
                    <span className="text-sm text-gray-300">
                      Show Project Access
                    </span>
                  </div>
                  {!isAccessLevel1 && !isAccessLevel2 && !isAccessLevel3 && (project?.show_project_access ?? true) && (
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
                                      <Avatar className="w-10 h-10 mr-3">
                                        <AvatarImage src={member.user?.avatar_url || undefined} />
                                        <AvatarFallback>{member.user?.name?.[0] || member.user?.email?.[0] || '?'}</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h4 className="font-medium text-white">{member.user?.name || member.user?.email}</h4>
                                        {member.position && (
                                          <Badge variant="default" className="mt-1">{member.position}</Badge>
                                        )}
                                        {member.access_level && (
                                          <p className="text-xs text-gray-400">Access Level: {member.access_level}</p>
                                        )}
                                        </div>
                                        </div>
                                    {user?.role && (['partner', 'admin', 'investor', 'ceo'] as const).includes(user.role as any) && !isAccessLevel3 && (
                                    <div className="flex items-center gap-2">
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-gray-400 hover:text-purple-400"
                                          onClick={() => handleEditMember(member)}
                                        >
                                          <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-gray-400 hover:text-purple-400"
                                          onClick={() => handleRemoveMember(member.id)}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    )}
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
                </div>

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
                  {!isAccessLevel1 && !isAccessLevel2 && user?.role !== 'viewer' && (
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
                      {!isAccessLevel1 && !isAccessLevel2 && user?.role !== 'viewer' && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-purple-400"
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
                            className="text-gray-400 hover:text-purple-400"
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
            {!isAccessLevel1 && (
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
                    {!isAccessLevel1 && !isAccessLevel2 && user?.role !== 'viewer' && (
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
                    {tasks.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        {user?.role === 'viewer' || user?.role === 'investor' ? 'No tasks assigned to you' : 'No tasks found'}
                      </div>
                    ) : (
                      tasks.map(task => {
                        const assigneeIds = Array.from(new Set(getTaskAssigneeIds(task)))
                        const assigneeNames =
                          assigneeIds.length > 0
                            ? assigneeIds
                                .map(id => {
                                  const member = uniqueAssignableMembers.find(m => m.user_id === id)
                                  return member?.user?.name || member?.user?.email || null
                                })
                                .filter((name, index, array): name is string => !!name && array.indexOf(name) === index)
                                .join(', ')
                            : 'Unassigned'

                        const handleAssigneeToggle = (memberId: string, checked: boolean | "indeterminate") => {
                          const nextAssignees =
                            checked === true
                              ? Array.from(new Set([...assigneeIds, memberId]))
                              : assigneeIds.filter(id => id !== memberId)
                          updateTaskAssignees(task.id, nextAssignees)
                        }

                        return (
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-400 hover:text-indigo-400">
                                    <span className="flex items-center">
                                      <UserIcon className="w-4 h-4 mr-1" />
                                      {assigneeNames}
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700">
                                  <DropdownMenuLabel className="text-gray-300">Assign To</DropdownMenuLabel>
                                  <DropdownMenuSeparator className="bg-gray-700" />
                                  <DropdownMenuItem
                                    className="text-white hover:bg-indigo-900/20 hover:text-indigo-400 focus:bg-indigo-900/20 focus:text-indigo-400"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      updateTaskAssignees(task.id, [])
                                    }}
                                  >
                                    Clear all
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-gray-700" />
                                  {uniqueAssignableMembers.length === 0 ? (
                                    <DropdownMenuItem disabled className="text-gray-500">
                                      No team members available
                                    </DropdownMenuItem>
                                  ) : (
                                    uniqueAssignableMembers.map(member => (
                                      <DropdownMenuCheckboxItem
                                        key={member.id}
                                        checked={assigneeIds.includes(member.user_id)}
                                        onCheckedChange={(checked) => handleAssigneeToggle(member.user_id, checked)}
                                        className="text-white hover:bg-indigo-900/20 hover:text-indigo-400 focus:bg-indigo-900/20 focus:text-indigo-400"
                                      >
                                        {member.user?.name || member.user?.email || 'Unnamed member'}
                                      </DropdownMenuCheckboxItem>
                                    ))
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Badge
                                variant="outline"
                                className={
                                  task.priority === 'high'
                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/50'
                                    : task.priority === 'medium'
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                    : 'bg-green-500/20 text-green-400 border-green-500/50'
                                }
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            {!isAccessLevel1 && !isAccessLevel2 && (user?.role as 'partner' | 'admin' | 'investor' | 'ceo' | 'viewer') !== 'viewer' && (
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
                                    variant="outline"
                                    size="sm"
                                    className="text-gray-400 hover:text-purple-400"
                                    onClick={() => router.push(`/task/${task.id}`)}
                                  >
                                    View Details
                                  </Button>
                                  {!isAccessLevel1 && !isAccessLevel2 && (user?.role as 'partner' | 'admin' | 'investor' | 'ceo' | 'viewer') !== 'viewer' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-purple-900/20 hover:text-purple-400 transition-all duration-300"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          startEditingTask(task)
                                        }}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:bg-purple-900/20 hover:text-purple-400 transition-all duration-300"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteTask(task.id)
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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
                      <div className="flex-1 relative">
                        <Textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          className="flex-1 min-h-[80px] bg-gray-800/30 pr-10"
                        />
                        {newComment.trim() && (
                          <button
                            type="button"
                            onClick={handleEnhanceComment}
                            disabled={enhancingComment}
                            className="absolute bottom-3 right-3 p-2 hover:bg-purple-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Enhance with AI"
                          >
                            {enhancingComment ? (
                              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-purple-400" />
                            )}
                          </button>
                        )}
                      </div>
                      <Button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || enhancingComment}
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

            {/* Project Expenses Toggle */}
            {user && project && user.id === (project.owner_id || project.owner?.id) && (
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  checked={!!project.show_project_expenses}
                  onCheckedChange={handleToggleProjectExpenses}
                  disabled={updatingProjectExpensesSetting}
                  id="toggle-project-expenses"
                />
                <Label htmlFor="toggle-project-expenses">
                  {project.show_project_expenses ? 'Show Project Expenses' : 'Hide Project Expenses'}
                </Label>
              </div>
            )}

            {/* Expenses Section */}
            {!isAccessLevel1 && !isAccessLevel2 && !isAccessLevel3 && project?.show_project_expenses !== false && (
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center">
                        <DollarSign className="w-5 h-5 mr-2" />
                        Project Expenses
                      </CardTitle>
                      <CardDescription>Track and manage project expenses</CardDescription>
                    </div>
                    {user?.role !== 'viewer' && (
                      <Button
                        onClick={() => setShowAddExpense(true)}
                        className="gradient-button"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Expense
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingExpenses ? (
                    <div className="text-center py-8">
                      <LoadingSpinner />
                      <p className="text-gray-400 mt-2">Loading expenses...</p>
                    </div>
                  ) : expenses.length > 0 ? (
                    <div className="space-y-4">
                      {/* Expenses Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <h3 className="text-white font-medium">Total Expenses</h3>
                          <p className="text-2xl text-green-400">
                            ${expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <h3 className="text-white font-medium">Pending Expenses</h3>
                          <p className="text-2xl text-yellow-400">
                            ${expenses.filter(expense => expense.status === 'Pending').reduce((sum, expense) => sum + (expense.amount || 0), 0).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <h3 className="text-white font-medium">Approved Expenses</h3>
                          <p className="text-2xl text-green-400">
                            ${expenses.filter(expense => expense.status === 'Approved').reduce((sum, expense) => sum + (expense.amount || 0), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Expenses Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left text-gray-400">
                          <thead className="bg-gray-800 text-gray-300">
                            <tr>
                              <th className="px-4 py-2">Description</th>
                              <th className="px-4 py-2">Amount</th>
                              <th className="px-4 py-2">Category</th>
                              <th className="px-4 py-2">Status</th>
                              <th className="px-4 py-2">Due Date</th>
                              <th className="px-4 py-2">Added By</th>
                              <th className="px-4 py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenses.map((expense) => (
                              <tr key={expense.id} className="border-b border-gray-800">
                                <td className="px-4 py-2">{expense.description}</td>
                                <td className="px-4 py-2">${(expense.amount || 0).toFixed(2)}</td>
                                <td className="px-4 py-2">{expense.category}</td>
                                <td className="px-4 py-2">
                                  <Badge
                                    variant="outline"
                                    className={
                                      expense.status === 'Approved'
                                        ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                        : expense.status === 'Pending'
                                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                        : expense.status === 'Rejected'
                                        ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                        : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                    }
                                  >
                                    {expense.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-2">
                                  {expense.due_date ? formatDate(expense.due_date) : 'N/A'}
                                </td>
                                <td className="px-4 py-2">
                                  {expense.user?.email || 'Unknown'}
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-gray-400 hover:text-blue-400"
                                      onClick={() => router.push(`/expense/${expense.id}`)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {user?.role !== 'viewer' && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-gray-400 hover:text-purple-400"
                                          onClick={() => {
                                            setEditExpense(expense);
                                            setShowEditExpense(true);
                                          }}
                                        >
                                          <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-gray-400 hover:text-red-400"
                                          onClick={() => {
                                            setEditExpense(expense);
                                            setShowDeleteExpense(true);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-400">No expenses yet</h3>
                      <p className="text-gray-500 mt-1">Add expenses to track project costs</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Project Notes Card */}
            {(isOwner || currentMember) && (
              <Card className="leonardo-card border-gray-800 mt-6">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <StickyNote className="w-5 h-5 text-yellow-400" />
                    <CardTitle>Project Notes</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">Private notes for this project (team only)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 items-start md:flex-row md:gap-2">
                      <Input
                        value={newNoteTitle}
                        onChange={e => setNewNoteTitle(e.target.value)}
                        placeholder="Note title (optional)"
                        className="flex-1 bg-gray-800/30"
                        disabled={loadingNotes}
                      />
                      <div className="flex-1 relative">
                        <Textarea
                          value={newNote}
                          onChange={e => setNewNote(e.target.value)}
                          placeholder="Add a note..."
                          className="flex-1 min-h-[60px] bg-gray-800/30 pr-10"
                          disabled={loadingNotes}
                        />
                        {newNote.trim() && (
                          <button
                            type="button"
                            onClick={handleEnhanceNote}
                            disabled={enhancingNote || loadingNotes}
                            className="absolute bottom-3 right-3 p-2 hover:bg-purple-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Enhance with AI"
                          >
                            {enhancingNote ? (
                              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-purple-400" />
                            )}
                          </button>
                        )}
                      </div>
                      <Button
                        onClick={handleAddNote}
                        disabled={(!newNote.trim() && !newNoteTitle.trim()) || loadingNotes || enhancingNote}
                        className="gradient-button self-end"
                      >
                        Add
                      </Button>
                    </div>
                    {loadingNotes ? (
                      <div className="text-gray-400">Loading notes...</div>
                    ) : notes.length === 0 ? (
                      <div className="text-gray-400">No notes yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {notes.map(note => (
                          <div key={note.id} className="p-3 bg-gray-800/50 rounded-lg flex justify-between items-start">
                            <div className="w-full">
                              {editingNoteId === note.id ? (
                                <>
                                  <Input
                                    value={editingNoteTitle}
                                    onChange={e => setEditingNoteTitle(e.target.value)}
                                    placeholder="Note title (optional)"
                                    className="mb-2 bg-gray-900"
                                    disabled={loadingNotes}
                                  />
                                  <Textarea
                                    value={editingNoteContent}
                                    onChange={e => setEditingNoteContent(e.target.value)}
                                    placeholder="Edit note content..."
                                    className="mb-2 bg-gray-900"
                                    disabled={loadingNotes}
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" onClick={handleSaveEditNote} disabled={loadingNotes || (!editingNoteTitle.trim() && !editingNoteContent.trim())}>
                                      Save
                                    </Button>
                                    <Button size="sm" variant="outline" className="border-gray-700" onClick={handleCancelEditNote} disabled={loadingNotes}>
                                      Cancel
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {note.note_title && (
                                    <div className="text-base font-semibold text-white mb-1">{note.note_title}</div>
                                  )}
                                  <div className="text-sm text-white whitespace-pre-line">{note.content}</div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    By {note.created_by?.full_name || note.created_by?.email || 'Unknown'} on {note.created_at ? new Date(note.created_at).toLocaleDateString() : ''}
                                  </div>
                                </>
                              )}
                            </div>
                            {(user?.id === note.created_by?.id || isOwner) && editingNoteId !== note.id && (
                              <Button size="icon" variant="ghost" className="text-blue-400 hover:text-blue-300 mr-1" onClick={() => handleStartEditNote(note)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {(user?.id === note.created_by?.id || isOwner) && editingNoteId !== note.id && (
                              <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteNote(note.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
                  </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Members */}
            {!isAccessLevel1 && !isAccessLevel2 && (
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
                          <Avatar className="w-10 h-10 mr-3">
                            <AvatarImage src={member.user?.avatar_url || undefined} />
                            <AvatarFallback>{member.user?.name?.[0] || member.user?.email?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-white">{member.user?.name || member.user?.email}</h4>
                            {member.position && (
                              <Badge variant="default" className="mt-1">{member.position}</Badge>
                            )}
                            {member.access_level && (
                              <p className="text-xs text-gray-400">Access Level: {member.access_level}</p>
                            )}
                          </div>
                        </div>
                        {user?.role && (['partner', 'admin', 'investor', 'ceo'] as const).includes(user.role as any) && !isAccessLevel3 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-purple-400"
                              onClick={() => handleEditMember(member)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-purple-400"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {user?.role && (['partner', 'admin', 'investor', 'ceo'] as const).includes(user.role as any) && !isAccessLevel3 && (
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
            )}

            {/* Project Deadline */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Project Deadline
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Set or update the project deadline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Current Deadline:</span>
                    <span className="text-white font-medium">
                      {project?.deadline ? new Date(project.deadline).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  {!isAccessLevel1 && !isAccessLevel2 && !isAccessLevel3 && (
                    <Button
                      variant="outline"
                      className="w-full border-purple-500/20 hover:bg-purple-500/10 hover:text-purple-400"
                      onClick={() => setShowDeadlineDialog(true)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      {project?.deadline ? 'Update Deadline' : 'Set Deadline'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Actions */}
            {!isAccessLevel1 && !isAccessLevel2 && !isAccessLevel3 && (
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
                    {user?.role !== 'viewer' && (
                      <>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[200px] justify-center items-center gap-2 bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="w-4 h-4" /> Edit Project
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[200px] justify-center items-center gap-2 bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30"
                      onClick={() => router.push(`/projects/${projectId}/roles`)}
                    >
                      <Briefcase className="w-4 h-4" /> Manage Open Positions
                    </Button>
                    {!(String(currentMember?.access_level) === '4') && (
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[200px] justify-center items-center gap-2 bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30"
                      onClick={handleDeleteProject}
                    >
                      <Trash2 className="w-4 h-4" /> Delete Project
                    </Button>
                    )}
                      </>
                    )}
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[200px] justify-center items-center gap-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-400 border-purple-500/50 hover:bg-gradient-to-r hover:from-purple-500/30 hover:to-blue-500/30"
                      onClick={() => router.push(`/publicprojects/${projectId}`)}
                    >
                      <Eye className="w-4 h-4" /> View Public Project
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
                    <Button
                      variant="outline"
                      className={`flex-1 min-w-[200px] justify-center items-center gap-2 ${
                        project?.accepts_support
                          ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                          : 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                      }`}
                      onClick={handleTogglePublicFunding}
                    >
                      {project?.accepts_support ? (
                        <>
                          <DollarSign className="w-4 h-4" /> Disable Support Project
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" /> Enable Support Project
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Card Visibility Toggles */}
                  <div className="space-y-4 mt-6 pt-6 border-t border-gray-800">
                    <h4 className="text-sm font-medium text-gray-400">Card Visibility</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Project Information</span>
                        <Switch
                          checked={project?.show_project_info !== false}
                          onCheckedChange={handleToggleProjectInfo}
                          disabled={updatingProjectInfoSetting}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Project Overview</span>
                        <Switch
                          checked={project?.show_project_overview !== false}
                          onCheckedChange={handleToggleProjectOverview}
                          disabled={updatingProjectOverviewSetting}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Project Expenses</span>
                        <Switch
                          checked={project?.show_project_expenses !== false}
                          onCheckedChange={handleToggleProjectExpenses}
                          disabled={updatingProjectExpensesSetting}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Overview Toggle */}
            {user && project && user.id === (project.owner_id || project.owner?.id) && (
              <div className="flex items-center gap-3 mb-4">
                <Switch
                  checked={!!project.show_project_overview}
                  onCheckedChange={handleToggleProjectOverview}
                  disabled={updatingProjectOverviewSetting}
                  id="toggle-project-overview"
                />
                <Label htmlFor="toggle-project-overview">
                  {project.show_project_overview ? 'Show Project Overview' : 'Hide Project Overview'}
                </Label>
              </div>
            )}

            {/* Project Overview */}
            {!isAccessLevel1 && !isAccessLevel2 && !isAccessLevel3 && project?.show_project_overview !== false && (
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Project Overview
                </CardTitle>
                <CardDescription>Key information about the project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Project Description</Label>
                      {isEditing ? (
                        <Textarea
                          value={editProjectData.description}
                          onChange={(e) => setEditProjectData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter project description"
                          className="min-h-[100px]"
                        />
                      ) : (
                        <p className="text-sm text-gray-400">{project?.description || 'No description available'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Project Goals</Label>
                      {isEditing ? (
                        <Textarea
                          value={editProjectData.goals}
                          onChange={(e) => setEditProjectData(prev => ({ ...prev, goals: e.target.value }))}
                          placeholder="Enter project goals"
                          className="min-h-[100px]"
                        />
                      ) : (
                        <p className="text-sm text-gray-400">{(project as any)?.goals || 'No goals defined'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Target Market</Label>
                      {isEditing ? (
                        <Textarea
                          value={editProjectData.target_market}
                          onChange={(e) => setEditProjectData(prev => ({ ...prev, target_market: e.target.value }))}
                          placeholder="Describe the target market"
                          className="min-h-[100px]"
                        />
                      ) : (
                        <p className="text-sm text-gray-400">{(project as any)?.target_market || 'No target market defined'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Add/Edit Position Dialog */}
            <Dialog open={isAddingPosition || isEditingPosition} onOpenChange={(open) => {
              if (!open) {
                setIsAddingPosition(false)
                setIsEditingPosition(false)
                setEditingPosition(null)
                setNewPosition({
                  title: '',
                  description: '',
                  role_type: '',
                  commitment: ''
                })
              }
            }}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{isEditingPosition ? 'Edit Position' : 'Add New Position'}</DialogTitle>
                  <DialogDescription>
                    {isEditingPosition ? 'Update the position details' : 'Fill in the details for the new position'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Position Title</Label>
                    <Input
                      id="title"
                      value={newPosition.title}
                      onChange={(e) => setNewPosition(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Senior Developer"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newPosition.description}
                      onChange={(e) => setNewPosition(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the position and requirements"
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role_type">Role Type</Label>
                    <Select
                      value={newPosition.role_type}
                      onValueChange={(value) => setNewPosition(prev => ({ ...prev, role_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="commitment">Time Commitment</Label>
                    <Select
                      value={newPosition.commitment}
                      onValueChange={(value) => setNewPosition(prev => ({ ...prev, commitment: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select commitment level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddingPosition(false)
                      setIsEditingPosition(false)
                      setEditingPosition(null)
                      setNewPosition({
                        title: '',
                        description: '',
                        role_type: '',
                        commitment: ''
                      })
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePosition}
                    className="gradient-button"
                  >
                    {isEditingPosition ? 'Update Position' : 'Add Position'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Project Information and Status Cards at the bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {!isAccessLevel1 && !isAccessLevel2 && !isAccessLevel3 && (
            <div className="lg:col-span-2">
              {/* Project Information Toggle */}
              {user && project && user.id === (project.owner_id || project.owner?.id) && (
                <div className="flex items-center gap-3 mb-4">
                  <Switch
                    checked={!!project.show_project_info}
                    onCheckedChange={handleToggleProjectInfo}
                    disabled={updatingProjectInfoSetting}
                    id="toggle-project-info"
                  />
                  <Label htmlFor="toggle-project-info">
                    {project.show_project_info ? 'Show Project Information' : 'Hide Project Information'}
                  </Label>
                </div>
              )}
              
              {/* Project Information Card */}
              {project?.show_project_info !== false && (
                <ProjectInfoCard project={project} />
              )}
            </div>
          )}
          <div className={user?.role !== 'viewer' ? '' : 'lg:col-span-3'}>
            <StatusCard 
              project={project} 
              onStatusChange={canChangeStatus ? handleStatusChange : undefined}
              canChangeStatus={!!canChangeStatus}
            />
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
              <div className="relative">
                <input
                type="range"
                min="0"
                max="100"
                value={editProjectData.progress}
                onChange={(e) => setEditProjectData(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-800 rounded-full appearance-none cursor-pointer"
                />
                <div 
                  className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 pointer-events-none"
                  style={{ width: `${editProjectData.progress}%` }}
                />
              </div>
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
              <Label>Assign To</Label>
              <MultiSelect
                options={uniqueAssignableMembers.map(member => ({
                  value: member.user_id,
                  label: member.user?.name || member.user?.email || 'Unnamed member'
                }))}
                value={newTask.assigned_users}
                onChange={(values) => setNewTask(prev => ({ ...prev, assigned_users: values }))}
                placeholder="Select one or more team members (optional)"
              />
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
                onChange={(e) => setEditingTask((prev: any) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={editingTask?.description || ''}
                onChange={(e) => setEditingTask((prev: any) => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
              />
            </div>
            <div>
              <Label>Assign To</Label>
              <MultiSelect
                options={uniqueAssignableMembers.map(member => ({
                  value: member.user_id,
                  label: member.user?.name || member.user?.email || 'Unnamed member'
                }))}
                value={editingTask ? getTaskAssigneeIds(editingTask) : []}
                onChange={(values) =>
                  setEditingTask((prev: any) => (prev ? { ...prev, assigned_users: values } : prev))
                }
                placeholder="Select one or more team members"
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="datetime-local"
                value={editingTask?.due_date || ''}
                onChange={(e) => setEditingTask((prev: any) => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={editingTask?.priority || 'medium'}
                onValueChange={(value) => setEditingTask((prev: any) => ({ ...prev, priority: value }))}
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
                onValueChange={(value) => setEditingTask((prev: any) => ({ ...prev, status: value }))}
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
                onChange={(e) => setEditingScheduleItem((prev: any) => ({
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
                onChange={(e) => setEditingScheduleItem((prev: any) => ({
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
                onChange={(e) => setEditingScheduleItem((prev: any) => ({
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

      {/* Rename File Dialog */}
      <Dialog open={isRenamingFile} onOpenChange={setIsRenamingFile}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter a new name for the file. The extension will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New File Name</Label>
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="Enter new file name"
              />
              <p className="text-sm text-gray-400">
                Current file: {fileToRename?.name}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsRenamingFile(false);
                setFileToRename(null);
                setNewFileName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameFile}
              className="gradient-button"
              disabled={!newFileName.trim()}
            >
              Rename File
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Team Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Update details for {selectedMember?.user?.name || selectedMember?.user?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={editPosition}
                onChange={e => setEditPosition(e.target.value)}
                placeholder="e.g. Senior Developer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="access_level">Access Level</Label>
              <Select
                value={editAccessLevel}
                onValueChange={setEditAccessLevel}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedMember(null)
                setEditPosition('')
                setEditAccessLevel('1')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateMember} className="gradient-button">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Link Dialog */}
      <Dialog open={isAddingLink || isEditingLink} onOpenChange={(open) => {
        if (!open) {
          setIsAddingLink(false)
          setIsEditingLink(false)
          setEditingLink(null)
          setNewLink({
            title: '',
            url: '',
            description: ''
          })
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditingLink ? 'Edit Link' : 'Add New Link'}</DialogTitle>
            <DialogDescription>
              {isEditingLink ? 'Update the link details' : 'Add a new external link to your project'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Link Title</Label>
              <Input
                id="title"
                value={isEditingLink ? editingLink?.title : newLink.title}
                onChange={(e) => {
                  if (isEditingLink) {
                    setEditingLink({ ...editingLink, title: e.target.value })
                  } else {
                    setNewLink({ ...newLink, title: e.target.value })
                  }
                }}
                placeholder="Enter link title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={isEditingLink ? editingLink?.url : newLink.url}
                onChange={(e) => {
                  if (isEditingLink) {
                    setEditingLink({ ...editingLink, url: e.target.value })
                  } else {
                    setNewLink({ ...newLink, url: e.target.value })
                  }
                }}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={isEditingLink ? editingLink?.description : newLink.description}
                onChange={(e) => {
                  if (isEditingLink) {
                    setEditingLink({ ...editingLink, description: e.target.value })
                  } else {
                    setNewLink({ ...newLink, description: e.target.value })
                  }
                }}
                placeholder="Brief description of the link"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingLink(false)
                setIsEditingLink(false)
                setEditingLink(null)
                setNewLink({
                  title: '',
                  url: '',
                  description: ''
                })
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditingLink ? handleUpdateLink : handleAddLink}
              className="gradient-button"
            >
              {isEditingLink ? 'Update Link' : 'Add Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cropper Modal */}
      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>Crop and zoom the image as needed, then save.</DialogDescription>
          </DialogHeader>
          <div className="relative w-full h-[400px] bg-black">
            {croppingImage && (
              <Cropper
                image={croppingImage}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex gap-4 items-center mt-4">
            <Label>Zoom</Label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropOpen(false)}>Cancel</Button>
            <Button onClick={handleCropSave} className="gradient-button" disabled={isUploadingMedia}>
              {isUploadingMedia ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Rename Dialog for Project Files */}
      <Dialog open={isRenamingTeamFile} onOpenChange={setIsRenamingTeamFile}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename File</DialogTitle>
            <DialogDescription>
              Enter a new name for the file. The extension will be preserved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New File Name</Label>
              <Input
                value={newTeamFileName}
                onChange={(e) => setNewTeamFileName(e.target.value)}
                placeholder="Enter new file name"
              />
              <p className="text-sm text-gray-400">
                Current file: {teamFileToRename?.name}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsRenamingTeamFile(false);
                setTeamFileToRename(null);
                setNewTeamFileName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameTeamFile}
              className="gradient-button"
              disabled={!newTeamFileName.trim()}
            >
              Rename File
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Team File Name Dialog */}
      <Dialog open={isTeamFileNameDialogOpen} onOpenChange={setIsTeamFileNameDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Name Your File</DialogTitle>
            <DialogDescription>
              Enter a name for your file (extension will be preserved).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>File Name</Label>
              <Input
                value={teamFileNameInput}
                onChange={e => setTeamFileNameInput(e.target.value)}
                placeholder="Enter file name"
              />
              <p className="text-sm text-gray-400">
                Original: {teamFileToUpload?.name}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsTeamFileNameDialogOpen(false);
                setTeamFileToUpload(null);
                setTeamFileNameInput('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTeamFileName}
              className="gradient-button"
              disabled={!teamFileNameInput.trim()}
            >
              Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deadline Dialog */}
      <Dialog open={showDeadlineDialog} onOpenChange={setShowDeadlineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Deadline</DialogTitle>
            <DialogDescription>
              Choose a new deadline for this project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeadlineDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeadlineUpdate}
            >
              Update Deadline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
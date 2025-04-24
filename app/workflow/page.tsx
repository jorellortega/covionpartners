"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  FileText,
  BarChart,
  Timer,
  Flag,
  Filter,
  ChevronDown,
  Upload,
  Link as LinkIcon,
  File,
  X,
  Search,
  StickyNote
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  due_date: string
  project_id: string
  assigned_to: string | null
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
  project?: {
    id: string
    name: string
  }
  attachments?: {
    type: 'file' | 'link'
    url: string
    name: string
  }[]
  notes?: string
}

interface Project {
  id: string
  name: string
  color: string
}

export default function WorkflowPage() {
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [activeView, setActiveView] = useState<"weekly" | "monthly">("weekly")
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [linkName, setLinkName] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const { user } = useAuth()
  const { toast } = useToast()
  const [showFilter, setShowFilter] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [currentNote, setCurrentNote] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')
          .order('created_at', { ascending: false })

        if (projectsError) throw projectsError
        setProjects(projectsData?.map(p => ({
          ...p,
          color: getProjectColor(p.id)
        })) || [])

        // Fetch tasks with proper single row query format
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false })

        if (tasksError) throw tasksError
        setTasks(tasksData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load tasks and projects',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription
    const subscription = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const getProjectColor = (id: string) => {
    const colors = ['blue', 'purple', 'emerald']
    return colors[id.charCodeAt(0) % colors.length]
  }

  const handleStatusUpdate = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ))
    } catch (error) {
      console.error('Error updating task status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive'
      })
    }
  }

  const handlePriorityUpdate = async (taskId: string, newPriority: 'low' | 'medium' | 'high') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority: newPriority })
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, priority: newPriority } : task
      ))
    } catch (error) {
      console.error('Error updating task priority:', error)
      toast({
        title: 'Error',
        description: 'Failed to update task priority',
        variant: 'destructive'
      })
    }
  }

  const handleFileUpload = async (taskId: string, file: File) => {
    try {
      const fileName = `${taskId}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = await supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          attachments: [
            ...(tasks.find(t => t.id === taskId)?.attachments || []),
            {
              type: 'file',
              url: publicUrl,
              name: file.name
            }
          ]
        })
        .eq('id', taskId)

      if (updateError) throw updateError

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? {
              ...task,
              attachments: [...(task.attachments || []), {
                type: 'file',
                url: publicUrl,
                name: file.name
              }]
            }
          : task
      ))

      toast({
        title: 'Success',
        description: 'File uploaded successfully'
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive'
      })
    }
  }

  const handleLinkAdd = async (taskId: string, url: string, name: string) => {
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          attachments: [
            ...(tasks.find(t => t.id === taskId)?.attachments || []),
            {
              type: 'link',
              url: url,
              name: name || url
            }
          ]
        })
        .eq('id', taskId)

      if (updateError) throw updateError

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? {
              ...task,
              attachments: [...(task.attachments || []), {
                type: 'link',
                url: url,
                name: name || url
              }]
            }
          : task
      ))

      toast({
        title: 'Success',
        description: 'Link added successfully'
      })
    } catch (error) {
      console.error('Error adding link:', error)
      toast({
        title: 'Error',
        description: 'Failed to add link',
        variant: 'destructive'
      })
    }
  }

  const handleLinkDialogSubmit = () => {
    if (currentTaskId && linkUrl) {
      handleLinkAdd(currentTaskId, linkUrl, linkName)
      setLinkDialogOpen(false)
      setLinkName("")
      setLinkUrl("")
      setCurrentTaskId(null)
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-400/10 text-red-400 border border-red-400/20">
            <Timer className="w-3 h-3" />
            High
          </div>
        );
      case "medium":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
            <Timer className="w-3 h-3" />
            Medium
          </div>
        );
      case "low":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20">
            <Timer className="w-3 h-3" />
            Low
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "in_progress":
        return <Clock className="w-5 h-5 text-blue-500" />
      case "pending":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getProjectColorClass = (color: string) => {
    const colors = {
      blue: "bg-blue-500/10 border-blue-500/20 hover:border-blue-500/30",
      purple: "bg-purple-500/10 border-purple-500/20 hover:border-purple-500/30",
      emerald: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/30"
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400">
            Completed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-500/20 text-blue-400">
            In Progress
          </Badge>
        )
      case "active":
        return (
          <Badge className="bg-purple-500/20 text-purple-400">
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400">
            Pending
          </Badge>
        )
      default:
        return null
    }
  }

  const handleNoteUpdate = async (taskId: string, note: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ notes: note })
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, notes: note } : task
      ))

      toast({
        title: "Success",
        description: "Note updated successfully"
      })
    } catch (error) {
      console.error('Error updating note:', error)
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive"
      })
    }
  }

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderTaskCard = (task: Task) => (
    <div
      key={task.id}
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2 rounded-lg transition-all duration-300 ${
        task.status === "completed"
          ? "opacity-20 hover:opacity-40 bg-gray-900/20 py-1 px-3"
          : "bg-black hover:bg-gray-900 p-3"
      }`}
      onClick={() => router.push(`/task/${task.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-start sm:items-center gap-4 w-full sm:w-auto">
        {getStatusIcon(task.status)}
        <div className="flex-1">
          <h3 className={`font-medium text-white transition-all duration-300 ${
            task.status === "completed" ? "text-sm text-gray-400" : "text-base"
          }`}>{task.title}</h3>
          <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-1 transition-all duration-300 ${
            task.status === "completed" ? "text-xs text-gray-500" : "text-sm text-gray-400"
          }`}>
            <div className="flex items-center">
              <Calendar className={`mr-1 transition-all duration-300 ${
                task.status === "completed" ? "w-3 h-3 text-gray-500" : "w-4 h-4"
              }`} />
              {new Date(task.due_date).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-0 h-auto hover:bg-transparent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getPriorityBadge(task.priority)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-32 bg-gray-900 border-gray-700">
                  <DropdownMenuItem
                    className="text-red-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePriorityUpdate(task.id, "high")
                    }}
                  >
                    <Timer className="mr-2 h-4 w-4" />
                    High
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePriorityUpdate(task.id, "medium")
                    }}
                  >
                    <Timer className="mr-2 h-4 w-4" />
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-green-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePriorityUpdate(task.id, "low")
                    }}
                  >
                    <Timer className="mr-2 h-4 w-4" />
                    Low
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30 w-full sm:w-auto"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/task/${task.id}`);
            }}
          >
            View Details
          </Button>
          {task.project?.id && (
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30 w-full sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/projects/${task.project?.id}`);
              }}
            >
              View Project
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={`hover:bg-purple-900/20 hover:text-purple-400 transition-all duration-300 ${
              task.status === "completed" ? "h-7 w-7 opacity-50" : "h-8 w-8"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              // Handle file text click
            }}
          >
            <FileText className={`transition-all duration-300 ${
              task.status === "completed" ? "w-3 h-3" : "w-4 h-4"
            }`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`hover:bg-purple-900/20 hover:text-purple-400 transition-all duration-300 ${
                  task.status === "completed" ? "h-7 w-7 opacity-50" : "h-8 w-8"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <Upload className={`transition-all duration-300 ${
                  task.status === "completed" ? "w-3 h-3" : "w-4 h-4"
                }`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40 bg-gray-900 border-gray-700">
              <DropdownMenuItem
                className="text-purple-400 hover:bg-purple-900/20 focus:bg-purple-900/20 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      handleFileUpload(task.id, file)
                    }
                  }
                  input.click()
                }}
              >
                <File className="mr-2 h-4 w-4" />
                Upload File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className={`hover:bg-purple-900/20 hover:text-purple-400 transition-all duration-300 ${
              task.status === "completed" ? "h-7 w-7 opacity-50" : "h-8 w-8"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentTaskId(task.id)
              setLinkDialogOpen(true)
            }}
          >
            <LinkIcon className={`transition-all duration-300 ${
              task.status === "completed" ? "w-3 h-3" : "w-4 h-4"
            }`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`hover:bg-purple-900/20 hover:text-purple-400 transition-all duration-300 ${
              task.status === "completed" ? "h-7 w-7 opacity-50" : "h-8 w-8"
            }`}
            onClick={(e) => {
              e.stopPropagation()
              setCurrentTaskId(task.id)
              setCurrentNote(task.notes || "")
              setNoteDialogOpen(true)
            }}
          >
            <StickyNote className={`transition-all duration-300 ${
              task.status === "completed" ? "w-3 h-3" : "w-4 h-4"
            }`} />
          </Button>
        </div>
      </div>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-black border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add Link</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
                className="bg-black border-gray-800 focus:border-gray-700"
                placeholder="Enter link name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-black border-gray-800 focus:border-gray-700"
                placeholder="Enter URL"
              />
            </div>
          </div>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={() => {
                setLinkDialogOpen(false)
                setLinkName("")
                setLinkUrl("")
                setCurrentTaskId(null)
              }}
              className="hover:bg-gray-900 hover:text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLinkDialogSubmit}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!linkUrl}
            >
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-black border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add Note</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <textarea
                id="note"
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your note here..."
              />
            </div>
          </div>
          <DialogFooter className="flex space-x-2">
            <Button
              variant="ghost"
              onClick={() => {
                setNoteDialogOpen(false)
                setCurrentNote("")
                setCurrentTaskId(null)
              }}
              className="hover:bg-gray-900 hover:text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (currentTaskId) {
                  handleNoteUpdate(currentTaskId, currentNote)
                  setNoteDialogOpen(false)
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
              >
                <Home className="w-6 h-6 mr-2" />
                Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-white">My Workflow</h1>
            </div>
            <div className="flex items-center justify-end w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 hover:bg-gray-800/50"
                  onClick={() => setShowFilter(!showFilter)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-8">
          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Completed Tasks</p>
                  <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                    {tasks.filter(t => t.status === 'completed').length}
                  </h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">In Progress</p>
                  <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Total Tasks</p>
                  <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{tasks.length}</h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-800 bg-gray-900/50 cursor-pointer hover:bg-gray-800/50 transition-all duration-200"
            onClick={() => router.push('/projects')}
          >
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Projects</p>
                  <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{projects.length}</h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <BarChart className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks View */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white">Tasks Overview</h2>
            <div className="flex-1 w-full sm:max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black border-gray-800 focus:border-gray-700 rounded-lg"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button className="flex-1 sm:flex-none gradient-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>

          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full sm:w-[400px] grid-cols-2 bg-gray-800/30">
              <TabsTrigger 
                value="weekly"
                className="data-[state=active]:bg-gray-700"
                onClick={() => setActiveView("weekly")}
              >
                This Week
              </TabsTrigger>
              <TabsTrigger 
                value="monthly"
                className="data-[state=active]:bg-gray-700"
                onClick={() => setActiveView("monthly")}
              >
                This Month
              </TabsTrigger>
            </TabsList>

            <TabsContent value="weekly" className="mt-6">
              <div className="space-y-6">
                {projects.map((project) => {
                  const projectTasks = filteredTasks.filter(task => 
                    task.project_id === project.id && 
                    new Date(task.due_date) >= new Date() && 
                    new Date(task.due_date) <= new Date(new Date().setDate(new Date().getDate() + 7))
                  )
                  
                  if (projectTasks.length === 0) return null

                  return (
                    <Card 
                      key={project.id}
                      className={`border-gray-800 bg-black ${getProjectColorClass(project.color)}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span>{project.name}</span>
                          <Badge className={`bg-${project.color}-500/20 text-${project.color}-400 w-fit`}>
                            {projectTasks.length} tasks
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {projectTasks.map(renderTaskCard)}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="mt-6">
              <div className="space-y-6">
                {projects.map((project) => {
                  const projectTasks = filteredTasks.filter(task => 
                    task.project_id === project.id && 
                    new Date(task.due_date) >= new Date() && 
                    new Date(task.due_date) <= new Date(new Date().setMonth(new Date().getMonth() + 1))
                  )
                  
                  if (projectTasks.length === 0) return null

                  return (
                    <Card 
                      key={project.id}
                      className={`border-gray-800 bg-black ${getProjectColorClass(project.color)}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span>{project.name}</span>
                          <Badge className={`bg-${project.color}-500/20 text-${project.color}-400 w-fit`}>
                            {projectTasks.length} tasks
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {projectTasks.map(renderTaskCard)}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 
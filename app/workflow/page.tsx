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
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/components/ui/use-toast"

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
  const { user } = useAuth()
  const { toast } = useToast()

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

        // Fetch tasks
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">
            High Priority
          </Badge>
        )
      case "medium":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30">
            Medium Priority
          </Badge>
        )
      case "low":
        return (
          <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">
            Low Priority
          </Badge>
        )
      default:
        return null
    }
  }

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

  const renderTaskCard = (task: Task) => (
    <div
      key={task.id}
      className={`flex items-center justify-between rounded-lg transition-all duration-300 ${
        task.status === "completed"
          ? "opacity-20 hover:opacity-40 bg-gray-900/20 py-1 px-3"
          : "bg-gray-900/50 hover:bg-gray-900/70 p-3"
      }`}
    >
      <div className="flex items-center space-x-4">
        {getStatusIcon(task.status)}
        <div>
          <h3 className={`font-medium text-white transition-all duration-300 ${
            task.status === "completed" ? "text-sm text-gray-400" : "text-base"
          }`}>{task.title}</h3>
          <div className={`flex items-center space-x-4 mt-1 transition-all duration-300 ${
            task.status === "completed" ? "text-xs text-gray-500" : "text-sm text-gray-400"
          }`}>
            <div className="flex items-center">
              <Calendar className={`mr-1 transition-all duration-300 ${
                task.status === "completed" ? "w-3 h-3 text-gray-500" : "w-4 h-4"
              }`} />
              {new Date(task.due_date).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Timer className={`mr-1 transition-all duration-300 ${
                task.status === "completed" ? "w-3 h-3 text-gray-500" : "w-4 h-4"
              }`} />
              {task.priority}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {getPriorityBadge(task.priority)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400 transition-all duration-300 ${
                task.status === "completed" ? "h-7 text-xs px-2 opacity-50" : ""
              }`}
            >
              Update
              <ChevronDown className={`ml-2 transition-all duration-300 ${
                task.status === "completed" ? "w-3 h-3" : "w-4 h-4"
              }`} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40 bg-gray-900 border-gray-700">
            <DropdownMenuItem
              className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
              onClick={() => handleStatusUpdate(task.id, "pending")}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-blue-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
              onClick={() => handleStatusUpdate(task.id, "in_progress")}
            >
              <Clock className="mr-2 h-4 w-4" />
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-green-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
              onClick={() => handleStatusUpdate(task.id, "completed")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className={`hover:bg-purple-900/20 hover:text-purple-400 transition-all duration-300 ${
            task.status === "completed" ? "h-7 w-7 opacity-50" : "h-8 w-8"
          }`}
        >
          <FileText className={`transition-all duration-300 ${
            task.status === "completed" ? "w-3 h-3" : "w-4 h-4"
          }`} />
        </Button>
      </div>
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
          <div className="flex items-center justify-between">
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
            <Button className="gradient-button">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Completed Tasks</p>
                  <h3 className="text-2xl font-bold text-white">
                    {tasks.filter(t => t.status === 'completed').length}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-500" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">In Progress</p>
                  <h3 className="text-2xl font-bold text-white">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Timer className="w-6 h-6 text-purple-500" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Total Tasks</p>
                  <h3 className="text-2xl font-bold text-white">{tasks.length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <BarChart className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Projects</p>
                  <h3 className="text-2xl font-bold text-white">{projects.length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks View */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Tasks Overview</h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button className="gradient-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>
          </div>

          <Tabs defaultValue="weekly" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-gray-800/30">
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
                  const projectTasks = tasks.filter(task => 
                    task.project_id === project.id && 
                    new Date(task.due_date) >= new Date() && 
                    new Date(task.due_date) <= new Date(new Date().setDate(new Date().getDate() + 7))
                  )
                  
                  if (projectTasks.length === 0) return null

                  return (
                    <Card 
                      key={project.id}
                      className={`border-gray-800 ${getProjectColorClass(project.color)}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center justify-between">
                          <span>{project.name}</span>
                          <Badge className={`bg-${project.color}-500/20 text-${project.color}-400`}>
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
                  const projectTasks = tasks.filter(task => 
                    task.project_id === project.id && 
                    new Date(task.due_date) >= new Date() && 
                    new Date(task.due_date) <= new Date(new Date().setMonth(new Date().getMonth() + 1))
                  )
                  
                  if (projectTasks.length === 0) return null

                  return (
                    <Card 
                      key={project.id}
                      className={`border-gray-800 ${getProjectColorClass(project.color)}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center justify-between">
                          <span>{project.name}</span>
                          <Badge className={`bg-${project.color}-500/20 text-${project.color}-400`}>
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
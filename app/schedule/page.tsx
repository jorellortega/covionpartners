"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { supabase } from "@/lib/supabase"
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  CheckSquare,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Calendar as CalendarIconSolid,
  User,
  Mail,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

interface Task {
  id: string
  title: string
  description: string
  project_id: string
  assigned_to: string
  due_date: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

interface Event {
  id: string
  title: string
  description: string
  project_id: string
  start_time: string
  end_time: string
  attendees: string[]
  created_by: string
  created_at: string
}

interface TeamMemberAvailability {
  id: string
  user_id: string
  user_name: string
  date: string
  available_hours: string[]
  status: 'available' | 'busy' | 'out_of_office'
}

export default function SchedulePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [teamAvailability, setTeamAvailability] = useState<TeamMemberAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isAddingEvent, setIsAddingEvent] = useState(false)
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium',
  })
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    project_id: '',
    start_time: '',
    end_time: '',
    attendees: [] as string[],
  })
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month' | 'list'>('day')
  const [showAllProjects, setShowAllProjects] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isDeletingTask, setIsDeletingTask] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (selectedProject) {
      setShowAllProjects(false)
    } else {
      setShowAllProjects(true)
    }
  }, [selectedProject])

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        
        // Fetch all projects for the user
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('owner_id', user.id)

        if (projectsError) throw projectsError
        setProjects(projectsData || [])

        // If there are projects and no selected project, select the first one
        if (projectsData?.length > 0 && !selectedProject) {
          setSelectedProject(projectsData[0].id)
        }

        // Fetch tasks for selected project or all projects
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .in('project_id', showAllProjects 
            ? projectsData?.map(p => p.id) || [] 
            : [selectedProject || '']
          )
          .order('due_date', { ascending: true })

        if (tasksError) throw tasksError
        setTasks(tasksData || [])

        // Fetch events for selected project or all projects
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .in('project_id', showAllProjects 
            ? projectsData?.map(p => p.id) || [] 
            : [selectedProject || '']
          )
          .order('start_time', { ascending: true })

        if (eventsError) throw eventsError
        setEvents(eventsData || [])

        // Fetch team availability
        const { data: availabilityData, error: availabilityError } = await supabase
          .from('team_availability')
          .select('*')
          .eq('date', selectedDate.toISOString().split('T')[0])

        if (availabilityError) throw availabilityError
        setTeamAvailability(availabilityData || [])

      } catch (error) {
        console.error('Error fetching schedule data:', error)
        toast.error('Failed to load schedule data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, selectedDate, selectedProject, showAllProjects])

  const handleAddTask = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...newTask,
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
        project_id: '',
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

  const handleAddEvent = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...newEvent,
          created_by: user.id,
        }])
        .select()
        .single()

      if (error) throw error

      setEvents(prev => [...prev, data])
      setIsAddingEvent(false)
      setNewEvent({
        title: '',
        description: '',
        project_id: '',
        start_time: '',
        end_time: '',
        attendees: [],
      })
      toast.success('Event added successfully')
    } catch (error) {
      console.error('Error adding event:', error)
      toast.error('Failed to add event')
    }
  }

  const handleProjectChange = (value: string) => {
    if (value === 'all') {
      setSelectedProject(null)
      setShowAllProjects(true)
    } else {
      setSelectedProject(value)
      setShowAllProjects(false)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsEditingTask(true)
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: editingTask.title,
          description: editingTask.description,
          project_id: editingTask.project_id,
          assigned_to: editingTask.assigned_to,
          due_date: editingTask.due_date,
          status: editingTask.status,
          priority: editingTask.priority,
        })
        .eq('id', editingTask.id)
        .select()
        .single()

      if (error) throw error

      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? data : task
      ))
      setIsEditingTask(false)
      setEditingTask(null)
      toast.success('Task updated successfully')
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('Failed to update task')
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete.id)

      if (error) throw error

      setTasks(prev => prev.filter(task => task.id !== taskToDelete.id))
      setIsDeletingTask(false)
      setTaskToDelete(null)
      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Project Schedule</h1>
          <p className="text-sm sm:text-base text-gray-400">Manage tasks, events, and team availability for your projects</p>
        </header>

        <div className="space-y-4">
          <Button onClick={() => router.push('/')} className="gradient-button w-full sm:w-auto">
            Home
          </Button>

          {/* Project Selection */}
          <Card className="mb-6 border-gray-800 bg-gray-900">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                  <Label className="text-white mb-2 block">Select Project</Label>
                  <Select
                    value={selectedProject || ''}
                    onValueChange={handleProjectChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {showAllProjects ? "Showing All Projects" : projects.find(p => p.id === selectedProject)?.name || "Choose a project"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center justify-between">
                            <span>{project.name}</span>
                            <Badge
                              variant="outline"
                              className={
                                project.status === 'active'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                  : project.status === 'completed'
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                              }
                            >
                              {project.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedProject && (
                  <div className="w-full sm:w-auto">
                    <Button
                      onClick={() => router.push(`/projects/${selectedProject}`)}
                      variant="outline"
                      className="w-full sm:w-auto text-white border-gray-700 hover:bg-gray-800"
                    >
                      View Project Details
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : !selectedProject && showAllProjects ? (
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">All Projects View</h3>
                <p className="text-gray-400 mb-4">You are currently viewing events and tasks across all projects.</p>
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllProjects(false)}
                    className="text-white border-gray-700 hover:bg-gray-800"
                  >
                    Filter by Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column - Calendar and Events */}
              <div className="space-y-4 sm:space-y-6">
                {/* Calendar */}
                <Card className="border-gray-800 bg-gray-900">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                          <CalendarIcon className="w-5 h-5 mr-2" />
                          Project Calendar
                        </CardTitle>
                        <CardDescription>View and manage project events</CardDescription>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                          <Switch
                            id="show-all-projects"
                            checked={showAllProjects}
                            onCheckedChange={setShowAllProjects}
                          />
                          <Label htmlFor="show-all-projects" className="text-sm text-gray-400">
                            Show All Projects
                          </Label>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSendingInvite(true)}
                            className="w-full sm:w-auto text-xs"
                          >
                            <Mail className="w-4 h-4 mr-1" />
                            Send Invite
                          </Button>
                          <Button
                            variant={viewMode === 'day' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('day')}
                            className="w-full sm:w-auto text-xs"
                          >
                            Day
                          </Button>
                          <Button
                            variant={viewMode === 'week' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('week')}
                            className="w-full sm:w-auto text-xs"
                          >
                            Week
                          </Button>
                          <Button
                            variant={viewMode === 'month' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('month')}
                            className="w-full sm:w-auto text-xs"
                          >
                            Month
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="w-full sm:w-auto text-xs"
                          >
                            List
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {viewMode === 'month' && (
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            className="rounded-md border border-gray-800"
                            classNames={{
                              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                              month: "space-y-4",
                              caption: "flex justify-center pt-1 relative items-center",
                              caption_label: "text-sm font-medium",
                              nav: "space-x-1 flex items-center",
                              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                              nav_button_previous: "absolute left-1",
                              nav_button_next: "absolute right-1",
                              table: "w-full border-collapse space-y-1",
                              head_row: "flex",
                              head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
                              row: "flex w-full mt-2",
                              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-gray-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                              day: "h-24 w-24 p-0 font-normal aria-selected:opacity-100",
                              day_selected: "bg-blue-500 text-white hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white",
                              day_today: "bg-gray-800 text-white",
                              day_outside: "text-gray-400 opacity-50",
                              day_disabled: "text-gray-400 opacity-50",
                              day_range_middle: "aria-selected:bg-gray-800 aria-selected:text-white",
                              day_hidden: "invisible",
                            }}
                            components={{
                              DayContent: ({ date }) => {
                                const dayEvents = events.filter(event => {
                                  const eventDate = new Date(event.start_time).toDateString() === date.toDateString()
                                  if (!showAllProjects && selectedProject) {
                                    return eventDate && event.project_id === selectedProject
                                  }
                                  return eventDate
                                })
                                return (
                                  <div className="h-full w-full p-1">
                                    <div className="text-right mb-1">{date.getDate()}</div>
                                    <div className="space-y-1 max-h-16 overflow-y-auto">
                                      {dayEvents.map(event => {
                                        const project = projects.find(p => p.id === event.project_id)
                                        return (
                                          <div
                                            key={event.id}
                                            className="text-xs p-1 rounded truncate"
                                            style={{
                                              backgroundColor: project?.color ? `${project.color}20` : 'rgba(59, 130, 246, 0.2)',
                                              color: project?.color ? project.color : 'rgb(96, 165, 250)',
                                            }}
                                            title={`${event.title} - ${project?.name || 'No Project'}`}
                                          >
                                            {event.title}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )
                              }
                            }}
                          />
                        </div>
                      )}

                      {viewMode === 'week' && (
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: 7 }).map((_, i) => {
                              const date = new Date(selectedDate)
                              date.setDate(date.getDate() - date.getDay() + i)
                              const dayEvents = events.filter(event => {
                                const eventDate = new Date(event.start_time).toDateString() === date.toDateString()
                                if (!showAllProjects && selectedProject) {
                                  return eventDate && event.project_id === selectedProject
                                }
                                return eventDate
                              })
                              return (
                                <div key={i} className="border border-gray-700 rounded-lg p-2">
                                  <div className="text-sm font-medium mb-2">
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                    <br />
                                    {date.getDate()}
                                  </div>
                                  <div className="space-y-1">
                                    {dayEvents.map(event => {
                                      const project = projects.find(p => p.id === event.project_id)
                                      return (
                                        <div
                                          key={event.id}
                                          className="text-xs p-1 rounded truncate"
                                          style={{
                                            backgroundColor: project?.color ? `${project.color}20` : 'rgba(59, 130, 246, 0.2)',
                                            color: project?.color ? project.color : 'rgb(96, 165, 250)',
                                          }}
                                          title={`${event.title} - ${project?.name || 'No Project'}`}
                                        >
                                          {event.title}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {viewMode === 'day' && (
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <div className="text-lg font-medium mb-4">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="space-y-2">
                            {events
                              .filter(event => {
                                const eventDate = new Date(event.start_time).toDateString() === selectedDate.toDateString()
                                if (!showAllProjects && selectedProject) {
                                  return eventDate && event.project_id === selectedProject
                                }
                                return eventDate
                              })
                              .map(event => {
                                const project = projects.find(p => p.id === event.project_id)
                                return (
                                  <div key={event.id} className="p-3 bg-gray-800 rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium">{event.title}</h4>
                                        <p className="text-sm text-gray-400">{event.description}</p>
                                        {project && (
                                          <Badge
                                            variant="outline"
                                            className="mt-2"
                                            style={{
                                              backgroundColor: `${project.color}20`,
                                              color: project.color,
                                              borderColor: `${project.color}50`,
                                            }}
                                          >
                                            {project.name}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-400">
                                        {new Date(event.start_time).toLocaleTimeString()} - {new Date(event.end_time).toLocaleTimeString()}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      {viewMode === 'list' && (
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <div className="space-y-2">
                            {events
                              .filter(event => {
                                if (!showAllProjects && selectedProject) {
                                  return event.project_id === selectedProject
                                }
                                return true
                              })
                              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                              .map(event => {
                                const project = projects.find(p => p.id === event.project_id)
                                return (
                                  <div key={event.id} className="p-3 bg-gray-800 rounded-lg">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-medium">{event.title}</h4>
                                        <p className="text-sm text-gray-400">{event.description}</p>
                                        {project && (
                                          <Badge
                                            variant="outline"
                                            className="mt-2"
                                            style={{
                                              backgroundColor: `${project.color}20`,
                                              color: project.color,
                                              borderColor: `${project.color}50`,
                                            }}
                                          >
                                            {project.name}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-400">
                                        {new Date(event.start_time).toLocaleDateString()} {new Date(event.start_time).toLocaleTimeString()} - {new Date(event.end_time).toLocaleTimeString()}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={() => setIsAddingEvent(true)}
                        className="w-full gradient-button"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Events */}
                <Card className="border-gray-800 bg-gray-900">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      Upcoming Events
                    </CardTitle>
                    <CardDescription>Events scheduled for the next 7 days</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {events
                        .filter(event => {
                          const eventDate = new Date(event.start_time)
                          const today = new Date()
                          const nextWeek = new Date()
                          nextWeek.setDate(today.getDate() + 7)
                          return eventDate >= today && eventDate <= nextWeek
                        })
                        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                        .map(event => (
                          <div key={event.id} className="p-4 bg-gray-800/50 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-white">{event.title}</h4>
                                <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                                <div className="flex items-center mt-2 text-sm text-gray-400">
                                  <CalendarIcon className="w-4 h-4 mr-1" />
                                  {new Date(event.start_time).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                  <span className="mx-2">•</span>
                                  <Clock className="w-4 h-4 mr-1" />
                                  {new Date(event.start_time).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })} - {new Date(event.end_time).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                                {event.attendees?.length || 0} attendees
                              </Badge>
                            </div>
                          </div>
                        ))}
                      {events.filter(event => {
                        const eventDate = new Date(event.start_time)
                        const today = new Date()
                        const nextWeek = new Date()
                        nextWeek.setDate(today.getDate() + 7)
                        return eventDate >= today && eventDate <= nextWeek
                      }).length === 0 && (
                        <div className="text-center py-4 text-gray-400">
                          No upcoming events in the next 7 days
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Tasks and Team */}
              <div className="space-y-4 sm:space-y-6">
                {/* Tasks */}
                <Card className="border-gray-800 bg-gray-900">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="flex items-center text-lg sm:text-xl">
                          <CheckSquare className="w-5 h-5 mr-2" />
                          Project Tasks
                        </CardTitle>
                        <CardDescription>Manage project tasks and assignments</CardDescription>
                      </div>
                      <Button onClick={() => setIsAddingTask(true)} className="w-full sm:w-auto gradient-button">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {tasks.map(task => (
                        <div key={task.id} className="p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-white">{task.title}</h4>
                              <p className="text-sm text-gray-400">{task.description}</p>
                              <div className="flex items-center mt-2 space-x-4">
                                <span className="text-sm text-gray-400">
                                  <CalendarIconSolid className="w-4 h-4 inline mr-1" />
                                  Due: {new Date(task.due_date).toLocaleDateString()}
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
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                task.status === 'completed'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                  : task.status === 'in_progress'
                                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                                  : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                              }
                            >
                              {task.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Team Availability */}
                <Card className="border-gray-800 bg-gray-900">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <Users className="w-5 h-5 mr-2" />
                      Team Availability
                    </CardTitle>
                    <CardDescription>Today's team member status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {teamAvailability
                        .filter(member => teamMembers.some(tm => tm.user_id === member.user_id))
                        .map(member => (
                          <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center">
                              <User className="w-8 h-8 text-gray-400 mr-3" />
                              <div>
                                <p className="font-medium text-white">{member.user_name}</p>
                                <p className="text-sm text-gray-400">
                                  {member.available_hours.join(', ')}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                member.status === 'available'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                  : member.status === 'busy'
                                  ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                  : 'bg-red-500/20 text-red-400 border-red-500/50'
                              }
                            >
                              {member.status}
                            </Badge>
                          </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

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
                          {member.users.name}
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

          {/* Add Event Dialog */}
          <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>Schedule a new event</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Enter event title"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Enter event description"
                  />
                </div>
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.start_time}
                    onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.end_time}
                    onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Attendees</Label>
                  <Select
                    value={newEvent.attendees[0]}
                    onValueChange={(value) => setNewEvent({ ...newEvent, attendees: [...newEvent.attendees, value] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team members" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(member => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.users.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newEvent.attendees.map((attendeeId) => {
                      const member = teamMembers.find(m => m.user_id === attendeeId)
                      return (
                        <Badge
                          key={attendeeId}
                          variant="outline"
                          className="bg-blue-500/20 text-blue-400 border-blue-500/50"
                        >
                          {member?.users.name}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-1 h-4 w-4"
                            onClick={() => setNewEvent({
                              ...newEvent,
                              attendees: newEvent.attendees.filter(id => id !== attendeeId)
                            })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <Button variant="outline" onClick={() => setIsAddingEvent(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEvent} className="gradient-button">
                  Add Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Send Invite Dialog */}
          <Dialog open={isSendingInvite} onOpenChange={setIsSendingInvite}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Schedule Invite</DialogTitle>
                <DialogDescription>
                  Invite team members to view and manage the project schedule
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Message (Optional)</Label>
                  <Input
                    placeholder="Add a personal message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="can-edit" />
                  <Label htmlFor="can-edit" className="text-sm text-gray-400">
                    Allow editing schedule
                  </Label>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <Button variant="outline" onClick={() => setIsSendingInvite(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      // Here you would typically send the invite via email
                      // For now, we'll just show a success message
                      toast.success('Invite sent successfully')
                      setIsSendingInvite(false)
                      setInviteEmail('')
                      setInviteMessage('')
                    } catch (error) {
                      console.error('Error sending invite:', error)
                      toast.error('Failed to send invite')
                    }
                  }}
                  className="gradient-button"
                >
                  Send Invite
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Task List */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Tasks</h2>
            <div className="grid gap-4">
              {tasks.map(task => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="secondary">{task.priority}</Badge>
                          <Badge variant={task.status === 'completed' ? 'default' : 'outline'}>
                            {task.status}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTask(task)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTaskToDelete(task)
                            setIsDeletingTask(true)
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Edit Task Dialog */}
          <Dialog open={isEditingTask} onOpenChange={setIsEditingTask}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editingTask?.title || ''}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingTask?.description || ''}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Project</Label>
                  <Select
                    value={editingTask?.project_id || ''}
                    onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, project_id: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={editingTask?.due_date ? new Date(editingTask.due_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditingTask(prev => prev ? { ...prev, due_date: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingTask?.status || 'pending'}
                    onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, status: value as Task['status'] } : null)}
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
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={editingTask?.priority || 'medium'}
                    onValueChange={(value) => setEditingTask(prev => prev ? { ...prev, priority: value as Task['priority'] } : null)}
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
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditingTask(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateTask}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Task Dialog */}
          <Dialog open={isDeletingTask} onOpenChange={setIsDeletingTask}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Task</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this task? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeletingTask(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteTask}>
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Team Members Section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Team Members</h2>
            <div className="grid gap-4">
              {teamMembers.map(member => (
                <Card key={member.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{member.users.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.users.email}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="secondary">{member.role}</Badge>
                          <Badge variant={member.status === 'active' ? 'default' : 'outline'}>
                            {member.status}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Joined: {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Add functionality to view member's tasks/events
                            toast.info('Viewing member details coming soon')
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
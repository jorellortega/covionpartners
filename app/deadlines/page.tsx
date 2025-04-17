"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Calendar,
  Briefcase,
  Bell,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  CheckSquare
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { useUpdates } from "@/hooks/useUpdates"
import { supabase } from "@/lib/supabase"
import { Project, Update } from "@/types"

interface DeadlineItem {
  id: string
  title: string
  type: 'project' | 'update' | 'message' | 'task'
  date: string
  status: 'upcoming' | 'past' | 'future'
  link: string
}

export default function DeadlinesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { projects: myProjects, loading: loadingProjects } = useProjects(user?.id || '')
  const { updates, loading: loadingUpdates } = useUpdates()
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [tasks, setTasks] = useState<any[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMessages()
      fetchTasks()
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true)
      // Step 1: Fetch messages without joins
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })

      if (messagesError) throw messagesError

      // Collect unique user IDs
      const userIds = new Set<string>()
      messagesData?.forEach(message => {
        userIds.add(message.sender_id)
        userIds.add(message.receiver_id)
      })

      // Step 2: Fetch user details
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', Array.from(userIds))

      if (usersError) throw usersError

      // Create a map of user details
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || [])

      // Combine messages with user details
      const messagesWithUsers = messagesData?.map(message => ({
        ...message,
        sender: usersMap.get(message.sender_id) || null,
        receiver: usersMap.get(message.receiver_id) || null
      })) || []

      setMessages(messagesWithUsers)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true)
      // Step 1: Fetch tasks without joins
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (tasksError) throw tasksError

      // Collect unique user IDs
      const userIds = new Set<string>()
      tasksData?.forEach(task => {
        if (task.assigned_to) userIds.add(task.assigned_to)
      })

      // Step 2: Fetch user details
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', Array.from(userIds))

      if (usersError) throw usersError

      // Create a map of user details
      const usersMap = new Map(usersData?.map(user => [user.id, user]) || [])

      // Combine tasks with user details
      const tasksWithUsers = tasksData?.map(task => ({
        ...task,
        assigned_user: task.assigned_to ? usersMap.get(task.assigned_to) || null : null
      })) || []

      setTasks(tasksWithUsers)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    if (!loadingProjects && !loadingUpdates && !loadingMessages && !loadingTasks) {
      const now = new Date()
      const allDeadlines: DeadlineItem[] = []

      // Add project deadlines
      myProjects.forEach(project => {
        if (project.deadline) {
          const deadlineDate = new Date(project.deadline)
          allDeadlines.push({
            id: project.id,
            title: project.name,
            type: 'project',
            date: project.deadline,
            status: deadlineDate < now ? 'past' : 'upcoming',
            link: `/projects/${project.id}`
          })
        }
      })

      // Add update deadlines
      updates.forEach(update => {
        if (update.date) {
          const deadlineDate = new Date(update.date)
          allDeadlines.push({
            id: update.id,
            title: update.title,
            type: 'update',
            date: update.date,
            status: deadlineDate < now ? 'past' : 'upcoming',
            link: `/updates/${update.id}`
          })
        }
      })

      // Add message deadlines
      messages.forEach(message => {
        if (message.due_date) {
          const deadlineDate = new Date(message.due_date)
          allDeadlines.push({
            id: message.id,
            title: message.subject,
            type: 'message',
            date: message.due_date,
            status: deadlineDate < now ? 'past' : 'upcoming',
            link: `/messages/${message.id}`
          })
        }
      })

      // Add task deadlines
      tasks.forEach(task => {
        if (task.due_date) {
          const deadlineDate = new Date(task.due_date)
          allDeadlines.push({
            id: task.id,
            title: task.title,
            type: 'task',
            date: task.due_date,
            status: deadlineDate < now ? 'past' : 'upcoming',
            link: `/tasks/${task.id}`
          })
        }
      })

      // Sort all deadlines by date
      allDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setDeadlines(allDeadlines)
      setLoading(false)
    }
  }, [loadingProjects, loadingUpdates, loadingMessages, loadingTasks, myProjects, updates, messages, tasks])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Upcoming</Badge>
      case 'past':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">Past Due</Badge>
      default:
        return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Briefcase className="w-4 h-4 text-blue-400" />
      case 'update':
        return <Bell className="w-4 h-4 text-purple-400" />
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-400" />
      case 'task':
        return <CheckSquare className="w-4 h-4 text-yellow-400" />
      default:
        return null
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project':
        return 'bg-blue-500/20'
      case 'update':
        return 'bg-purple-500/20'
      case 'message':
        return 'bg-green-500/20'
      case 'task':
        return 'bg-yellow-500/20'
      default:
        return 'bg-gray-500/20'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'project':
        return 'Project Deadline'
      case 'update':
        return 'Update Due'
      case 'message':
        return 'Message Response Due'
      case 'task':
        return 'Task Due'
      default:
        return 'Deadline'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-lg text-gray-400">Loading deadlines...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl sm:text-3xl font-bold">Deadlines</h1>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-gray-800/50"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Past
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              All
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <Card className="leonardo-card border-gray-800">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {deadlines
                    .filter(d => d.status === 'upcoming')
                    .map(deadline => (
                      <div 
                        key={deadline.id}
                        className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => router.push(deadline.link)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${getTypeColor(deadline.type)} flex items-center justify-center`}>
                              {getTypeIcon(deadline.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{deadline.title}</p>
                              <p className="text-xs text-gray-400">{getTypeText(deadline.type)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">
                              {new Date(deadline.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {Math.ceil((new Date(deadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {deadlines.filter(d => d.status === 'upcoming').length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      No upcoming deadlines
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card className="leonardo-card border-gray-800">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {deadlines
                    .filter(d => d.status === 'past')
                    .map(deadline => (
                      <div 
                        key={deadline.id}
                        className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
                        onClick={() => router.push(deadline.link)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${getTypeColor(deadline.type)} flex items-center justify-center`}>
                              {getTypeIcon(deadline.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{deadline.title}</p>
                              <p className="text-xs text-gray-400">{getTypeText(deadline.type)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white">
                              {new Date(deadline.date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-400">
                              {Math.abs(Math.ceil((new Date(deadline.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days ago
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {deadlines.filter(d => d.status === 'past').length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      No past deadlines
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all">
            <Card className="leonardo-card border-gray-800">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {deadlines.map(deadline => (
                    <div 
                      key={deadline.id}
                      className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => router.push(deadline.link)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${getTypeColor(deadline.type)} flex items-center justify-center`}>
                            {getTypeIcon(deadline.type)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{deadline.title}</p>
                            <p className="text-xs text-gray-400">{getTypeText(deadline.type)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">
                            {new Date(deadline.date).toLocaleDateString()}
                          </p>
                          {getStatusBadge(deadline.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {deadlines.length === 0 && (
                    <div className="text-center py-4 text-gray-400">
                      No deadlines found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 
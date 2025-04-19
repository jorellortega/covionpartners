"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Timer, FileText, Link as LinkIcon, StickyNote } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"

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

export default function TaskDetailPage() {
  const params = useParams()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchTask = async () => {
      if (!user) {
        console.log("No user found - not authenticated")
        toast({
          title: 'Authentication Error',
          description: 'Please sign in to view task details',
          variant: 'destructive'
        })
        return
      }

      try {
        setLoading(true)
        console.log("Fetching task with ID:", params.id)
        console.log("User ID:", user.id)
        
        // Get auth status
        const { data: { session } } = await supabase.auth.getSession()
        console.log("Session:", session ? "Active" : "None")
        
        const { data, error } = await supabase
          .from('tasks')
          .select(`
            *,
            project:projects (
              id,
              name
            )
          `)
          .eq('id', params.id)
          .single()

        console.log("Query response:", { data, error })

        if (error) throw error
        setTask(data)
      } catch (error) {
        console.error('Error fetching task:', error)
        toast({
          title: 'Error',
          description: 'Failed to load task details. ' + (error as Error).message,
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchTask()
    }
  }, [params.id, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Task not found</h1>
          <Link href="/workflow">
            <Button className="bg-purple-600 hover:bg-purple-700">
              Back to Workflow
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/workflow">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              ← Back to Workflow
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge className={`${
              task.status === 'completed' 
                ? 'bg-green-500/20 text-green-400'
                : task.status === 'in_progress'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </Badge>
            <Badge className={`${
              task.priority === 'high'
                ? 'bg-red-500/20 text-red-400'
                : task.priority === 'medium'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </Badge>
          </div>
        </div>

        <Card className="bg-black border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">{task.title}</CardTitle>
            {task.project && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-400">Project:</span>
                <Badge className="bg-purple-500/20 text-purple-400">
                  {task.project.name}
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(task.due_date).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Timer className="w-4 h-4 mr-2" />
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </div>
            </div>

            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300">{task.description}</p>
            </div>

            {task.attachments && task.attachments.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Attachments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {task.attachments.map((attachment, index) => (
                    <Card key={index} className="bg-gray-900/50 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          {attachment.type === 'file' ? (
                            <FileText className="w-4 h-4 text-blue-400" />
                          ) : (
                            <LinkIcon className="w-4 h-4 text-purple-400" />
                          )}
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            {attachment.name}
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {task.notes && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-yellow-400" />
                  Notes
                </h3>
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="p-4">
                    <p className="text-gray-300 whitespace-pre-wrap">{task.notes}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
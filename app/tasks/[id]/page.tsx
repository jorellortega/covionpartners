'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, CheckCircle, RefreshCw, User, FileText, Target, DollarSign, Users, Building2, Pencil, Settings, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Task } from '@/types'
import { use } from 'react'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export default function TaskDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editTaskData, setEditTaskData] = useState({
    title: '',
    description: '',
    due_date: '',
    status: '',
    assigned_to: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchTask = async () => {
      try {
        console.log('Fetching task with ID:', resolvedParams.id)
        
        // First fetch the task
        const { data: taskData, error: taskError } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', resolvedParams.id)
          .single()

        if (taskError) {
          console.error('Task fetch error:', taskError)
          throw new Error(`Failed to fetch task: ${taskError.message}`)
        }

        if (!taskData) {
          console.error('No task found with ID:', resolvedParams.id)
          throw new Error('Task not found')
        }

        console.log('Found task:', taskData)

        // Then fetch the assigned user if there is one
        let assignedUser = null
        if (taskData.assigned_to) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('id', taskData.assigned_to)
            .single()

          if (userError) {
            console.error('User fetch error:', userError)
            // Don't throw here, just log the error and continue
          } else {
            assignedUser = userData
          }
        }

        setTask({
          ...taskData,
          assigned_user: assignedUser
        })
        setEditTaskData({
          title: taskData.title,
          description: taskData.description,
          due_date: taskData.due_date,
          status: taskData.status,
          assigned_to: taskData.assigned_to
        })
      } catch (error) {
        console.error('Error in fetchTask:', error)
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load task details',
          variant: 'destructive'
        })
        setTask(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [resolvedParams.id, supabase, toast])

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: editTaskData.title,
          description: editTaskData.description,
          due_date: editTaskData.due_date,
          status: editTaskData.status,
          assigned_to: editTaskData.assigned_to
        })
        .eq('id', resolvedParams.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      })

      // Refresh the task data
      const { data: updatedTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', resolvedParams.id)
        .single()

      if (fetchError) throw fetchError

      if (updatedTask.assigned_to) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', updatedTask.assigned_to)
          .single()

        setTask({
          ...updatedTask,
          assigned_user: userData
        })
      } else {
        setTask(updatedTask)
      }

      setIsEditing(false)
    } catch (error) {
      console.error('Error updating task:', error)
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', resolvedParams.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      })

      router.push('/tasks')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Task not found</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4">
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-purple-400 w-fit"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tasks
            </Button>
            
            <div className="flex flex-col space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{task.title}</h1>
                <p className="text-gray-400 text-sm sm:text-base mt-1">{task.description || 'No description available'}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 w-fit">
                  <Clock className="w-4 h-4 mr-2" />
                  {task.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50 w-fit">
                  <Calendar className="w-4 h-4 mr-2" />
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Task Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Description */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Task Description</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed overview of the task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    {task.description || 'No description available.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Task Overview */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Task Overview
                </CardTitle>
                <CardDescription>Key information about the task</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Created</span>
                      </div>
                      <div className="text-white font-medium">
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Due Date</span>
                      </div>
                      <div className="text-white font-medium">
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <User className="w-4 h-4 mr-2" />
                      <span>Assigned To</span>
                    </div>
                    <div className="text-white font-medium">
                      {task.assigned_user?.name || 'Unassigned'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Actions */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Actions
                </CardTitle>
                <CardDescription>Manage task settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    className="w-full gradient-button"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Task
                  </Button>
                  <Button
                    className="w-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50"
                    onClick={() => setIsDeleting(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Task
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Task Status */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
                <CardDescription>Current status and progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Status</span>
                    </div>
                    <div className="text-white font-medium">
                      {task.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Edit Task Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input
                value={editTaskData.title}
                onChange={(e) => setEditTaskData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editTaskData.description}
                onChange={(e) => setEditTaskData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Task description"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editTaskData.due_date}
                onChange={(e) => setEditTaskData(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={editTaskData.status}
                onChange={(e) => setEditTaskData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-white"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
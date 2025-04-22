"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Timer, FileText, Link as LinkIcon, StickyNote, Upload, Download, Plus, X, Edit2, Save, Paperclip } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

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
  assigned_user?: {
    id: string
    name: string
    email: string
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
  const taskId = params?.id as string
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [editedNotes, setEditedNotes] = useState("")
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkName, setLinkName] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)

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
        console.log("Fetching task with ID:", taskId)
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
          .eq('id', taskId)
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

    if (taskId) {
      fetchTask()
    }
  }, [taskId, user])

  const handleNotesUpdate = async () => {
    if (!task) return

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ notes: editedNotes })
        .eq('id', task.id)

      if (error) throw error

      setTask(prev => prev ? { ...prev, notes: editedNotes } : null)
      setIsEditingNotes(false)
      toast({
        title: "Success",
        description: "Notes updated successfully"
      })
    } catch (error) {
      console.error('Error updating notes:', error)
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!task) return

    try {
      setUploadingFile(true)
      const fileName = `${task.id}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: urlData } = await supabase.storage
        .from('task-attachments')
        .getPublicUrl(fileName)

      const publicUrl = urlData.publicUrl

      const newAttachment = {
        type: 'file' as const,
        url: publicUrl,
        name: file.name
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          attachments: [...(task.attachments || []), newAttachment]
        })
        .eq('id', task.id)

      if (updateError) throw updateError

      setTask(prev => prev ? {
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment]
      } : null)

      toast({
        title: "Success",
        description: "File uploaded successfully"
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleLinkAdd = async () => {
    if (!task) return

    try {
      const newAttachment = {
        type: 'link' as const,
        url: linkUrl,
        name: linkName || linkUrl
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          attachments: [...(task.attachments || []), newAttachment]
        })
        .eq('id', task.id)

      if (error) throw error

      setTask(prev => prev ? {
        ...prev,
        attachments: [...(prev.attachments || []), newAttachment]
      } : null)

      setLinkDialogOpen(false)
      setLinkName("")
      setLinkUrl("")
      toast({
        title: "Success",
        description: "Link added successfully"
      })
    } catch (error) {
      console.error('Error adding link:', error)
      toast({
        title: "Error",
        description: "Failed to add link",
        variant: "destructive"
      })
    }
  }

  const handleAttachmentDelete = async (index: number) => {
    if (!task || !task.attachments) return

    try {
      const newAttachments = task.attachments.filter((_, i) => i !== index)

      const { error } = await supabase
        .from('tasks')
        .update({
          attachments: newAttachments
        })
        .eq('id', task.id)

      if (error) throw error

      setTask(prev => prev ? {
        ...prev,
        attachments: newAttachments
      } : null)

      toast({
        title: "Success",
        description: "Attachment removed successfully"
      })
    } catch (error) {
      console.error('Error removing attachment:', error)
      toast({
        title: "Error",
        description: "Failed to remove attachment",
        variant: "destructive"
      })
    }
  }

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
            {task.assigned_user && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-400">Assigned to:</span>
                <Badge className="bg-blue-500/20 text-blue-400">
                  {task.assigned_user.name}
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

        <div className="space-y-8 mt-8">
          {/* Notes Section */}
          <Card className="bg-black border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-yellow-400" />
                  Notes
                </CardTitle>
                {!isEditingNotes ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingNotes(true)
                      setEditedNotes(task?.notes || "")
                    }}
                    className="border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Notes
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingNotes(false)}
                      className="border-gray-700 text-gray-400 hover:bg-gray-800"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleNotesUpdate}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Notes
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <Textarea
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                  placeholder="Add your notes here..."
                  className="min-h-[200px] bg-gray-900/50 border-gray-800"
                />
              ) : (
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {task?.notes || "No notes added yet."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments Section */}
          <Card className="bg-black border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-blue-400" />
                  Attachments
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinkDialogOpen(true)}
                    className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) handleFileUpload(file)
                      }
                      input.click()
                    }}
                    disabled={uploadingFile}
                    className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task?.attachments && task.attachments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {task.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3">
                          {attachment.type === 'file' ? (
                            <FileText className="w-5 h-5 text-blue-400" />
                          ) : (
                            <LinkIcon className="w-5 h-5 text-purple-400" />
                          )}
                          <span className="text-gray-300">{attachment.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-blue-500/10"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAttachmentDelete(index)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No attachments yet. Upload a file or add a link to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Link Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-black border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Add Link</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-400">
                  Link Name
                </label>
                <Input
                  id="name"
                  value={linkName}
                  onChange={(e) => setLinkName(e.target.value)}
                  className="bg-gray-900/50 border-gray-800"
                  placeholder="Enter link name"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="url" className="text-sm font-medium text-gray-400">
                  URL
                </label>
                <Input
                  id="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="bg-gray-900/50 border-gray-800"
                  placeholder="Enter URL"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setLinkDialogOpen(false)
                  setLinkName("")
                  setLinkUrl("")
                }}
                className="hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLinkAdd}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={!linkUrl}
              >
                Add Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 
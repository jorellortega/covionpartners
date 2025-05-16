"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { formatDistanceToNow } from "date-fns"

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
}

export default function TaskDetailPage() {
  const params = useParams()
  const taskId = params?.id as string
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkName, setLinkName] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)
  const [notes, setNotes] = useState<any[]>([])
  const [newNote, setNewNote] = useState("")
  const [loadingNotes, setLoadingNotes] = useState(true)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<any[]>([])
  const router = useRouter()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState("")

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

  useEffect(() => {
    const fetchNotes = async () => {
      setLoadingNotes(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        // Fetch user info for each note
        const notesWithUser = await Promise.all(
          data.map(async (note) => {
            if (!note.created_by) return { ...note, user: { name: 'Unknown' } };
            const { data: userData } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', note.created_by)
              .single();
            return {
              ...note,
              user: userData || { name: note.created_by }
            };
          })
        );
        setNotes(notesWithUser);
      }
      setLoadingNotes(false);
    };
    if (taskId) fetchNotes();
  }, [taskId]);

  useEffect(() => {
    const fetchAttachments = async () => {
      if (!taskId) return;
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .order('created_at', { ascending: false });
      if (!error) setAttachments(data || []);
    };
    fetchAttachments();
  }, [taskId]);

  const handleFileUpload = async (file: File) => {
    if (!task || !user) return;
    try {
      setUploadingFile(true);
      const filePath = `attachments/task-${task.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('partnerfiles')
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = await supabase.storage
        .from('partnerfiles')
        .getPublicUrl(filePath);
      const publicUrl = urlData.publicUrl;
      const { error: insertError } = await supabase
        .from('attachments')
        .insert({
          entity_type: 'task',
          entity_id: task.id,
          type: 'file',
          name: file.name,
        url: publicUrl,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          created_by: user.id
        });
      if (insertError) throw insertError;
      // Refetch attachments
      const { data } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'task')
        .eq('entity_id', task.id)
        .order('created_at', { ascending: false });
      setAttachments(data || []);
      toast({ title: 'Success', description: 'File uploaded successfully' });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleLinkAdd = async () => {
    if (!task || !user) return;
    try {
      let normalizedUrl = linkUrl.trim();
      if (!/^https?:\/\//i.test(normalizedUrl)) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      const { error } = await supabase
        .from('attachments')
        .insert({
          entity_type: 'task',
          entity_id: task.id,
          type: 'link',
          name: linkName || normalizedUrl,
          url: normalizedUrl,
          created_by: user.id
        });
      if (error) throw error;
      // Refetch attachments
      const { data } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'task')
        .eq('entity_id', task.id)
        .order('created_at', { ascending: false });
      setAttachments(data || []);
      setLinkDialogOpen(false);
      setLinkName("");
      setLinkUrl("");
      toast({ title: 'Success', description: 'Link added successfully' });
    } catch (error) {
      console.error('Error adding link:', error);
      toast({ title: 'Error', description: 'Failed to add link', variant: 'destructive' });
    }
  };

  const handleAttachmentDelete = async (attachment: any) => {
    if (!task) return;
    try {
      // If it's a file, remove from storage as well
      if (attachment.type === 'file' && attachment.file_path) {
        await supabase.storage.from('partnerfiles').remove([attachment.file_path]);
      }
      // Remove from attachments table
      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);
      if (error) throw error;
      // Refetch attachments
      const { data } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', 'task')
        .eq('entity_id', task.id)
        .order('created_at', { ascending: false });
      setAttachments(data || []);
      toast({ title: 'Attachment removed successfully' });
    } catch (error) {
      console.error('Error removing attachment:', error);
      toast({ title: 'Error', description: 'Failed to remove attachment', variant: 'destructive' });
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;
    const { error } = await supabase.from('notes').insert({
      entity_type: 'task',
      entity_id: taskId,
      content: newNote,
      created_by: user.id
    });
    if (!error) {
      setNewNote("");
      // Refetch notes
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .order('created_at', { ascending: false });
      setNotes(data || []);
      toast({ title: "Note added" });
    } else {
      toast({ title: "Error", description: "Failed to add note", variant: "destructive" });
    }
  }

  const handleEditNote = (noteId: string, content: string) => {
    setEditingNoteId(noteId);
    setEditingContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editingNoteId || !editingContent.trim()) return;
    const { error } = await supabase
      .from('notes')
      .update({ content: editingContent })
      .eq('id', editingNoteId);
    if (!error) {
      setEditingNoteId(null);
      setEditingContent("");
      // Refetch notes
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .order('created_at', { ascending: false });
      setNotes(data || []);
      toast({ title: "Note updated" });
    } else {
      toast({ title: "Error", description: "Failed to update note", variant: "destructive" });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);
    if (!error) {
      setDeletingNoteId(null);
      // Refetch notes
      const { data } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .order('created_at', { ascending: false });
      setNotes(data || []);
      toast({ title: "Note deleted" });
    } else {
      toast({ title: "Error", description: "Failed to delete note", variant: "destructive" });
    }
  };

  const handleTitleEdit = () => {
    setTitleInput(task?.title || "")
    setEditingTitle(true)
  }

  const handleTitleSave = async () => {
    if (!task || !titleInput.trim()) return
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title: titleInput.trim() })
        .eq('id', task.id)
      if (error) throw error
      setTask(prev => prev ? { ...prev, title: titleInput.trim() } : prev)
      setEditingTitle(false)
      toast({ title: 'Title updated' })
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update title', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div style={{ background: '#141414', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    )
  }

  if (!task) {
    return (
      <div style={{ background: '#141414', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
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
    <div style={{ background: '#141414', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            className="text-gray-400 hover:text-white"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
              } else {
                router.push('/workflow');
              }
            }}
          >
            ← Back
          </Button>
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
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-2">
              {editingTitle ? (
                <>
                  <input
                    className="bg-gray-900 text-white rounded px-2 py-1 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={titleInput}
                    onChange={e => setTitleInput(e.target.value)}
                    autoFocus
                  />
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleTitleSave}><Save className="w-4 h-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingTitle(false)}><X className="w-4 h-4" /></Button>
                </>
              ) : (
                <>
                  {task.title}
                  <Button size="icon" variant="ghost" className="ml-2 text-gray-400 hover:text-purple-400" onClick={handleTitleEdit}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </CardTitle>
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
          </CardContent>
        </Card>

        <div className="space-y-8 mt-8">
          {/* Notes Section (collaborative) */}
          <Card className="bg-black border-gray-800">
            <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <StickyNote className="w-5 h-5 text-yellow-400" />
                  Notes
                </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingNotes ? (
                <div className="text-gray-400">Loading notes...</div>
              ) : (
                <div className="space-y-4">
                  {notes.length === 0 && <div className="text-gray-400">No notes yet.</div>}
                  {notes.map(note => (
                    <div key={note.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">
                          {note.user?.name || note.user?.email || "Unknown"} • {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                        </span>
                        {user && note.created_by === user.id && (
                          <div className="flex gap-2">
                            {editingNoteId === note.id ? (
                              <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={handleSaveEdit}>Save</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingNoteId(null)}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleEditNote(note.id, note.content)}>Edit</Button>
                                <Button size="sm" variant="outline" className="hover:bg-red-600 hover:text-white" onClick={() => setDeletingNoteId(note.id)}>Delete</Button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {editingNoteId === note.id ? (
                        <Textarea
                          value={editingContent}
                          onChange={e => setEditingContent(e.target.value)}
                          className="min-h-[60px] bg-gray-900/50 border-gray-800"
                />
              ) : (
                        <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                      )}
                      {/* Delete confirmation */}
                      {deletingNoteId === note.id && (
                        <div className="mt-2 flex gap-2">
                          <span className="text-red-400">Are you sure?</span>
                          <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleDeleteNote(note.id)}>Yes, Delete</Button>
                          <Button size="sm" variant="outline" onClick={() => setDeletingNoteId(null)}>Cancel</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="min-h-[100px] bg-gray-900/50 border-gray-800"
                />
                <Button
                  className="mt-2 bg-yellow-600 hover:bg-yellow-700"
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || !user}
                >
                  Add Note
                </Button>
              </div>
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
                      input.accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
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
                {attachments.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3">
                          {attachment.type === 'file' && attachment.url && attachment.file_type?.startsWith('image/') ? (
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-16 h-16 object-cover rounded border border-gray-700"
                                style={{ maxWidth: 64, maxHeight: 64 }}
                              />
                            </a>
                          ) : attachment.type === 'file' && attachment.url && attachment.file_type?.startsWith('audio/') ? (
                            <audio controls className="w-32">
                              <source src={attachment.url} type={attachment.file_type} />
                              Your browser does not support the audio element.
                            </audio>
                          ) : attachment.type === 'file' ? (
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
                            onClick={() => handleAttachmentDelete(attachment)}
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
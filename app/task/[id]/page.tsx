"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Timer, FileText, Link as LinkIcon, StickyNote, Upload, Download, Plus, X, Edit2, Save, Paperclip, Target, Flag, CheckCircle, AlertCircle, Clipboard, Eye, Users, Package, MoreHorizontal, Search } from "lucide-react"
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
import { getLinkedEntities, createEntityLink, deleteEntityLink } from "@/lib/entity-links"

interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  due_date: string
  project_id: string
  assigned_to: string | null
  assigned_users?: string[]
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
  assigned_users_details?: {
    id: string
    name: string
    email: string
  }[]
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
  const [newNoteTitle, setNewNoteTitle] = useState("")
  const [timelineItems, setTimelineItems] = useState<any[]>([])
  const [linkedTimelineItems, setLinkedTimelineItems] = useState<any[]>([])
  const [linkTimelineModalOpen, setLinkTimelineModalOpen] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

        if (data) {
          // Fetch assigned user details if there's a single assignee
          if (data.assigned_to) {
            const { data: assignedUser } = await supabase
              .from('users')
              .select('id, name, email')
              .eq('id', data.assigned_to)
              .single()
            
            if (assignedUser) {
              data.assigned_user = assignedUser
            }
          }

          // Fetch assigned users details if there are multiple assignees
          if (data.assigned_users && data.assigned_users.length > 0) {
            const { data: assignedUsers } = await supabase
              .from('users')
              .select('id, name, email')
              .in('id', data.assigned_users)
            
            if (assignedUsers) {
              data.assigned_users_details = assignedUsers
            }
          }
        }

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

  // Fetch timeline items and linked timeline items
  useEffect(() => {
    const fetchTimelineData = async () => {
      if (!task?.project_id) return;
      
      setLoadingTimeline(true);
      try {
        // Fetch all timeline items for the project
        const { data: allTimelineItems, error: timelineError } = await supabase
          .from('project_timeline')
          .select('*')
          .eq('project_id', task.project_id)
          .order('order_index', { ascending: true });
        
        if (!timelineError) {
          setTimelineItems(allTimelineItems || []);
          console.log('Available timeline items:', allTimelineItems?.map(item => ({ id: item.id, title: item.title, type: item.type })));
        } else {
          console.error('Error fetching timeline items:', timelineError);
        }

        // Fetch linked entities using the new entity_links table
        const { data: linkedEntities, error: linkedError } = await getLinkedEntities('task', taskId);
        
        console.log('Task page - linked entities query:', { 
          taskId, 
          projectId: task.project_id, 
          linkedEntities, 
          error: linkedError 
        });
        
        // Filter for timeline items only
        const linkedTimelineItems = linkedEntities.filter(entity => entity.type !== 'task');
        setLinkedTimelineItems(linkedTimelineItems);
        console.log('Updated linkedTimelineItems state:', linkedTimelineItems);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
      } finally {
        setLoadingTimeline(false);
      }
    };

    fetchTimelineData();
  }, [task?.project_id, taskId, task?.id]);

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
    if (!newNote.trim() || !user || !task) return;
    const { error } = await supabase.from('notes').insert({
      entity_type: 'task',
      entity_id: taskId,
      content: newNote,
      created_by: user.id,
      entity_title: task.title,
      note_title: newNoteTitle
    });
    if (!error) {
      setNewNote("");
      setNewNoteTitle("");
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
    if (!task || !titleInput.trim()) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title: titleInput.trim() })
        .eq('id', task.id);
      if (error) throw error;
      setTask({ ...task, title: titleInput.trim() });
      setEditingTitle(false);
      setTitleInput("");
      toast({ title: 'Success', description: 'Task title updated successfully' });
    } catch (error) {
      console.error('Error updating task title:', error);
      toast({ title: 'Error', description: 'Failed to update task title', variant: 'destructive' });
    }
  };

  // Function to link task to timeline item
  const linkTaskToTimeline = async (timelineId: string) => {
    if (!task) return;
    try {
      console.log('Linking task to timeline:', { taskId: task.id, timelineId });
      
      const { error } = await createEntityLink('task', task.id, 'timeline', timelineId, 'association', task.project_id);

      if (error) {
        console.error('Error linking task to timeline:', error);
        toast({ title: 'Error', description: 'Failed to link task to timeline', variant: 'destructive' });
        return;
      }

      console.log('Successfully linked task to timeline');
      toast({ title: 'Success', description: 'Task linked to timeline successfully' });
      setLinkTimelineModalOpen(false);
      
      // Refresh linked timeline items
      const { data: linkedEntities, error: linkedError } = await getLinkedEntities('task', task.id);
      
      console.log('Refreshed linked entities:', linkedEntities);
      if (!linkedError) {
        const linkedTimelineItems = linkedEntities.filter(entity => entity.type !== 'task');
        setLinkedTimelineItems(linkedTimelineItems);
      }
    } catch (error) {
      console.error('Error linking task:', error);
      toast({ title: 'Error', description: 'Failed to link task to timeline', variant: 'destructive' });
    }
  };

  // Function to unlink task from timeline item
  const unlinkTaskFromTimeline = async (timelineId: string) => {
    if (!task) return;
    try {
      const { error } = await deleteEntityLink('task', task.id, 'timeline', timelineId);

      if (error) {
        console.error('Error unlinking task from timeline:', error);
        toast({ title: 'Error', description: 'Failed to unlink task from timeline', variant: 'destructive' });
        return;
      }

      toast({ title: 'Success', description: 'Task unlinked from timeline successfully' });
      
      // Refresh linked timeline items
      const { data: linkedEntities, error: linkedError } = await getLinkedEntities('task', task.id);
      
      if (!linkedError) {
        const linkedTimelineItems = linkedEntities.filter(entity => entity.type !== 'task');
        setLinkedTimelineItems(linkedTimelineItems);
      }
    } catch (error) {
      console.error('Error unlinking task:', error);
      toast({ title: 'Error', description: 'Failed to unlink task from timeline', variant: 'destructive' });
    }
  };

  // Function to delete task
  const handleDeleteTask = async () => {
    if (!task || !user) return;
    
    setDeleting(true);
    try {
      // Delete all attachments first
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          if (attachment.type === 'file' && attachment.file_path) {
            await supabase.storage.from('partnerfiles').remove([attachment.file_path]);
          }
        }
      }

      // Delete all notes associated with this task
      await supabase
        .from('notes')
        .delete()
        .eq('entity_type', 'task')
        .eq('entity_id', task.id);

      // Delete all attachments associated with this task
      await supabase
        .from('attachments')
        .delete()
        .eq('entity_type', 'task')
        .eq('entity_id', task.id);

      // Delete all entity links associated with this task
      await supabase
        .from('entity_links')
        .delete()
        .or(`source_entity_id.eq.${task.id},target_entity_id.eq.${task.id}`);

      // Finally, delete the task itself
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Task deleted successfully' });
      
      // Navigate back to workflow
      router.push('/workflow');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: 'Failed to delete task', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <X className="w-4 h-4 mr-2" />
              Delete Task
            </Button>
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
            <div className="text-xs text-gray-500 mt-1 opacity-60">
              task
            </div>
            {task.project && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-400">Project:</span>
                <Badge className="bg-purple-500/20 text-purple-400">
                  {task.project.name}
                </Badge>
              </div>
            )}
            {/* Show assigned users */}
            {(task.assigned_user || (task.assigned_users_details && task.assigned_users_details.length > 0)) && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-400">Assigned to:</span>
                {/* Show single assigned user (backward compatibility) */}
                {task.assigned_user && (!task.assigned_users_details || task.assigned_users_details.length === 0) && (
                  <Badge className="bg-blue-500/20 text-blue-400">
                    {task.assigned_user.name}
                  </Badge>
                )}
                {/* Show multiple assigned users */}
                {task.assigned_users_details && task.assigned_users_details.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {task.assigned_users_details.map((user, index) => (
                      <Badge key={`${user.id}-${index}`} className="bg-blue-500/20 text-blue-400">
                        {user.name || user.email}
                      </Badge>
                    ))}
                  </div>
                )}
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
                        <>
                          <div className="text-lg font-semibold text-white mb-1">
                            <Link href={`/notes/${note.id}`} className="underline hover:text-blue-400">
                              {note.note_title || <span className="text-gray-500 italic">(No title)</span>}
                            </Link>
                          </div>
                          <p className="text-gray-300 whitespace-pre-wrap">{note.content}</p>
                        </>
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
                <input
                  type="text"
                  className="w-full mb-2 px-3 py-2 rounded bg-gray-900 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Note Title"
                  value={newNoteTitle}
                  onChange={e => setNewNoteTitle(e.target.value)}
                />
                <Textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="mb-2"
                />
                <Button onClick={handleAddNote} disabled={!newNote.trim()} className="bg-yellow-600 hover:bg-yellow-700 w-full">
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

          {/* Timeline Section */}
          <Card className="bg-black border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-400" />
                  Timeline Associations ({linkedTimelineItems?.length || 0})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkTimelineModalOpen(true)}
                  className="border-green-500/20 text-green-400 hover:bg-green-500/10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Link to Timeline
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTimeline ? (
                <div className="text-gray-400">Loading timeline data...</div>
              ) : linkedTimelineItems.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No timeline items linked to this task</p>
                  <p className="text-sm mt-1">Link this task to objectives, milestones, or other timeline items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedTimelineItems.map((timelineItem) => (
                    <div key={timelineItem.id} className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        {timelineItem.type === 'milestone' && <Flag className="w-4 h-4 text-blue-400" />}
                        {timelineItem.type === 'objective' && <Target className="w-4 h-4 text-green-400" />}
                        {timelineItem.type === 'task' && <CheckCircle className="w-4 h-4 text-purple-400" />}
                        {timelineItem.type === 'deadline' && <AlertCircle className="w-4 h-4 text-red-400" />}
                        {timelineItem.type === 'plan' && <Clipboard className="w-4 h-4 text-yellow-400" />}
                        {timelineItem.type === 'review' && <Eye className="w-4 h-4 text-orange-400" />}
                        {timelineItem.type === 'meeting' && <Users className="w-4 h-4 text-cyan-400" />}
                        {timelineItem.type === 'deliverable' && <Package className="w-4 h-4 text-pink-400" />}
                        {timelineItem.type === 'research' && <Search className="w-4 h-4 text-indigo-400" />}
                        {timelineItem.type === 'other' && <MoreHorizontal className="w-4 h-4 text-gray-400" />}
                        <div>
                          <div className="font-medium text-white">{timelineItem.title}</div>
                          <div className="text-sm text-gray-400">{timelineItem.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/workmode/timeline/${timelineItem.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unlinkTaskFromTimeline(timelineItem.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

        {/* Link to Timeline Modal */}
        <Dialog open={linkTimelineModalOpen} onOpenChange={setLinkTimelineModalOpen}>
          <DialogContent className="sm:max-w-[600px] bg-black border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Link Task to Timeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {timelineItems.length === 0 ? (
                <div className="text-gray-400 text-center py-4">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium mb-2">No timeline items available for this project</p>
                  <p className="text-sm mb-3">Create timeline items in the workmode page first. You can create:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 max-w-md mx-auto">
                    <div>• Milestones</div>
                    <div>• Objectives</div>
                    <div>• Plans</div>
                    <div>• Reviews</div>
                    <div>• Meetings</div>
                    <div>• Deliverables</div>
                    <div>• Research</div>
                    <div>• Other</div>
                  </div>
                  <Link 
                    href={`/workmode?project=${task?.project_id}&tab=timeline`}
                    className="inline-block mt-3 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Go to Workmode →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {timelineItems
                    .filter(item => !linkedTimelineItems.some(linked => linked.id === item.id))
                    .map((timelineItem) => (
                      <div
                        key={timelineItem.id}
                        className="flex items-center justify-between p-3 border border-gray-700 rounded-lg hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => linkTaskToTimeline(timelineItem.id)}
                      >
                        <div className="flex items-center gap-3">
                          {timelineItem.type === 'milestone' && <Flag className="w-4 h-4 text-blue-400" />}
                          {timelineItem.type === 'objective' && <Target className="w-4 h-4 text-green-400" />}
                          {timelineItem.type === 'task' && <CheckCircle className="w-4 h-4 text-purple-400" />}
                          {timelineItem.type === 'deadline' && <AlertCircle className="w-4 h-4 text-red-400" />}
                          {timelineItem.type === 'plan' && <Clipboard className="w-4 h-4 text-yellow-400" />}
                          {timelineItem.type === 'review' && <Eye className="w-4 h-4 text-orange-400" />}
                          {timelineItem.type === 'meeting' && <Users className="w-4 h-4 text-cyan-400" />}
                          {timelineItem.type === 'deliverable' && <Package className="w-4 h-4 text-pink-400" />}
                          {timelineItem.type === 'research' && <Search className="w-4 h-4 text-indigo-400" />}
                          {timelineItem.type === 'other' && <MoreHorizontal className="w-4 h-4 text-gray-400" />}
                          <div>
                            <div className="font-medium text-white">{timelineItem.title}</div>
                            <div className="text-sm text-gray-400">{timelineItem.type}</div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Plus className="w-3 h-3 mr-1" />
                          Link
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setLinkTimelineModalOpen(false)}
                className="hover:bg-gray-800"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Task Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-black border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-red-400">Delete Task</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete this task? This action cannot be undone and will also delete:
              </p>
              <ul className="text-sm text-gray-400 space-y-1 mb-4">
                <li>• All notes associated with this task</li>
                <li>• All attachments and files</li>
                <li>• All timeline associations</li>
                <li>• The task itself</li>
              </ul>
              <p className="text-red-400 font-medium">
                Task: "{task?.title}"
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogOpen(false)}
                className="hover:bg-gray-800"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTask}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Task'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
} 
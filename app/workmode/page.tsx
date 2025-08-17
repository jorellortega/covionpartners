"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Users, Clock, MessageCircle, FileText, StickyNote, FolderKanban, CheckCircle, Activity, Plus, RefreshCw, Target, Calendar, TrendingUp, Download, Eye, MoreHorizontal, Flag, Zap, AlertCircle, Crown, Code, Palette, Shield, Server, Edit, Trash2, Send, Save, X, Lock, Unlock, Link as LinkIcon, Clipboard, Search, Package, MoreHorizontal as MoreIcon, Upload } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { useTeamMembers } from "@/hooks/useTeamMembers"
import { createEntityLink } from "@/lib/entity-links"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useRouter, useSearchParams } from "next/navigation"
import { User as BaseUser } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
interface UserWithStatus extends BaseUser {
  status?: string;
}

// Mock data
const mockProject = {
  id: 1,
  name: "E-commerce Platform",
  description: "Building a modern e-commerce platform with React and Node.js",
  status: "In Progress",
  progress: 65,
  dueDate: "2024-12-15",
  teamSize: 4,
  priority: "High"
}

const mockUsers = [
  { id: 1, name: "Alice", status: "online", clockedIn: true },
  { id: 2, name: "Bob", status: "away", clockedIn: true },
  { id: 3, name: "Charlie", status: "offline", clockedIn: false },
]
const mockSessions = [
  { id: 1, user: "Alice", type: "focused", status: "active", since: "10:00 AM" },
  { id: 2, user: "Bob", type: "collaborative", status: "active", since: "10:15 AM" },
]
const mockRooms = [
  { id: "general", name: "General", icon: <MessageCircle className="w-4 h-4 mr-1" /> },
  { id: "tasks", name: "Tasks", icon: <FolderKanban className="w-4 h-4 mr-1" /> },
  { id: "notes", name: "Notes", icon: <StickyNote className="w-4 h-4 mr-1" /> },
  { id: "files", name: "Files", icon: <FileText className="w-4 h-4 mr-1" /> },
  { id: "meetings", name: "Meetings", icon: <Users className="w-4 h-4 mr-1" /> },
]
const mockComments = [
  { id: 1, user: "Alice", content: "Let's focus on the API integration today.", time: "2 min ago" },
  { id: 2, user: "Bob", content: "I pushed a new commit for the UI.", time: "1 min ago" },
]
const mockActivities = [
  { id: 1, user: "Alice", action: "created a note", time: "3 min ago" },
  { id: 2, user: "Bob", action: "uploaded a file", time: "2 min ago" },
  { id: 3, user: "Alice", action: "commented in General", time: "1 min ago" },
]

const mockFiles = [
  { id: 1, name: "api-specification.md", type: "document", size: "2.3 MB", updatedBy: "Alice", updatedAt: "2 hours ago", status: "active" },
  { id: 2, name: "database-schema.sql", type: "code", size: "1.1 MB", updatedBy: "Bob", updatedAt: "1 hour ago", status: "active" },
  { id: 3, name: "ui-mockups.figma", type: "design", size: "5.7 MB", updatedBy: "Charlie", updatedAt: "30 min ago", status: "active" },
  { id: 4, name: "deployment-config.yml", type: "config", size: "0.5 MB", updatedBy: "Alice", updatedAt: "15 min ago", status: "active" },
  { id: 5, name: "test-results.pdf", type: "document", size: "3.2 MB", updatedBy: "Bob", updatedAt: "1 day ago", status: "archived" },
]

const mockTimeline = [
  {
    id: 1,
    type: "milestone",
    title: "Project Kickoff",
    description: "Initial planning and team setup",
    date: "2024-11-01",
    status: "completed",
    progress: 100,
    assignee: "Alice"
  },
  {
    id: 2,
    type: "objective",
    title: "Database Design",
    description: "Design and implement database schema",
    date: "2024-11-15",
    status: "completed",
    progress: 100,
    assignee: "Bob"
  },
  {
    id: 3,
    type: "task",
    title: "API Development",
    description: "Build REST API endpoints",
    date: "2024-11-30",
    status: "in_progress",
    progress: 75,
    assignee: "Alice",
    deadline: "2024-12-05"
  },
  {
    id: 4,
    type: "milestone",
    title: "Frontend Development",
    description: "Build user interface components",
    date: "2024-12-10",
    status: "upcoming",
    progress: 0,
    assignee: "Charlie"
  },
  {
    id: 5,
    type: "deadline",
    title: "Testing Phase",
    description: "Comprehensive testing and bug fixes",
    date: "2024-12-15",
    status: "upcoming",
    progress: 0,
    assignee: "Team"
  },
  {
    id: 6,
    type: "milestone",
    title: "Project Launch",
    description: "Deploy to production",
    date: "2024-12-20",
    status: "upcoming",
    progress: 0,
    assignee: "Alice"
  }
]

function WorkModeContent() {
  const [activeRoom, setActiveRoom] = useState("general")
  const [comment, setComment] = useState("")
  const { user, loading: userLoading } = useAuth()
  const { projects, loading: projectsLoading } = useProjects(user?.id)
  const [currentFocusId, setCurrentFocusId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const [group, setGroup] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editMessageContent, setEditMessageContent] = useState('')
  const [groupChats, setGroupChats] = useState<any[]>([])
  const [projectFiles, setProjectFiles] = useState<any[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [projectTasks, setProjectTasks] = useState<any[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [projectNotes, setProjectNotes] = useState<any[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [timeline, setTimeline] = useState<any[]>([])
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [newTimelineItem, setNewTimelineItem] = useState({
    type: 'milestone',
    title: '',
    description: '',
    due_date: '',
    status: 'upcoming',
    progress: 0,
    assignee_name: '',
  })
  const [editingTimelineItem, setEditingTimelineItem] = useState<any>(null)
  const [deleteTimelineItem, setDeleteTimelineItem] = useState<any>(null)
  const [newAssignees, setNewAssignees] = useState<string[]>([]);
  const [newCustomAssignee, setNewCustomAssignee] = useState('');
  const [editAssignees, setEditAssignees] = useState<string[]>([]);
  const [editCustomAssignee, setEditCustomAssignee] = useState('');
  const [activities, setActivities] = useState<any[]>([]);
  const [focusLocked, setFocusLocked] = useState(false);
  const [userAssignedTask, setUserAssignedTask] = useState<any>(null);
  const [linkTaskModalOpen, setLinkTaskModalOpen] = useState(false);
  const [selectedTaskForLinking, setSelectedTaskForLinking] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'completed',
    assigned_to: 'unassigned' as string,
    assigned_users: [] as string[]
  });
  const [newProjectNote, setNewProjectNote] = useState("")
  const [newProjectNoteTitle, setNewProjectNoteTitle] = useState("")
  const [creatingNote, setCreatingNote] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [zoomMeetings, setZoomMeetings] = useState<any[]>([])
  const [zoomLoading, setZoomLoading] = useState(false)
  const [zoomAuthenticated, setZoomAuthenticated] = useState(false)
  const [zoomUser, setZoomUser] = useState<any>(null)
  const [newMeeting, setNewMeeting] = useState({
    topic: '',
    start_time: '',
    duration: 60,
    type: 2, // Scheduled meeting
    settings: {
      host_video: true,
      participant_video: true,
      join_before_host: true,
      mute_upon_entry: false,
      watermark: false,
      use_pmi: false,
      approval_type: 0,
      audio: 'both',
      auto_recording: 'none'
    }
  })
  const [creatingMeeting, setCreatingMeeting] = useState(false)
  const [submittingFile, setSubmittingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileSubmission, setFileSubmission] = useState({
    title: '',
    description: '',
    task_id: '' as string | null
  })
  const [projectSubmissions, setProjectSubmissions] = useState<any[]>([])
  const [submissionsLoading, setSubmissionsLoading] = useState(false)
  const [showSubmissions, setShowSubmissions] = useState(false)
  
  // Member search functionality
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState<'lead' | 'member' | 'advisor' | 'consultant'>('member')
  const [addingMember, setAddingMember] = useState(false)

  // Load/save current focus from localStorage
  useEffect(() => {
    if (!userLoading && user) {
      const saved = localStorage.getItem("currentFocusProjectId")
      if (saved) setCurrentFocusId(saved)
    }
  }, [user, userLoading])
  useEffect(() => {
    if (currentFocusId) localStorage.setItem("currentFocusProjectId", currentFocusId)
  }, [currentFocusId])

  // Handle URL parameter for project selection
  useEffect(() => {
    const projectParam = searchParams.get('project')
    if (projectParam && projects && projects.length > 0) {
      const project = projects.find(p => p.id === projectParam)
      if (project) {
        setCurrentFocusId(project.id)
        return
      }
    }
  }, [searchParams, projects])

  // Pick first project as default if none selected
  useEffect(() => {
    if (!currentFocusId && projects && projects.length > 0) {
      setCurrentFocusId(projects[0].id)
    }
  }, [projects, currentFocusId])

  const currentProject = projects.find(p => p.id === currentFocusId) || projects[0]
  const { teamMembers, refreshTeamMembers } = useTeamMembers(currentProject?.id || "")

  // Fetch the 'General' group on mount
  useEffect(() => {
    const fetchGroup = async () => {
      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .ilike('name', 'general')
        .maybeSingle()
      if (data) setGroup(data)
    }
    fetchGroup()
  }, [])

  // Fetch all group chats for the user
  useEffect(() => {
    if (!user) return;
    const fetchGroupChats = async () => {
      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .order('created_at', { ascending: false })
      if (data) {
        setGroupChats(data)
        if (!group && data.length > 0) setGroup(data[0])
      }
    }
    fetchGroupChats()
  }, [user])

  // Fetch messages for the group
  useEffect(() => {
    if (!group) return
    setMessagesLoading(true)
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('group_chat_messages')
        .select('id, content, created_at, sender_id, sender:sender_id (name, email, avatar_url)')
        .eq('group_chat_id', group.id)
        .order('created_at', { ascending: true })
      setMessages(data || [])
      setMessagesLoading(false)
    }
    fetchMessages()
  }, [group])

  // Fetch project files for the current project from both tables
  useEffect(() => {
    if (!currentProject?.id) return;
    setFilesLoading(true);
    const fetchFiles = async () => {
      // Fetch from project_files
      const { data: pfData, error: pfError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });
      // Fetch from timeline_files
      const { data: tfData, error: tfError } = await supabase
        .from('timeline_files')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('uploaded_at', { ascending: false });
      // Map both to a common format
      const pfMapped = (pfData || []).map(f => ({
        id: f.id,
        name: f.name,
        size: f.size || 0,
        created_at: f.created_at,
        url: f.url,
      }));
      const tfMapped = (tfData || []).map(f => ({
        id: f.id,
        name: f.file_name,
        size: f.size || 0,
        created_at: f.uploaded_at,
        url: supabase.storage.from('partnerfiles').getPublicUrl(f.file_url).data.publicUrl,
      }));
      // Merge and sort by date descending
      const allFiles = [...pfMapped, ...tfMapped].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setProjectFiles(allFiles);
      setFilesLoading(false);
    };
    fetchFiles();
  }, [currentProject?.id]);

  // Fetch tasks for the current project (for Tasks tab)
  useEffect(() => {
    if (!currentProject?.id) return;
    setTasksLoading(true);
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });
      setProjectTasks(data || []);
      setTasksLoading(false);
    };
    fetchTasks();
  }, [currentProject?.id]);

  // Fetch notes for the current project (for Notes tab)
  useEffect(() => {
    if (!currentProject?.id) return;
    setNotesLoading(true);
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', currentProject.id)
        .order('created_at', { ascending: false });
      
      if (data) {
        // Fetch user details for each note
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
        setProjectNotes(notesWithUser);
      } else {
        setProjectNotes([]);
      }
      setNotesLoading(false);
    };
    fetchNotes();
  }, [currentProject?.id]);

  useEffect(() => {
    if (!currentProject?.id) return;
    setTimelineLoading(true)
    supabase
      .from('project_timeline')
      .select('*')
      .eq('project_id', currentProject.id)
      .order('order_index', { ascending: true })
      .then(({ data, error }) => {
        console.log('Fetched timeline:', data?.map(item => ({ id: item.id, title: item.title })));
        setTimeline(data || [])
        setTimelineLoading(false)
      })
  }, [currentProject?.id])

  // Fetch activities for the current project
  useEffect(() => {
    if (!currentProject?.id) return;
    const fetchActivities = async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, user:users(name, email)')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setActivities(data || []);
    };
    fetchActivities();
  }, [currentProject?.id]);

  // Fetch focus lock on mount
  useEffect(() => {
    if (!user) return;
    const fetchFocus = async () => {
      const { data } = await supabase
        .from('user_project_focus')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data && data.focus_locked) {
        setCurrentFocusId(data.project_id);
        setFocusLocked(true);
        if (data.group_id) setActiveRoom(data.group_id); // string or uuid
      } else {
        setFocusLocked(false);
      }
    };
    fetchFocus();
  }, [user]);

  // Check Zoom authentication on mount and handle callback
  useEffect(() => {
    if (user) {
      checkZoomAuth();
    }
  }, [user]);

  // Handle Zoom auth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const zoomAuth = urlParams.get('zoom_auth');
    
    if (zoomAuth === 'success') {
      toast.success('Zoom account connected successfully!');
      checkZoomAuth();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (zoomAuth === 'error') {
      toast.error('Failed to connect Zoom account');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch project submissions
  useEffect(() => {
    if (currentProject?.id) {
      fetchProjectSubmissions();
    }
  }, [currentProject?.id]);

  // Fetch user's assigned task for the current project
  useEffect(() => {
    if (!user || !currentProject?.id) return;
    
    const fetchUserAssignedTask = async () => {
      try {
        // First try to find task from work assignments
        const { data: workAssignment, error: workError } = await supabase
          .from('project_role_work_assignments')
          .select('*')
          .eq('user_id', user.id)
          .eq('project_id', currentProject.id)
          .maybeSingle();

        if (workAssignment) {
          // If there's a work assignment, try to find the associated task
          const { data: timelineItem, error: timelineError } = await supabase
            .from('timeline')
            .select('*')
            .eq('user_id', user.id)
            .eq('project_id', currentProject.id)
            .eq('action', 'work_assigned')
            .maybeSingle();

          if (timelineItem?.related_task_id) {
            const { data: task, error: taskError } = await supabase
              .from('tasks')
              .select('*')
              .eq('id', timelineItem.related_task_id)
              .single();

            if (task) {
              setUserAssignedTask(task);
              return;
            }
          }
        }

        // Fallback: look for tasks directly assigned to the user
        const { data: directTask, error: directError } = await supabase
          .from('tasks')
          .select('*')
          .eq('project_id', currentProject.id)
          .eq('assigned_to', user.id)
          .maybeSingle();

        if (directTask) {
          setUserAssignedTask(directTask);
        }
      } catch (error) {
        console.error('Error fetching user assigned task:', error);
      }
    };

    fetchUserAssignedTask();
  }, [user, currentProject?.id]);

  // Keep group_id in sync if locked and chat changes
  useEffect(() => {
    if (focusLocked && user) {
      supabase.from('user_project_focus')
        .update({ group_id: activeRoom })
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating group_id:', error);
            toast.error(error.message || 'Failed to update locked chat');
          }
        });
    }
  }, [activeRoom, focusLocked, user]);

  const handleLock = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('user_project_focus').upsert({
        user_id: user.id,
        project_id: currentFocusId,
        group_id: activeRoom, // save current chat/group as string
        focus_locked: true,
      });
      if (error) {
        console.error('Error locking project focus:', error);
        toast.error(error.message || 'Failed to lock project focus');
        return;
      }
      setFocusLocked(true);
    } catch (err: any) {
      console.error('Exception in handleLock:', err);
      toast.error('Exception in handleLock: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUnlock = async () => {
    if (!user) return;
    await supabase.from('user_project_focus').update({ focus_locked: false }).eq('user_id', user.id);
    setFocusLocked(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !group || !user) return
    await supabase.from('group_chat_messages').insert({
      group_chat_id: group.id,
      sender_id: user.id,
      content: newMessage.trim(),
    })
    setNewMessage('')
    // Refetch messages
    const { data } = await supabase
      .from('group_chat_messages')
      .select('id, content, created_at, sender_id, sender:sender_id (name, email, avatar_url)')
      .eq('group_chat_id', group.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const handleEditMessage = (msg: any) => {
    setEditingMessageId(msg.id)
    setEditMessageContent(msg.content)
  }
  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditMessageContent('')
  }
  const handleSaveEdit = async (msg: any) => {
    if (!editMessageContent.trim()) return
    await supabase.from('group_chat_messages').update({ content: editMessageContent.trim() }).eq('id', msg.id)
    setEditingMessageId(null)
    setEditMessageContent('')
    // Refetch messages
    const { data } = await supabase
      .from('group_chat_messages')
      .select('id, content, created_at, sender_id, sender:sender_id (name, email, avatar_url)')
      .eq('group_chat_id', group.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }
  const handleDeleteMessage = async (msg: any) => {
    await supabase.from('group_chat_messages').delete().eq('id', msg.id)
    // Refetch messages
    const { data } = await supabase
      .from('group_chat_messages')
      .select('id, content, created_at, sender_id, sender:sender_id (name, email, avatar_url)')
      .eq('group_chat_id', group.id)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  // Helper for status/priority badges
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-600/80 text-white">completed</Badge>
      case "active":
      case "in progress":
        return <Badge className="bg-blue-700/80 text-white">in progress</Badge>
      case "pending":
        return <Badge className="bg-yellow-700/80 text-white">pending</Badge>
      default:
        return <Badge className="bg-gray-700/80 text-white">{status}</Badge>
    }
  }

  // CRUD Functions for Timeline Items
  const handleCreateTimelineItem = async () => {
    if (!currentProject?.id || !newTimelineItem.title.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const { data, error } = await supabase
        .from('project_timeline')
        .insert([{
          project_id: currentProject.id,
          type: newTimelineItem.type,
          title: newTimelineItem.title.trim(),
          description: newTimelineItem.description.trim(),
          due_date: newTimelineItem.due_date || null,
          status: newTimelineItem.status,
          progress: newTimelineItem.progress,
          assignee_name: newAssignees.join(', '),
          order_index: timeline.length + 1
        }])
        .select()

      if (error) throw error

      // Log activity
      if (data && data[0] && user) {
        await supabase.from('activity_log').insert([{
          user_id: user.id,
          project_id: currentProject.id,
          action_type: 'created_timeline_item',
          entity_type: 'timeline',
          entity_id: data[0].id,
          description: `${user.name || user.email} created timeline item "${newTimelineItem.title}"`,
        }]);
      }

      toast.success("Timeline item created successfully")
      setIsCreateModalOpen(false)
      setNewTimelineItem({
        type: 'milestone',
        title: '',
        description: '',
        due_date: '',
        status: 'upcoming',
        progress: 0,
        assignee_name: '',
      })
      setNewAssignees([]);
      setNewCustomAssignee('');
      
      // Refresh timeline
      const { data: updatedTimeline } = await supabase
        .from('project_timeline')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('order_index', { ascending: true })
      setTimeline(updatedTimeline || [])
      // Refresh activities
      const { data: updatedActivities } = await supabase
        .from('activity_log')
        .select('*, user:users(name, email)')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setActivities(updatedActivities || []);
    } catch (error: any) {
      console.error('Error creating timeline item:', error)
      toast.error(error.message || "Failed to create timeline item")
    }
  }

  const handleEditTimelineItem = async () => {
    if (!editingTimelineItem || !editingTimelineItem.title.trim()) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      // Debug log: show what is being sent
      console.log('Updating timeline item:', editingTimelineItem);

      const { error, data } = await supabase
        .from('project_timeline')
        .update({
          type: editingTimelineItem.type,
          title: editingTimelineItem.title.trim(),
          description: editingTimelineItem.description.trim(),
          due_date: editingTimelineItem.due_date || null,
          status: editingTimelineItem.status,
          progress: editingTimelineItem.progress,
          assignee_name: editAssignees.join(', '),
        })
        .eq('id', editingTimelineItem.id)
        .select();

      // Debug log: show result
      console.log('Supabase update result:', { error, data });

      if (error) throw error

      // If no rows were updated, show a warning and do not show success
      if (!data || (Array.isArray(data) && data.length === 0)) {
        toast.warning("No timeline item was updated. Check if the item ID is correct.")
        console.warn('No rows updated. Tried to update id:', editingTimelineItem.id, 'Result:', data)
        return
      }

      // Log activity
      if (user) {
        await supabase.from('activity_log').insert([{
          user_id: user.id,
          project_id: currentProject.id,
          action_type: 'edited_timeline_item',
          entity_type: 'timeline',
          entity_id: editingTimelineItem.id,
          description: `${user.name || user.email} edited timeline item "${editingTimelineItem.title}"`,
        }]);
      }

      toast.success("Timeline item updated successfully")
      setIsEditModalOpen(false)
      setEditingTimelineItem(null)
      
      // Refresh timeline
      const { data: updatedTimeline } = await supabase
        .from('project_timeline')
        .select('*')
        .eq('project_id', currentProject?.id)
        .order('order_index', { ascending: true })
      setTimeline(updatedTimeline || [])
      // Refresh activities
      const { data: updatedActivities } = await supabase
        .from('activity_log')
        .select('*, user:users(name, email)')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setActivities(updatedActivities || []);
    } catch (error: any) {
      console.error('Error updating timeline item:', error)
      toast.error(error.message || "Failed to update timeline item")
    }
  }

  const handleDeleteTimelineItem = async () => {
    if (!deleteTimelineItem) return

    try {
      const { error } = await supabase
        .from('project_timeline')
        .delete()
        .eq('id', deleteTimelineItem.id)

      if (error) throw error

      toast.success("Timeline item deleted successfully")
      setDeleteTimelineItem(null)
      
      // Refresh timeline
      const { data: updatedTimeline } = await supabase
        .from('project_timeline')
        .select('*')
        .eq('project_id', currentProject?.id)
        .order('order_index', { ascending: true })
      setTimeline(updatedTimeline || [])
    } catch (error: any) {
      console.error('Error deleting timeline item:', error)
      toast.error(error.message || "Failed to delete timeline item")
    }
  }

  const openEditModal = (item: any) => {
    console.log('Opening edit modal for item:', item, 'with id:', item.id);
    setEditingTimelineItem({ ...item })
    setIsEditModalOpen(true)
    setEditAssignees(item.assignee_name ? item.assignee_name.split(',').map((name: string) => name.trim()) : []);
    setEditCustomAssignee('');
  }

  const openDeleteModal = (item: any) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
  };

  // Function to link a task to a timeline item
  const linkTaskToTimeline = async (taskId: string, timelineId: string) => {
    try {
      // Use the new entity linking system
      const { error } = await createEntityLink(
        'timeline',
        timelineId,
        'task',
        taskId,
        'association',
        currentProject?.id
      );

      if (error) {
        console.error('Error linking task to timeline:', error);
        toast.error('Failed to link task to timeline');
        return;
      }

      toast.success('Task linked to timeline successfully');
      setLinkTaskModalOpen(false);
      setSelectedTaskForLinking(null);
      
      // Refresh timeline data
      const { data: updatedTimeline } = await supabase
        .from('project_timeline')
        .select('*')
        .eq('project_id', currentProject?.id)
        .order('order_index', { ascending: true });
      setTimeline(updatedTimeline || []);
    } catch (error) {
      console.error('Error linking task:', error);
      toast.error('Failed to link task to timeline');
    }
  };

  const openLinkTaskModal = (task: any) => {
    setSelectedTaskForLinking(task);
    setLinkTaskModalOpen(true);
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !currentProject?.id || !user) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          project_id: currentProject.id,
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          due_date: newTask.due_date || null,
          priority: newTask.priority,
          status: newTask.status,
          created_by: user.id,
          assigned_to: newTask.assigned_to === 'unassigned' ? null : newTask.assigned_to,
          assigned_users: newTask.assigned_users.length > 0 ? newTask.assigned_users : []
        }])
        .select();

      if (error) throw error;

      // Log activity
      if (data && data[0] && user) {
        await supabase.from('activity_log').insert([{
          user_id: user.id,
          project_id: currentProject.id,
          action_type: 'created_task',
          entity_type: 'task',
          entity_id: data[0].id,
          description: `${user.name || user.email} created task "${newTask.title}"`,
        }]);
      }

      toast.success("Task created successfully");
      setIsNewTaskModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        status: 'pending',
        assigned_to: 'unassigned',
        assigned_users: []
      });
      
      // Refresh tasks
      const { data: updatedTasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });
      setProjectTasks(updatedTasks || []);
      
      // Refresh activities
      const { data: updatedActivities } = await supabase
        .from('activity_log')
        .select('*, user:users(name, email)')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setActivities(updatedActivities || []);
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.message || "Failed to create task");
    }
  };

  const handleCreateProjectNote = async () => {
    if (!newProjectNote.trim() || !currentProject?.id || !user) {
      toast.error("Please enter a note");
      return;
    }

    try {
      setCreatingNote(true);
      const { data, error } = await supabase
        .from('notes')
        .insert([{
          entity_type: 'project',
          entity_id: currentProject.id,
          content: newProjectNote.trim(),
          created_by: user.id,
          entity_title: currentProject.name,
          note_title: newProjectNoteTitle.trim() || null
        }])
        .select();

      if (error) throw error;

      // Log activity
      if (data && data[0] && user) {
        await supabase.from('activity_log').insert([{
          user_id: user.id,
          project_id: currentProject.id,
          action_type: 'created_note',
          entity_type: 'note',
          entity_id: data[0].id,
          description: `${user.name || user.email} created a note`,
        }]);
      }

      toast.success("Note created successfully");
      setNewProjectNote("");
      setNewProjectNoteTitle("");
      setShowNoteForm(false);
      
      // Refresh notes
      const { data: updatedNotes } = await supabase
        .from('notes')
        .select('*')
        .eq('entity_type', 'project')
        .eq('entity_id', currentProject.id)
        .order('created_at', { ascending: false });
      setProjectNotes(updatedNotes || []);
    } catch (error: any) {
      console.error('Error creating note:', error);
      toast.error(error.message || "Failed to create note");
    } finally {
      setCreatingNote(false);
    }
  };

  // Zoom API Integration
  const ZOOM_CLIENT_ID = process.env.NEXT_PUBLIC_ZOOM_CLIENT_ID;
  const ZOOM_REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/api/zoom/callback` : '';

  const initiateZoomAuth = () => {
    if (!user?.id) {
      toast.error("Please sign in first");
      return;
    }
    const zoomAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(ZOOM_REDIRECT_URI)}&state=${user.id}`;
    window.open(zoomAuthUrl, '_blank', 'width=500,height=600');
  };

  const checkZoomAuth = async () => {
    try {
      const { data: zoomAuth } = await supabase
        .from('user_zoom_auth')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (zoomAuth && zoomAuth.access_token) {
        setZoomAuthenticated(true);
        setZoomUser(zoomAuth);
        fetchZoomMeetings();
      }
    } catch (error) {
      console.error('Error checking Zoom auth:', error);
    }
  };

  const fetchZoomMeetings = async () => {
    if (!zoomUser?.access_token) return;
    
    setZoomLoading(true);
    try {
      const response = await fetch('/api/zoom/meetings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${zoomUser.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setZoomMeetings(data.meetings || []);
      }
    } catch (error) {
      console.error('Error fetching Zoom meetings:', error);
      toast.error('Failed to fetch meetings');
    } finally {
      setZoomLoading(false);
    }
  };

  const createZoomMeeting = async () => {
    if (!newMeeting.topic.trim() || !newMeeting.start_time || !zoomUser?.access_token) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreatingMeeting(true);
    try {
      const response = await fetch('/api/zoom/meetings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${zoomUser.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newMeeting)
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success("Meeting created successfully");
        setNewMeeting({
          topic: '',
          start_time: '',
          duration: 60,
          type: 2,
          settings: {
            host_video: true,
            participant_video: true,
            join_before_host: true,
            mute_upon_entry: false,
            watermark: false,
            use_pmi: false,
            approval_type: 0,
            audio: 'both',
            auto_recording: 'none'
          }
        });
        fetchZoomMeetings();
      } else {
        throw new Error('Failed to create meeting');
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast.error('Failed to create meeting');
    } finally {
      setCreatingMeeting(false);
    }
  };

  const joinZoomMeeting = (meetingId: string, password?: string) => {
    const joinUrl = `https://zoom.us/j/${meetingId}${password ? `?pwd=${password}` : ''}`;
    window.open(joinUrl, '_blank');
  };

  const deleteZoomMeeting = async (meetingId: string) => {
    if (!zoomUser?.access_token) return;
    
    try {
      const response = await fetch(`/api/zoom/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${zoomUser.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast.success("Meeting deleted successfully");
        fetchZoomMeetings();
      } else {
        throw new Error('Failed to delete meeting');
      }
    } catch (error) {
      console.error('Error deleting meeting:', error);
      toast.error('Failed to delete meeting');
    }
  };

  // File Submission Functions
  const fetchProjectSubmissions = async () => {
    if (!currentProject?.id) return;
    
    setSubmissionsLoading(true);
    try {
      // First fetch the files
      const { data: files, error: filesError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });
      
      if (filesError) throw filesError;
      
      // Then fetch user and task data for each file
      const submissionsWithData = await Promise.all(
        (files || []).map(async (file) => {
          let userData = null;
          let taskData = null;
          
          if (file.user_id) {
            const { data: user } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', file.user_id)
              .single();
            userData = user;
          }
          
          if (file.task_id) {
            const { data: task } = await supabase
              .from('tasks')
              .select('title')
              .eq('id', file.task_id)
              .single();
            taskData = task;
          }
          
          return { ...file, user: userData, task: taskData };
        })
      );
      
      setProjectSubmissions(submissionsWithData);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleFileSubmission = async () => {
    if (!selectedFile || !fileSubmission.title.trim() || !currentProject?.id || !user) {
      toast.error("Please select a file and provide a title");
      return;
    }

    setSubmittingFile(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `project-submissions/${currentProject.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('partnerfiles')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('partnerfiles')
        .getPublicUrl(fileName);

      // Save submission to database
      const { data: submission, error: dbError } = await supabase
        .from('project_files')
        .insert([{
          project_id: currentProject.id,
          user_id: user.id,
          name: fileSubmission.title.trim(),
          storage_name: fileName,
          url: publicUrl,
          type: selectedFile.type,
          size: selectedFile.size,
          team_only: false,
          access_level: 1,
          custom_label: fileSubmission.description.trim() || null,
          task_id: fileSubmission.task_id || null
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      // Log activity
      await supabase.from('activity_log').insert([{
        user_id: user.id,
        project_id: currentProject.id,
        action_type: 'submitted_file',
        entity_type: 'submission',
        entity_id: submission.id,
        description: `${user.name || user.email} submitted "${fileSubmission.title}"`,
      }]);

      toast.success("File submitted successfully");
      
      // Reset form
      setSelectedFile(null);
      setFileSubmission({
        title: '',
        description: '',
        task_id: ''
      });
      
      // Close modal
      setIsFileUploadModalOpen(false);
      
      // Refresh submissions and project files
      fetchProjectSubmissions();
      
      // Refresh project files for the sidebar
      if (currentProject?.id) {
        const fetchFiles = async () => {
          // Fetch from project_files
          const { data: pfData, error: pfError } = await supabase
            .from('project_files')
            .select('*')
            .eq('project_id', currentProject.id)
            .order('created_at', { ascending: false });
          // Fetch from timeline_files
          const { data: tfData, error: tfError } = await supabase
            .from('timeline_files')
            .select('*')
            .eq('project_id', currentProject.id)
            .order('uploaded_at', { ascending: false });
          // Map both to a common format
          const pfMapped = (pfData || []).map(f => ({
            id: f.id,
            name: f.name,
            size: f.size || 0,
            created_at: f.created_at,
            url: f.url,
          }));
          const tfMapped = (tfData || []).map(f => ({
            id: f.id,
            name: f.file_name,
            size: f.size || 0,
            created_at: f.uploaded_at,
            url: supabase.storage.from('partnerfiles').getPublicUrl(f.file_url).data.publicUrl,
          }));
          // Merge and sort by date descending
          const allFiles = [...pfMapped, ...tfMapped].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setProjectFiles(allFiles);
        };
        fetchFiles();
      }
    } catch (error: any) {
      console.error('Error submitting file:', error);
      toast.error(error.message || "Failed to submit file");
    } finally {
      setSubmittingFile(false);
    }
  };

  const downloadSubmission = async (submission: any) => {
    try {
      const response = await fetch(submission.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error("Failed to download file");
    }
  };

  const deleteSubmission = async (submissionId: string, storageName: string) => {
    try {
      // Delete file from storage
      await supabase.storage.from('partnerfiles').remove([`project-files/${currentProject?.id}/${storageName}`]);
      
      // Delete from database
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', submissionId);

      if (error) throw error;

      toast.success("Submission deleted successfully");
      fetchProjectSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error("Failed to delete submission");
    }
  };

  // Member search functionality
  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/users/search?email=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users || []);
      } else {
        console.error('Failed to search users');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !currentProject?.id) {
      toast.error("Please select a user and ensure project is loaded");
      return;
    }

    setAddingMember(true);
    try {
      // Add team member directly using supabase
      const { error } = await supabase
        .from('team_members')
        .insert([{
          project_id: currentProject.id,
          user_id: selectedUser.id,
          role: selectedRole,
          status: 'active',
          joined_at: new Date().toISOString()
        }]);

      if (error) {
        throw error;
      }

      toast.success(`Added ${selectedUser.name || selectedUser.email} as ${selectedRole}`);
      setIsAddMemberModalOpen(false);
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      
      // Refresh team members
      await refreshTeamMembers();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast.error(error.message || "Failed to add team member");
    } finally {
      setAddingMember(false);
    }
  };

  const openAddMemberModal = () => {
    setIsAddMemberModalOpen(true);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setSelectedRole('member');
  };

  const openFileUploadModal = () => {
    setIsFileUploadModalOpen(true);
    // Reset form when opening modal
    setSelectedFile(null);
    setFileSubmission({
      title: '',
      description: '',
      task_id: ''
    });
  };

  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-5xl mx-auto py-4 px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center">
              <Activity className="w-6 h-6 text-green-400 mr-2" />
              Workspace
            </h1>
            <Badge className="bg-green-800/30 text-green-300 border-green-700">Live Collaboration</Badge>
            <Button
              variant="ghost"
              size="icon"
              className={`ml-6 p-3 min-w-[56px] min-h-[56px] rounded-full border-2 ${focusLocked ? 'border-yellow-400 bg-yellow-900/20 hover:bg-yellow-900/40' : 'border-blue-400 bg-blue-900/10 hover:bg-blue-900/30'} transition`}
              onClick={focusLocked ? handleUnlock : handleLock}
              title={focusLocked ? 'Unlock project focus' : 'Lock project focus'}
            >
              {focusLocked
                ? <Lock className="w-10 h-10 text-yellow-400" />
                : <Unlock className="w-10 h-10 text-blue-400" />}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-green-900/20 hover:text-green-400">
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-blue-900/20 hover:text-blue-400" asChild>
              <Link href="/dashboard"><Users className="w-4 h-4 mr-1" /> Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto py-6 px-2 sm:px-4 grid grid-cols-12 gap-4 sm:gap-6">
        {/* Left sidebar: Project Focus, Presence & Sessions */}
        <div className="col-span-12 md:col-span-3 space-y-4">
          {/* Current Project Focus */}
          <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center text-blue-400">
                <Target className="w-5 h-5 mr-2" /> Current Focus
              </CardTitle>
              <div className="flex items-center gap-2">
                {projects.length > 1 && (
                  <span className="text-xs text-blue-300 cursor-pointer" onClick={e => {
                    e.stopPropagation();
                    const el = document.getElementById('focus-project-select');
                    if (el) el.focus();
                  }}>
                    Change
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 p-2 min-w-[40px] min-h-[40px]"
                  onClick={focusLocked ? handleUnlock : handleLock}
                  title={focusLocked ? 'Unlock project focus' : 'Lock project focus'}
                >
                  {focusLocked ? <Lock className="w-7 h-7 text-yellow-400" /> : <Unlock className="w-7 h-7 text-blue-400" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectsLoading || userLoading ? (
                <div className="text-gray-400">Loading...</div>
              ) : !currentProject ? (
                <div className="text-gray-400">No projects found.</div>
              ) : (
                <>
                  <div>
                    <h3 className="font-bold text-white text-lg">{currentProject.name}</h3>
                    <p className="text-gray-300 text-sm mt-1">{currentProject.description || <span className="italic text-gray-500">No description</span>}</p>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(currentProject.status)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white font-medium">{currentProject.progress ?? 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${currentProject.progress ?? 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-gray-400">
                      <Users className="w-4 h-4 mr-1" />
                      {teamMembers.length} members
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due {currentProject.deadline ? new Date(currentProject.deadline).toLocaleDateString() : '--'}
                    </div>
                  </div>
                  <Button size="lg" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-base font-semibold mt-2">
                    <TrendingUp className="w-5 h-5 mr-1" />
                    Details
                  </Button>
                  {projects.length > 1 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-400 mb-1">Change Focus Project</div>
                      <Select value={currentFocusId || ''} onValueChange={setCurrentFocusId} disabled={focusLocked}>
                        <SelectTrigger id="focus-project-select" className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select project..." />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* In the Live Users card, use real team members and their status */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Users className="w-5 h-5 mr-2" />Live Users</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {teamMembers.length === 0 ? (
                <div className="text-gray-400">No team members found.</div>
              ) : (
                teamMembers.map(u => {
                  const user = u.user as UserWithStatus
                  return (
                    <div key={u.id} className="flex items-center gap-2">
                      <User className={`w-4 h-4 ${user.status === 'online' ? 'text-green-400' : user.status === 'away' ? 'text-yellow-400' : user.status === 'busy' ? 'text-orange-400' : 'text-gray-400'}`} />
                      <span className="font-medium text-white">{user.name || user.email}</span>
                      <Badge className={`ml-2 ${user.status === 'online' ? 'bg-green-500/20 text-green-400' : user.status === 'away' ? 'bg-yellow-500/20 text-yellow-400' : user.status === 'busy' ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-500/20 text-gray-400'}`}>{user.status || 'offline'}</Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* In the Active Sessions card, fetch and show users with active sessions for the current project */}
          <ActiveSessionsCard projectId={currentProject?.id} teamMembers={teamMembers} refreshTeamMembers={refreshTeamMembers} />

          {/* Project Files */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Project Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">{projectFiles.length} files</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-gray-700 text-xs"
                  onClick={openFileUploadModal}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Upload
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filesLoading ? (
                  <div className="text-gray-400">Loading files...</div>
                ) : projectFiles.length === 0 ? (
                  <div className="text-gray-400">No files found.</div>
                ) : (
                  projectFiles.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-blue-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{file.name}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          <span>•</span>
                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-gray-700" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer"><Download className="w-3 h-3" /></a>
                      </Button>
                    </div>
                  </div>
                  ))
                )}
              </div>
              <Button size="sm" variant="outline" className="w-full mt-2 border-gray-700 text-gray-300 hover:text-white" asChild>
                <Link href={currentProject ? `/projectfiles/${currentProject.id}` : "#"}>
                  View All Files
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Team Roles & Positions */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                Team Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">{teamMembers.length} team members</span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-gray-700 text-xs"
                  onClick={openAddMemberModal}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Member
                </Button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {teamMembers.length === 0 ? (
                  <div className="text-gray-400">No team members found.</div>
                ) : (
                  teamMembers.map(member => (
                    <div key={member.id} className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-gray-500/20 text-gray-400 border border-gray-500/50`}>
                            {member.user?.name?.[0] || member.user?.email?.[0] || '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-white text-sm">{member.user?.name || member.user?.email}</div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-300">{member.role}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Main content: Rooms, Comments, Activity */}
        <div className="col-span-12 md:col-span-9 space-y-6 min-w-0">
          <Tabs value={activeRoom} onValueChange={setActiveRoom} className="w-full overflow-x-auto max-w-full">
            <TabsList className="flex gap-2 bg-gray-800/50 overflow-x-auto max-w-full rounded-lg p-1">
              {mockRooms.map(r => (
                <TabsTrigger key={r.id} value={r.id} className="flex items-center gap-1 whitespace-nowrap px-2 py-1 text-sm sm:text-base">{r.icon}{r.name}</TabsTrigger>
              ))}
            </TabsList>
            {mockRooms.map(r => (
              <TabsContent key={r.id} value={r.id} className="pt-2 sm:pt-4">
                <Card className="leonardo-card border-gray-800 mb-4 w-full max-w-full">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center">{r.icon}{r.name} Room</CardTitle>
                    <div className="flex gap-2">
                      {r.name === 'Tasks' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-700 text-xs px-2 py-1"
                          onClick={() => router.push('/workflow')}
                        >
                          All Tasks
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-gray-700 text-xs px-2 py-1"
                        onClick={() => {
                          if (r.name === 'Tasks') {
                            setIsNewTaskModalOpen(true);
                          } else if (r.name === 'Notes') {
                            // Toggle note form visibility and focus on input
                            setShowNoteForm(true);
                            setTimeout(() => {
                              const noteInput = document.querySelector('input[placeholder="Type a note..."]') as HTMLInputElement;
                              if (noteInput) {
                                noteInput.focus();
                              }
                            }, 100);
                          }
                        }}
                      >
                        + New {r.name === 'Files' ? 'File' : r.name === 'Notes' ? 'Note' : r.name === 'Tasks' ? 'Task' : 'Message'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {r.id === 'general' ? (
                      <div className="space-y-3">
                        {/* Group Chat Selector */}
                        <div className="mb-2 sm:mb-4">
                          <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1">Select Group Chat</label>
                          <select
                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-xs sm:text-base"
                            value={group?.id || ''}
                            onChange={e => {
                              const selected = groupChats.find(g => g.id === e.target.value)
                              if (selected) setGroup(selected)
                            }}
                          >
                            {groupChats.length === 0 ? (
                              <option value="">No group chats found</option>
                            ) : (
                              groupChats.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                              ))
                            )}
                          </select>
                        </div>
                        <div className="space-y-4 h-[300px] sm:h-[400px] overflow-y-auto pr-2 sm:pr-4 bg-gray-900 rounded-lg p-2 sm:p-4">
                          {messagesLoading ? (
                            <div className="text-gray-400">Loading messages...</div>
                          ) : messages.length === 0 ? (
                            <div className="text-gray-400">No messages yet.</div>
                          ) : (
                            messages.map(msg => {
                              let isTaskCard = false;
                              let isProjectCard = false;
                              let parsed = null;
                              try {
                                parsed = JSON.parse(msg.content);
                                if (parsed && parsed.type === 'task') isTaskCard = true;
                                if (parsed && parsed.type === 'project') isProjectCard = true;
                              } catch {}
                              const isEditing = editingMessageId === msg.id;
                              return (
                                <div key={msg.id} className={`flex items-start gap-2 sm:gap-3 ${msg.sender_id === user?.id ? 'justify-end' : ''}`}>
                                  {msg.sender_id !== user?.id && (
                                    <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                                      <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                      <AvatarFallback>{msg.sender?.name ? msg.sender.name[0] : '?'}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div className="min-w-0 max-w-[80vw] sm:max-w-md">
                                    <div className={`px-3 py-2 rounded-lg break-words ${isTaskCard || isProjectCard ? 'bg-transparent' : (msg.sender_id === user?.id ? 'bg-cyan-700/80 text-white' : 'bg-gray-800/80 text-gray-100')}`}> 
                                      <span className="font-medium text-xs sm:text-sm">{msg.sender?.name || 'Unknown'}</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        {isEditing ? (
                                          <>
                                            <input
                                              className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-white w-full"
                                              value={editMessageContent}
                                              onChange={e => setEditMessageContent(e.target.value)}
                                            />
                                            <Button size="icon" variant="ghost" onClick={() => handleSaveEdit(msg)}><Save className="w-4 h-4" /></Button>
                                            <Button size="icon" variant="ghost" onClick={handleCancelEdit}><X className="w-4 h-4" /></Button>
                                          </>
                                        ) : (
                                          <>
                                            {isTaskCard ? (
                                              (() => {
                                                const status = parsed.status || 'pending';
                                                const priority = parsed.priority || 'medium';
                                                const statusBadgeClass =
                                                  status === 'completed'
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : status === 'in_progress'
                                                    ? 'bg-blue-500/20 text-blue-400'
                                                    : 'bg-yellow-500/20 text-yellow-400';
                                                const priorityBadgeClass =
                                                  priority === 'high'
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : priority === 'medium'
                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'bg-green-500/20 text-green-400';
                                                return (
                                                  <div className="mt-2 p-4 rounded-xl bg-black border border-gray-800 text-left shadow-md max-w-md">
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <span className="text-white font-bold text-lg">{parsed.title}</span>
                                                      <span className={`ml-2 ${statusBadgeClass} inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                                                      <span className={`ml-2 ${priorityBadgeClass} inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold`}>{priority.charAt(0).toUpperCase() + priority.slice(1)} Priority</span>
                                                    </div>
                                                    <div className="text-gray-300 text-sm mb-2">{parsed.description}</div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                      <span className="text-gray-400 text-xs">Project:</span>
                                                      <span className="bg-purple-500/20 text-purple-400 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">{parsed.projectName}</span>
                                                    </div>
                                                    {parsed.due_date && (
                                                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                                                        <svg className="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        Due: {new Date(parsed.due_date).toLocaleDateString()}
                                                      </div>
                                                    )}
                                                    <a
                                                      href={`/task/${parsed.taskId}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="inline-block mt-2 px-3 py-1 bg-purple-700 text-white rounded hover:bg-purple-800 text-xs font-medium"
                                                    >
                                                      View Task Details
                                                    </a>
                                                  </div>
                                                );
                                              })()
                                            ) : isProjectCard ? (
                                              <div className="p-0">
                                                <div className="flex items-center bg-black border border-purple-500/50 rounded-xl p-6 shadow-md max-w-md">
                                                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-purple-900/40 flex items-center justify-center mr-6 overflow-hidden">
                                                    {parsed.thumbnail || parsed.image ? (
                                                      <img
                                                        src={parsed.thumbnail || parsed.image}
                                                        alt={parsed.name}
                                                        className="w-14 h-14 object-cover rounded-full"
                                                      />
                                                    ) : (
                                                      <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4a2 2 0 012-2h2a2 2 0 012 2v4m0 0h4m-4 0v-4m4 4v-4a2 2 0 012-2h2a2 2 0 012 2v4m0 0h-4m4 0v-4" /></svg>
                                                    )}
                                                  </div>
                                                  <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                      <span className="text-gray-300 text-lg font-semibold">{parsed.name}</span>
                                                      {parsed.status && (
                                                        <span className={`ml-2 border px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                          parsed.status.toLowerCase() === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                                                          parsed.status.toLowerCase() === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' :
                                                          parsed.status.toLowerCase() === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' :
                                                          parsed.status.toLowerCase() === 'on hold' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                                                          'bg-gray-500/20 text-gray-400 border-gray-500/50'
                                                        }`}>
                                                          {parsed.status.charAt(0).toUpperCase() + parsed.status.slice(1)}
                                                        </span>
                                                      )}
                                                    </div>
                                                    {parsed.description && (
                                                      <div className="text-gray-400 text-sm mb-2 line-clamp-2">{parsed.description}</div>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2">
                                                      {parsed.budget && (
                                                        <div className="text-sm text-gray-400">Budget: <span className="text-white font-bold">${Number(parsed.budget).toLocaleString()}</span></div>
                                                      )}
                                                      {parsed.progress !== undefined && (
                                                        <div className="flex items-center gap-2">
                                                          <span className="text-gray-400 text-sm">Progress:</span>
                                                          <span className="text-white font-bold">{parsed.progress}%</span>
                                                        </div>
                                                      )}
                                                      {parsed.deadline && (
                                                        <div className="text-sm text-gray-400">Deadline: <span className="text-white font-bold">{new Date(parsed.deadline).toLocaleDateString()}</span></div>
                                                      )}
                                                    </div>
                                                    <a
                                                      href={`/projects/${parsed.projectId}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="inline-block mt-4 text-purple-400 hover:underline text-xs font-medium"
                                                    >
                                                      View Project
                                                    </a>
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div>{msg.content}</div>
                                            )}
                                          </>
                                        )}
                                        {msg.sender_id === user?.id && !isEditing && (
                                          <>
                                            <Button size="icon" variant="ghost" className="ml-2" onClick={() => handleEditMessage(msg)}><Edit className="w-4 h-4" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDeleteMessage(msg)}><Trash2 className="w-4 h-4" /></Button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(msg.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-4">
                          <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 bg-gray-800 border-gray-700 text-white text-xs sm:text-base" onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                          <Button className="bg-gradient-to-r from-cyan-500 to-emerald-500 px-3 py-2 sm:px-4 sm:py-2" onClick={handleSendMessage}><Send className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ) : r.id === 'tasks' ? (
                      <div className="space-y-3">
                        <div className="space-y-4 h-[300px] sm:h-[400px] overflow-y-auto pr-2 sm:pr-4 bg-gray-900 rounded-lg p-2 sm:p-4">
                          {tasksLoading ? (
                            <div className="text-gray-400">Loading tasks...</div>
                          ) : projectTasks.length === 0 ? (
                            <div className="text-gray-400">No tasks found for this project.</div>
                          ) : (
                            projectTasks.map(task => (
                              <div
                                key={task.id}
                                className={`flex items-start gap-2 sm:gap-3 bg-gray-800/80 rounded-lg p-2 sm:p-3 mb-2 cursor-pointer hover:bg-gray-700 transition ${
                                  userAssignedTask?.id === task.id 
                                    ? 'border-2 border-blue-500 bg-blue-900/20' 
                                    : 'border border-gray-700'
                                }`}
                                onClick={() => router.push(`/task/${task.id}`)}
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="font-semibold text-white text-xs sm:text-base">{task.title}</div>
                                    {userAssignedTask?.id === task.id && (
                                      <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                                        Your Task
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-400">
                                    <span>Status: <span className="font-medium">{task.status}</span></span>
                                    <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '--'}</span>
                                    <span>Priority: <span className="font-medium">{task.priority}</span></span>
                                  </div>
                                                              {/* Show assigned users */}
                            {(task.assigned_to || (task.assigned_users && task.assigned_users.length > 0)) && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-gray-400">Assigned:</span>
                                {/* Show single assigned user (backward compatibility) */}
                                {task.assigned_to && !task.assigned_users?.length && (
                                  (() => {
                                    const member = teamMembers.find(m => m.user_id === task.assigned_to);
                                    return (
                                      <Badge key={`${task.assigned_to}-single`} className="text-xs bg-blue-600/20 text-blue-300 border-blue-500/30">
                                        {member?.user?.name || member?.user?.email || task.assigned_to}
                                      </Badge>
                                    );
                                  })()
                                )}
                                {/* Show multiple assigned users */}
                                {task.assigned_users && task.assigned_users.length > 0 && (
                                  task.assigned_users.map((userId: string, index: number) => {
                                    const member = teamMembers.find(m => m.user_id === userId);
                                    return (
                                      <Badge key={`${userId}-${index}`} className="text-xs bg-blue-600/20 text-blue-300 border-blue-500/30">
                                        {member?.user?.name || member?.user?.email || userId}
                                      </Badge>
                                    );
                                  })
                                )}
                              </div>
                            )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs px-2 py-1 bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openLinkTaskModal(task);
                                  }}
                                >
                                  <LinkIcon className="w-3 h-3 mr-1" />
                                  Link
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : r.id === 'notes' ? (
                      <div className="space-y-3">
                        {/* Project Notes */}
                        <div className="space-y-4 h-[200px] sm:h-[300px] overflow-y-auto pr-2 sm:pr-4 bg-gray-900 rounded-lg p-2 sm:p-4">
                          {notesLoading ? (
                            <div className="text-gray-400 text-center py-8">Loading notes...</div>
                          ) : projectNotes.length === 0 ? (
                            <div className="text-gray-400 text-center py-8">No notes yet. Create the first note!</div>
                          ) : (
                            projectNotes.map(note => (
                              <div key={note.id} className="flex items-start gap-2 sm:gap-3">
                                <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mt-1" />
                                <div className="flex-1">
                                  <div className="font-semibold text-white text-xs sm:text-sm">
                                    {note.user?.name || note.user?.email || 'Unknown'} 
                                    <span className="text-xs text-gray-400 ml-2">
                                      {new Date(note.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  {note.note_title && (
                                    <div className="text-sm font-medium text-blue-400 mb-1">
                                      {note.note_title}
                                    </div>
                                  )}
                                  <div className="text-gray-300 text-xs sm:text-base whitespace-pre-wrap">{note.content}</div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {(showNoteForm || newProjectNote.trim() || newProjectNoteTitle.trim()) && (
                          <div className="space-y-2 mt-2 sm:mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <Input 
                              placeholder="Note title (optional)" 
                              value={newProjectNoteTitle} 
                              onChange={e => setNewProjectNoteTitle(e.target.value)} 
                              className="bg-gray-900 border-gray-600 text-white text-xs sm:text-base" 
                            />
                            <div className="flex items-center gap-2">
                              <Input 
                                placeholder="Type a note..." 
                                value={newProjectNote} 
                                onChange={e => setNewProjectNote(e.target.value)} 
                                className="flex-1 bg-gray-900 border-gray-600 text-white text-xs sm:text-base" 
                              />
                              <Button 
                                onClick={handleCreateProjectNote}
                                disabled={!newProjectNote.trim() || creatingNote}
                                className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 sm:px-4 sm:py-2"
                              >
                                {creatingNote ? 'Creating...' : 'Send'}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setShowNoteForm(false);
                                  setNewProjectNote("");
                                  setNewProjectNoteTitle("");
                                }}
                                className="border-gray-600 text-gray-400 hover:text-white"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                        {!showNoteForm && !newProjectNote.trim() && !newProjectNoteTitle.trim() && (
                          <div className="text-center py-4">
                            <Button 
                              variant="outline"
                              onClick={() => setShowNoteForm(true)}
                              className="border-gray-600 text-gray-400 hover:text-white"
                            >
                              + Add Note
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : r.id === 'meetings' ? (
                      <div className="space-y-4">
                        {/* Zoom Authentication */}
                        {!zoomAuthenticated ? (
                          <div className="text-center py-8">
                            <div className="mb-4">
                              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-white" />
                              </div>
                              <h3 className="text-lg font-medium text-white mb-2">Connect Your Zoom Account</h3>
                              <p className="text-gray-400 mb-4">Sign in with your Zoom account to manage meetings</p>
                            </div>
                            <Button 
                              onClick={initiateZoomAuth}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Connect Zoom Account
                            </Button>
                          </div>
                        ) : (
                          <>
                            {/* Zoom User Info */}
                            <div className="flex items-center justify-between p-4 bg-blue-600/20 rounded-lg border border-blue-500/30">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="text-white font-medium">
                                    {zoomUser?.zoom_email || 'Zoom Account Connected'}
                                  </div>
                                  <div className="text-blue-300 text-sm">
                                    {zoomMeetings.length} meetings available
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setZoomAuthenticated(false);
                                  setZoomUser(null);
                                  setZoomMeetings([]);
                                }}
                                className="border-blue-500/30 text-blue-300 hover:bg-blue-600/20"
                              >
                                Disconnect
                              </Button>
                            </div>

                            {/* Create New Meeting */}
                            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                              <h4 className="text-white font-medium mb-3">Create New Meeting</h4>
                              <div className="space-y-3">
                                <Input
                                  placeholder="Meeting topic"
                                  value={newMeeting.topic}
                                  onChange={(e) => setNewMeeting({...newMeeting, topic: e.target.value})}
                                  className="bg-gray-900 border-gray-600 text-white"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <Input
                                    type="datetime-local"
                                    value={newMeeting.start_time}
                                    onChange={(e) => setNewMeeting({...newMeeting, start_time: e.target.value})}
                                    className="bg-gray-900 border-gray-600 text-white"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Duration (minutes)"
                                    value={newMeeting.duration}
                                    onChange={(e) => setNewMeeting({...newMeeting, duration: parseInt(e.target.value) || 60})}
                                    className="bg-gray-900 border-gray-600 text-white"
                                  />
                                </div>
                                <Button 
                                  onClick={createZoomMeeting}
                                  disabled={!newMeeting.topic.trim() || !newMeeting.start_time || creatingMeeting}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {creatingMeeting ? 'Creating...' : 'Create Meeting'}
                                </Button>
                              </div>
                            </div>

                            {/* Meetings List */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-white font-medium">Your Meetings</h4>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={fetchZoomMeetings}
                                  disabled={zoomLoading}
                                  className="border-gray-600 text-gray-400 hover:text-white"
                                >
                                  {zoomLoading ? 'Loading...' : 'Refresh'}
                                </Button>
                              </div>
                              
                              {zoomLoading ? (
                                <div className="text-center py-8">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                                  <p className="text-gray-400 mt-2">Loading meetings...</p>
                                </div>
                              ) : zoomMeetings.length === 0 ? (
                                <div className="text-center py-8">
                                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                  <p className="text-gray-400">No meetings found</p>
                                </div>
                              ) : (
                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                  {zoomMeetings.map((meeting) => (
                                    <div key={meeting.id} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h5 className="text-white font-medium mb-1">{meeting.topic}</h5>
                                          <div className="text-sm text-gray-400 space-y-1">
                                            <div>ID: {meeting.id}</div>
                                            <div>Start: {new Date(meeting.start_time).toLocaleString()}</div>
                                            <div>Duration: {meeting.duration} minutes</div>
                                            {meeting.password && <div>Password: {meeting.password}</div>}
                                          </div>
                                        </div>
                                        <div className="flex flex-col gap-2 ml-4">
                                          <Button 
                                            size="sm"
                                            onClick={() => joinZoomMeeting(meeting.id, meeting.password)}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                          >
                                            Join
                                          </Button>
                                          <Button 
                                            size="sm"
                                            variant="outline"
                                            onClick={() => deleteZoomMeeting(meeting.id)}
                                            className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : r.id === 'files' ? (
                      <div className="space-y-4">
                        {/* File Submission Form */}
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                          <h4 className="text-white font-medium mb-3">Submit File for Project</h4>
                          <div className="space-y-3">
                            <Input
                              placeholder="File title"
                              value={fileSubmission.title}
                              onChange={(e) => setFileSubmission({...fileSubmission, title: e.target.value})}
                              className="bg-gray-900 border-gray-600 text-white"
                            />
                            <Textarea
                              placeholder="Description (optional)"
                              value={fileSubmission.description}
                              onChange={(e) => setFileSubmission({...fileSubmission, description: e.target.value})}
                              className="bg-gray-900 border-gray-600 text-white"
                              rows={2}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <Label className="text-gray-300 text-sm">File Description (Optional)</Label>
                                <Textarea
                                  placeholder="Add a description or note about this file"
                                  value={fileSubmission.description}
                                  onChange={(e) => setFileSubmission({...fileSubmission, description: e.target.value})}
                                  className="bg-gray-900 border-gray-600 text-white"
                                  rows={2}
                                />
                              </div>
                              <div>
                                <Label className="text-gray-300 text-sm">Link to Task (Optional)</Label>
                                <Select 
                                  value={fileSubmission.task_id || 'none'} 
                                  onValueChange={(value) => setFileSubmission({...fileSubmission, task_id: value === 'none' ? null : value})}
                                >
                                  <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                                    <SelectValue placeholder="Select a task" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">No task</SelectItem>
                                    {projectTasks.map(task => (
                                      <SelectItem key={task.id} value={task.id}>
                                        {task.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
                              <Input
                                type="file"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="file-upload"
                              />
                              <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center justify-center"
                              >
                                {selectedFile ? (
                                  <div className="flex items-center">
                                    <FileText className="w-6 h-6 text-blue-400 mr-2" />
                                    <span className="text-white">{selectedFile.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="ml-2"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedFile(null);
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-400">
                                      Click to select a file or drag and drop
                                    </p>
                                  </>
                                )}
                              </label>
                            </div>
                            <Button 
                              onClick={handleFileSubmission}
                              disabled={!selectedFile || !fileSubmission.title.trim() || submittingFile}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {submittingFile ? 'Submitting...' : 'Submit File'}
                            </Button>
                          </div>
                        </div>

                        {/* Submissions List */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-white font-medium">Project Submissions</h4>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowSubmissions(!showSubmissions)}
                                className="text-gray-400 hover:text-white"
                              >
                                {showSubmissions ? 'Hide' : 'Show'} ({projectSubmissions.length})
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={fetchProjectSubmissions}
                                disabled={submissionsLoading}
                                className="border-gray-600 text-gray-400 hover:text-white"
                              >
                                {submissionsLoading ? 'Loading...' : 'Refresh'}
                              </Button>
                            </div>
                          </div>
                          
                          {showSubmissions && (
                            <>
                              {submissionsLoading ? (
                            <div className="text-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                              <p className="text-gray-400 mt-2">Loading submissions...</p>
                            </div>
                          ) : projectSubmissions.length === 0 ? (
                            <div className="text-center py-8">
                              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-400">No submissions yet</p>
                            </div>
                          ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                              {projectSubmissions.map((submission) => (
                                <div key={submission.id} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h5 className="text-white font-medium">{submission.name}</h5>
                                        <Badge className="text-xs">
                                          {submission.type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                        </Badge>
                                        {submission.custom_label && (
                                          <Badge variant="outline" className="text-xs bg-blue-600/20 text-blue-300">
                                            {submission.custom_label}
                                          </Badge>
                                        )}
                                        {submission.task && (
                                          <Badge variant="outline" className="text-xs bg-green-600/20 text-green-300">
                                            Task: {submission.task.title}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-400 space-y-1">
                                        <div>File: {submission.storage_name}</div>
                                        <div>Size: {(submission.size / 1024 / 1024).toFixed(2)} MB</div>
                                        <div>Submitted by: {submission.user?.name || submission.user?.email || 'Unknown'}</div>
                                        <div>Date: {new Date(submission.created_at).toLocaleString()}</div>
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2 ml-4">
                                      <Button 
                                        size="sm"
                                        onClick={() => downloadSubmission(submission)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        Download
                                      </Button>
                                      {(user?.id === submission.user_id || user?.id === currentProject?.owner_id) && (
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          onClick={() => deleteSubmission(submission.id, submission.storage_name)}
                                          className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                                        >
                                          Delete
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Comments/Threads for other tabs */}
                        <div className="space-y-4 h-[200px] sm:h-[300px] overflow-y-auto pr-2 sm:pr-4 bg-gray-900 rounded-lg p-2 sm:p-4">
                          {mockComments.map(c => (
                            <div key={c.id} className="flex items-start gap-2 sm:gap-3">
                              <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 mt-1" />
                              <div>
                                <div className="font-semibold text-white text-xs sm:text-sm">{c.user} <span className="text-xs text-gray-400 ml-2">{c.time}</span></div>
                                <div className="text-gray-300 text-xs sm:text-base">{c.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2 sm:mt-4">
                          <Input placeholder="Type a comment..." value={comment} onChange={e => setComment(e.target.value)} className="flex-1 bg-gray-800 border-gray-700 text-white text-xs sm:text-base" />
                          <Button className="bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 sm:px-4 sm:py-2">Send</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
          {/* Project Timeline */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <Flag className="w-5 h-5 mr-2" /> Project Timeline
              </CardTitle>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle>Add Timeline Item</DialogTitle>
                    <DialogDescription>
                      Create a new timeline item for this project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={newTimelineItem.type} onValueChange={(value) => setNewTimelineItem({...newTimelineItem, type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="objective">Objective</SelectItem>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="plan">Plan</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="deliverable">Deliverable</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={newTimelineItem.title}
                        onChange={(e) => setNewTimelineItem({...newTimelineItem, title: e.target.value})}
                        placeholder="Enter title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newTimelineItem.description}
                        onChange={(e) => setNewTimelineItem({...newTimelineItem, description: e.target.value})}
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={newTimelineItem.due_date}
                        onChange={(e) => setNewTimelineItem({...newTimelineItem, due_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={newTimelineItem.status} onValueChange={(value) => setNewTimelineItem({...newTimelineItem, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="delayed">Delayed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="progress">Progress (%)</Label>
                      <Input
                        id="progress"
                        type="number"
                        min="0"
                        max="100"
                        value={newTimelineItem.progress}
                        onChange={(e) => setNewTimelineItem({...newTimelineItem, progress: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label>Assignees</Label>
                      <div className="flex flex-col gap-2">
                        {/* Team member checkboxes */}
                        {teamMembers && teamMembers.length > 0 && Array.from(new Map(teamMembers.map(tm => [tm.user_id, tm])).values()).map((tm, idx) => (
                          <label key={tm.user_id + '-' + idx} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={newAssignees.includes(tm.user?.name || tm.user?.email || '')}
                              onChange={e => {
                                const name = tm.user?.name || tm.user?.email || '';
                                setNewAssignees(
                                  e.target.checked
                                    ? [...newAssignees, name]
                                    : newAssignees.filter(n => n !== name)
                                );
                              }}
                            />
                            {tm.user?.name || tm.user?.email}
                          </label>
                        ))}
                        {/* Custom name input */}
                        <div className="flex gap-2">
                          <Input
                            value={newCustomAssignee}
                            onChange={e => setNewCustomAssignee(e.target.value)}
                            placeholder="Add custom assignee"
                          />
                          <Button
                            type="button"
                            onClick={() => {
                              if (newCustomAssignee && !newAssignees.includes(newCustomAssignee)) {
                                setNewAssignees([...newAssignees, newCustomAssignee]);
                                setNewCustomAssignee('');
                              }
                            }}
                          >
                            Add
                          </Button>
                        </div>
                        {/* Show selected assignees */}
                        <div>
                                                  {newAssignees.map((name: string) => (
                          <Badge key={name} className="mr-1">{name}</Badge>
                        ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTimelineItem}>
                      Create Item
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="text-gray-400">Loading timeline...</div>
              ) : timeline.length === 0 ? (
                <div className="text-gray-400">No timeline items found.</div>
              ) : (
                <div>
                  {timeline.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-4 mb-6">
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.status === 'completed' ? 'bg-green-500/20 border-2 border-green-500' :
                          item.status === 'in_progress' ? 'bg-blue-500/20 border-2 border-blue-500' :
                          'bg-gray-500/20 border-2 border-gray-500'
                        }`}>
                          {item.type === 'milestone' && <Flag className={`w-5 h-5 ${
                            item.status === 'completed' ? 'text-green-400' :
                            item.status === 'in_progress' ? 'text-blue-400' :
                            'text-gray-400'
                          }`} />}
                          {item.type === 'objective' && <Target className={`w-5 h-5 ${
                            item.status === 'completed' ? 'text-green-400' :
                            item.status === 'in_progress' ? 'text-blue-400' :
                            'text-gray-400'
                          }`} />}
                          {item.type === 'task' && <CheckCircle className={`w-5 h-5 ${
                            item.status === 'completed' ? 'text-green-400' :
                            item.status === 'in_progress' ? 'text-blue-400' :
                            'text-gray-400'
                          }`} />}
                          {item.type === 'deadline' && <AlertCircle className={`w-5 h-5 ${
                            item.status === 'completed' ? 'text-green-400' :
                            item.status === 'in_progress' ? 'text-blue-400' :
                            'text-gray-400'
                          }`} />}
                        </div>
                        {index < timeline.length - 1 && (
                          <div className="w-1 h-12 bg-gray-700 mx-auto"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <Link href={`/workmode/timeline/${item.id}`} className="font-bold text-white text-lg hover:underline">
                            {item.title}
                          </Link>
                          <div className="flex items-center gap-2">
                            {item.status === 'completed' && <Badge className="bg-green-700/80 text-white">Completed</Badge>}
                            {item.status === 'in_progress' && <Badge className="bg-blue-700/80 text-white">In Progress</Badge>}
                            {item.status === 'upcoming' && <Badge className="bg-gray-700/80 text-white">Upcoming</Badge>}
                            {item.status === 'delayed' && <Badge className="bg-red-700/80 text-white">Delayed</Badge>}
                            {item.status === 'in_progress' && item.due_date && (
                              <Badge className="bg-red-700/80 text-white ml-2">Due {new Date(item.due_date).toLocaleDateString()}</Badge>
                            )}
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 hover:bg-blue-500/20 hover:text-blue-400"
                                onClick={() => openEditModal(item)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 hover:bg-red-500/20 hover:text-red-400"
                                    onClick={() => openDeleteModal(item)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-gray-900 border-gray-700">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Timeline Item</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{item.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteTimelineItem}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-300 text-sm mb-1">{item.description}</div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-400 text-xs"><Calendar className="inline w-4 h-4 mr-1" />{item.due_date ? new Date(item.due_date).toLocaleDateString() : '--'}</span>
                          {item.assignee_name && <span className="text-gray-400 text-xs"><Users className="inline w-4 h-4 mr-1" />{item.assignee_name}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {typeof item.progress === 'number' && (
                            <>
                              <span className="text-xs text-gray-400">{item.progress}%</span>
                              <div className="w-24 bg-gray-700 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all duration-300 ${
                                  item.status === 'completed' ? 'bg-green-500' :
                                  item.status === 'in_progress' ? 'bg-blue-500' :
                                  'bg-gray-500'
                                }`} style={{ width: `${item.progress}%` }}></div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Timeline Overview */}
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                      <span>Timeline Overview</span>
                      <span>{timeline.filter(item => item.status === 'completed').length}/{timeline.length} completed</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(timeline.filter(item => item.status === 'completed').length / timeline.length) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Activity className="w-5 h-5 mr-2" />Activity Feed</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {activities.length === 0 ? (
                <div className="text-gray-400">No recent activity.</div>
              ) : (
                activities.map(a => (
                  <div key={a.id} className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-white">{a.user?.name || a.user?.email || a.user_id}</span>
                    <span className="text-gray-300">{a.description}</span>
                    <span className="text-xs text-gray-400 ml-2">{a.created_at ? new Date(a.created_at).toLocaleTimeString() : ''}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Timeline Item Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle>Edit Timeline Item</DialogTitle>
            <DialogDescription>
              Update the timeline item details.
            </DialogDescription>
          </DialogHeader>
          {editingTimelineItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-type">Type</Label>
                <Select value={editingTimelineItem.type} onValueChange={(value) => setEditingTimelineItem({...editingTimelineItem, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="objective">Objective</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="plan">Plan</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deliverable">Deliverable</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={editingTimelineItem.title}
                  onChange={(e) => setEditingTimelineItem({...editingTimelineItem, title: e.target.value})}
                  placeholder="Enter title"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTimelineItem.description}
                  onChange={(e) => setEditingTimelineItem({...editingTimelineItem, description: e.target.value})}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <Label htmlFor="edit-due_date">Due Date</Label>
                <Input
                  id="edit-due_date"
                  type="date"
                  value={editingTimelineItem.due_date || ''}
                  onChange={(e) => setEditingTimelineItem({...editingTimelineItem, due_date: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editingTimelineItem.status} onValueChange={(value) => setEditingTimelineItem({...editingTimelineItem, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="plan">Plan</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="deliverable">Deliverable</SelectItem>
                    <SelectItem value="research">Research</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-progress">Progress (%)</Label>
                <Input
                  id="edit-progress"
                  type="number"
                  min="0"
                  max="100"
                  value={editingTimelineItem.progress}
                  onChange={(e) => setEditingTimelineItem({...editingTimelineItem, progress: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Assignees</Label>
                <div className="flex flex-col gap-2">
                  {/* Team member checkboxes */}
                  {teamMembers && teamMembers.length > 0 && Array.from(new Map(teamMembers.map(tm => [tm.user_id, tm])).values()).map((tm, idx) => (
                    <label key={tm.user_id + '-' + idx} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editAssignees.includes(tm.user?.name || tm.user?.email || '')}
                        onChange={e => {
                          const name = tm.user?.name || tm.user?.email || '';
                          setEditAssignees(
                            e.target.checked
                              ? [...editAssignees, name]
                              : editAssignees.filter(n => n !== name)
                          );
                        }}
                      />
                      {tm.user?.name || tm.user?.email}
                    </label>
                  ))}
                  {/* Custom name input */}
                  <div className="flex gap-2">
                    <Input
                      value={editCustomAssignee}
                      onChange={e => setEditCustomAssignee(e.target.value)}
                      placeholder="Add custom assignee"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        if (editCustomAssignee && !editAssignees.includes(editCustomAssignee)) {
                          setEditAssignees([...editAssignees, editCustomAssignee]);
                          setEditCustomAssignee('');
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {/* Show selected assignees */}
                  <div>
                    {editAssignees.map(name => (
                      <Badge key={name} className="mr-1">{name}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTimelineItem}>
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Task to Timeline Modal */}
      <Dialog open={linkTaskModalOpen} onOpenChange={setLinkTaskModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle>Link Task to Timeline</DialogTitle>
            <DialogDescription>
              Select a timeline item to link the task "{selectedTaskForLinking?.title}" to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {timeline.length === 0 ? (
              <div className="text-gray-400 text-center py-4">
                No timeline items available. Create a timeline item first.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {timeline.map((timelineItem) => (
                  <div
                    key={timelineItem.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => linkTaskToTimeline(selectedTaskForLinking?.id, timelineItem.id)}
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
                      {timelineItem.type === 'other' && <MoreIcon className="w-4 h-4 text-gray-400" />}
                      <div>
                        <div className="font-medium text-white">{timelineItem.title}</div>
                        <div className="text-sm text-gray-400">{timelineItem.type}</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs">
                      <LinkIcon className="w-3 h-3 mr-1" />
                      Link
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkTaskModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Task Modal */}
      <Dialog open={isNewTaskModalOpen} onOpenChange={setIsNewTaskModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task for the current project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Enter task title"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Enter task description"
              />
            </div>
            <div>
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={newTask.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewTask({...newTask, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-status">Status</Label>
              <Select value={newTask.status} onValueChange={(value: 'pending' | 'in_progress' | 'completed') => setNewTask({...newTask, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
                          <div>
                <Label>Assign to Team Members (Optional)</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-700 rounded-md p-2">
                  {teamMembers.length === 0 ? (
                    <div className="text-gray-400 text-sm">No team members found</div>
                  ) : (
                    teamMembers.map((member, index) => (
                      <label key={`${member.user_id}-${index}`} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTask.assigned_users.includes(member.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTask({
                                ...newTask,
                                assigned_users: [...newTask.assigned_users, member.user_id]
                              });
                            } else {
                              setNewTask({
                                ...newTask,
                                assigned_users: newTask.assigned_users.filter(id => id !== member.user_id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-white">
                          {member.user?.name || member.user?.email || member.user_id}
                        </span>
                      </label>
                    ))
                  )}
                </div>
                {newTask.assigned_users.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-400">Assigned to: </span>
                    {newTask.assigned_users.map((userId, index) => {
                      const member = teamMembers.find(m => m.user_id === userId);
                      return (
                        <Badge key={`${userId}-${index}`} className="mr-1 text-xs">
                          {member?.user?.name || member?.user?.email || userId}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Search for users by email to add them to the team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="search-email">Search by Email</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search-email"
                  placeholder="Enter email address..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.length >= 2) {
                      searchUsers(e.target.value);
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Search Results */}
            {searching && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Searching...</p>
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <Label className="text-sm font-medium">Search Results</Label>
                {searchResults.map((user) => {
                  const isAlreadyMember = teamMembers.some(member => member.user_id === user.id);
                  return (
                    <div
                      key={user.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        isAlreadyMember
                          ? 'border-gray-600 bg-gray-700/30 cursor-not-allowed opacity-60'
                          : selectedUser?.id === user.id
                          ? 'border-blue-500 bg-blue-500/10 cursor-pointer'
                          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer'
                      }`}
                      onClick={() => !isAlreadyMember && setSelectedUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">
                          {user.name?.[0] || user.email[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {user.name || 'No name'}
                          </div>
                          <div className="text-sm text-gray-400 truncate">
                            {user.email}
                          </div>
                          {isAlreadyMember && (
                            <div className="text-xs text-yellow-400 mt-1">
                              Already a team member
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isAlreadyMember && (
                            <Badge variant="outline" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                              Member
                            </Badge>
                          )}
                          {selectedUser?.id === user.id && !isAlreadyMember && (
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-4">
                <p className="text-gray-400">No users found</p>
              </div>
            )}

            {/* Role Selection */}
            {selectedUser && (
              <div className="space-y-2">
                <Label htmlFor="role-select">Role</Label>
                <Select value={selectedRole} onValueChange={(value: 'lead' | 'member' | 'advisor' | 'consultant') => setSelectedRole(value)}>
                  <SelectTrigger id="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="advisor">Advisor</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selected User Display */}
            {selectedUser && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
                    {selectedUser.name?.[0] || selectedUser.email[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium text-white">
                      {selectedUser.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {selectedUser.email}
                    </div>
                    <div className="text-xs text-blue-400">
                      Role: {selectedRole}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddMemberModalOpen(false)}
              disabled={addingMember}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUser || addingMember}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {addingMember ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Upload Modal */}
      <Dialog open={isFileUploadModalOpen} onOpenChange={setIsFileUploadModalOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Project File</DialogTitle>
            <DialogDescription>
              Upload a new file to the project. Files are accessible to all team members (Level 1 access).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-title">File Title *</Label>
              <Input
                id="file-title"
                placeholder="Enter file title"
                value={fileSubmission.title}
                onChange={(e) => setFileSubmission({...fileSubmission, title: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="file-description">Description (Optional)</Label>
              <Textarea
                id="file-description"
                placeholder="Add a description or note about this file"
                value={fileSubmission.description}
                onChange={(e) => setFileSubmission({...fileSubmission, description: e.target.value})}
                className="bg-gray-800 border-gray-600 text-white"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="file-task">Link to Task (Optional)</Label>
              <Select 
                value={fileSubmission.task_id || 'none'} 
                onValueChange={(value) => setFileSubmission({...fileSubmission, task_id: value === 'none' ? null : value})}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No task</SelectItem>
                  {projectTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file-upload">Select File *</Label>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 mt-2">
                <Input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center"
                >
                  {selectedFile ? (
                    <div className="flex items-center">
                      <FileText className="w-6 h-6 text-blue-400 mr-2" />
                      <span className="text-white">{selectedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-400">
                        Click to select a file or drag and drop
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFileUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleFileSubmission}
              disabled={!selectedFile || !fileSubmission.title.trim() || submittingFile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submittingFile ? 'Uploading...' : 'Upload File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TODO: Integrate real data, subscriptions, and actions for presence, sessions, rooms, comments, and activity. */}
    </div>
  )
} 

export default function WorkModePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading workspace...</p>
        </div>
      </div>
    }>
      <WorkModeContent />
    </Suspense>
  )
}

function ActiveSessionsCard({ projectId, teamMembers, refreshTeamMembers }: { projectId: string | undefined, teamMembers: any[], refreshTeamMembers: () => void }) {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [clockingIn, setClockingIn] = useState(false)
  const [clockingOut, setClockingOut] = useState(false)
  const { user } = useAuth();

  useEffect(() => {
    if (!projectId) return;
    setLoading(true)
    supabase
      .from('work_sessions')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'active')
      .then(({ data, error }) => {
        setSessions(data || [])
        setLoading(false)
      })
  }, [projectId, clockingIn, clockingOut])

  const hasActiveSession = !!user && sessions.some(s => s.user_id === user.id)
  const mySession = user ? sessions.find(s => s.user_id === user.id) : null

  const handleClockIn = async () => {
    if (!user || !projectId) return;
    setClockingIn(true)
    await supabase.from('work_sessions').insert({
      user_id: user.id,
      project_id: projectId,
      session_type: 'focused',
      status: 'active',
      start_time: new Date().toISOString(),
    })
    await supabase.from('users').update({ status: 'online' }).eq('id', user.id)
    setClockingIn(false)
    refreshTeamMembers()
  }

  const handleClockOut = async () => {
    if (!user || !mySession) return;
    setClockingOut(true)
    await supabase.from('work_sessions').update({
      status: 'completed',
      end_time: new Date().toISOString(),
    }).eq('id', mySession.id)
    await supabase.from('users').update({ status: 'offline' }).eq('id', user.id)
    setClockingOut(false)
    refreshTeamMembers()
  }

  return (
    <Card className="leonardo-card border-gray-800">
      <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Clock className="w-5 h-5 mr-2" />Active Sessions</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-gray-400">No active sessions</div>
        ) : (
          sessions.map(s => {
            const member = teamMembers.find(m => m.user_id === s.user_id)
            return (
              <div key={s.id} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="font-medium text-white">{member?.user?.name || member?.user?.email || s.user_id}</span>
                <Badge className="ml-2 bg-gray-700 text-gray-200">{s.session_type}</Badge>
                <span className="text-xs text-gray-400 ml-2">since {s.start_time ? new Date(s.start_time).toLocaleTimeString() : ''}</span>
              </div>
            )
          })
        )}
        {hasActiveSession ? (
          <Button size="sm" className="mt-2 w-full bg-gradient-to-r from-red-500 to-pink-500" onClick={handleClockOut} disabled={clockingOut}>
            {clockingOut ? 'Clocking Out...' : 'Clock Out'}
          </Button>
        ) : (
          <Button size="sm" className="mt-2 w-full bg-gradient-to-r from-green-500 to-emerald-500" onClick={handleClockIn} disabled={clockingIn}>
            {clockingIn ? 'Clocking In...' : 'Clock In'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
} 
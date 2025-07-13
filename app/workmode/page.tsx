"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Users, Clock, MessageCircle, FileText, StickyNote, FolderKanban, CheckCircle, Activity, Plus, RefreshCw, Target, Calendar, TrendingUp, Download, Eye, MoreHorizontal, Flag, Zap, AlertCircle, Crown, Code, Palette, Shield, Server } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { useTeamMembers } from "@/hooks/useTeamMembers"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select"
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, Edit, Trash2, Save, X } from 'lucide-react'
import { useRouter } from "next/navigation"

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

const mockTeamRoles = [
  {
    id: 1,
    name: "Alice Johnson",
    role: "Project Manager",
    avatar: "AJ",
    status: "online",
    responsibilities: ["Project planning", "Team coordination", "Client communication"],
    skills: ["Agile", "Scrum", "Leadership"],
    availability: "Full-time",
    joinedDate: "2024-10-01"
  },
  {
    id: 2,
    name: "Bob Smith",
    role: "Backend Developer",
    avatar: "BS",
    status: "away",
    responsibilities: ["Database design", "API development", "Server maintenance"],
    skills: ["Node.js", "PostgreSQL", "Docker"],
    availability: "Full-time",
    joinedDate: "2024-10-05"
  },
  {
    id: 3,
    name: "Charlie Davis",
    role: "Frontend Developer",
    avatar: "CD",
    status: "online",
    responsibilities: ["UI/UX design", "Frontend development", "User testing"],
    skills: ["React", "TypeScript", "Figma"],
    availability: "Full-time",
    joinedDate: "2024-10-10"
  },
  {
    id: 4,
    name: "Diana Wilson",
    role: "QA Engineer",
    avatar: "DW",
    status: "offline",
    responsibilities: ["Testing", "Bug reporting", "Quality assurance"],
    skills: ["Jest", "Cypress", "Manual Testing"],
    availability: "Part-time",
    joinedDate: "2024-10-15"
  },
  {
    id: 5,
    name: "Eve Brown",
    role: "DevOps Engineer",
    avatar: "EB",
    status: "online",
    responsibilities: ["Deployment", "Infrastructure", "CI/CD"],
    skills: ["AWS", "Kubernetes", "Jenkins"],
    availability: "Full-time",
    joinedDate: "2024-10-20"
  }
]

export default function WorkModePage() {
  const [activeRoom, setActiveRoom] = useState("general")
  const [comment, setComment] = useState("")
  const { user, loading: userLoading } = useAuth()
  const { projects, loading: projectsLoading } = useProjects(user?.id)
  const [currentFocusId, setCurrentFocusId] = useState<string | null>(null)
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

  // Pick first project as default if none selected
  useEffect(() => {
    if (!currentFocusId && projects && projects.length > 0) {
      setCurrentFocusId(projects[0].id)
    }
  }, [projects, currentFocusId])

  const currentProject = projects.find(p => p.id === currentFocusId) || projects[0]
  const { teamMembers } = useTeamMembers(currentProject?.id || "")

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

  // Fetch project files for the current project
  useEffect(() => {
    if (!currentProject?.id) return;
    setFilesLoading(true);
    const fetchFiles = async () => {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });
      setProjectFiles(data || []);
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
      setProjectNotes(data || []);
      setNotesLoading(false);
    };
    fetchNotes();
  }, [currentProject?.id]);

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

  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-5xl mx-auto py-4 px-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold flex items-center">
              <Activity className="w-6 h-6 text-green-400 mr-2" />
              Work Mode
            </h1>
            <Badge className="bg-green-800/30 text-green-300 border-green-700">Live Collaboration</Badge>
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
      <main className="max-w-5xl mx-auto py-6 px-4 grid grid-cols-12 gap-6">
        {/* Left sidebar: Project Focus, Presence & Sessions */}
        <div className="col-span-12 md:col-span-3 space-y-4">
          {/* Current Project Focus */}
          <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-500/10 to-purple-500/10">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center text-blue-400">
                <Target className="w-5 h-5 mr-2" /> Current Focus
              </CardTitle>
              {projects.length > 1 && (
                <span className="text-xs text-blue-300 cursor-pointer" onClick={e => {
                  e.stopPropagation();
                  const el = document.getElementById('focus-project-select');
                  if (el) el.focus();
                }}>Change</span>
              )}
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
                      <Select value={currentFocusId || ''} onValueChange={setCurrentFocusId}>
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

          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Users className="w-5 h-5 mr-2" />Live Users</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockUsers.map(u => (
                <div key={u.id} className="flex items-center gap-2">
                  <User className={`w-4 h-4 ${u.status === 'online' ? 'text-green-400' : u.status === 'away' ? 'text-yellow-400' : 'text-gray-400'}`} />
                  <span className="font-medium text-white">{u.name}</span>
                  <Badge className={`ml-2 ${u.status === 'online' ? 'bg-green-500/20 text-green-400' : u.status === 'away' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>{u.status}</Badge>
                  {u.clockedIn && <Badge className="ml-2 bg-blue-500/20 text-blue-400">Clocked In</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Clock className="w-5 h-5 mr-2" />Active Sessions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockSessions.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="font-medium text-white">{s.user}</span>
                  <Badge className="ml-2 bg-gray-700 text-gray-200">{s.type}</Badge>
                  <span className="text-xs text-gray-400 ml-2">since {s.since}</span>
                </div>
              ))}
              <Button size="sm" className="mt-2 w-full bg-gradient-to-r from-green-500 to-emerald-500">Clock In</Button>
            </CardContent>
          </Card>

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
                <Button size="sm" variant="outline" className="border-gray-700 text-xs">
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
              <Button size="sm" variant="outline" className="w-full mt-2 border-gray-700 text-gray-300 hover:text-white">
                View All Files
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
                <span className="text-sm text-gray-400">{mockTeamRoles.length} team members</span>
                <Button size="sm" variant="outline" className="border-gray-700 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Member
                </Button>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {mockTeamRoles.map(member => (
                  <div key={member.id} className="p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          member.status === 'online' ? 'bg-green-500/20 text-green-400 border border-green-500/50' :
                          member.status === 'away' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                        }`}>
                          {member.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{member.name}</div>
                          <div className="flex items-center gap-2">
                            {member.role === 'Project Manager' && <Crown className="w-3 h-3 text-yellow-400" />}
                            {member.role === 'Backend Developer' && <Code className="w-3 h-3 text-blue-400" />}
                            {member.role === 'Frontend Developer' && <Palette className="w-3 h-3 text-purple-400" />}
                            {member.role === 'QA Engineer' && <Shield className="w-3 h-3 text-green-400" />}
                            {member.role === 'DevOps Engineer' && <Server className="w-3 h-3 text-orange-400" />}
                            <span className="text-xs text-gray-300">{member.role}</span>
                            <Badge className={`text-xs ${
                              member.status === 'online' ? 'bg-green-500/20 text-green-400' :
                              member.status === 'away' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {member.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Badge className={`text-xs ${
                        member.availability === 'Full-time' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {member.availability}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Responsibilities:</div>
                        <div className="flex flex-wrap gap-1">
                          {member.responsibilities.slice(0, 2).map((resp, index) => (
                            <Badge key={index} className="bg-gray-700 text-gray-300 text-xs">
                              {resp}
                            </Badge>
                          ))}
                          {member.responsibilities.length > 2 && (
                            <Badge className="bg-gray-700 text-gray-300 text-xs">
                              +{member.responsibilities.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Skills:</div>
                        <div className="flex flex-wrap gap-1">
                          {member.skills.slice(0, 2).map((skill, index) => (
                            <Badge key={index} className="bg-blue-500/20 text-blue-400 text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {member.skills.length > 2 && (
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                              +{member.skills.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-2">
                      Joined {new Date(member.joinedDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="w-full mt-2 border-gray-700 text-gray-300 hover:text-white">
                View Full Team
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* Main content: Rooms, Comments, Activity */}
        <div className="col-span-12 md:col-span-9 space-y-6">
          <Tabs value={activeRoom} onValueChange={setActiveRoom} className="w-full">
            <TabsList className="flex gap-2 bg-gray-800/50">
              {mockRooms.map(r => (
                <TabsTrigger key={r.id} value={r.id} className="flex items-center gap-1">{r.icon}{r.name}</TabsTrigger>
              ))}
            </TabsList>
            {mockRooms.map(r => (
              <TabsContent key={r.id} value={r.id} className="pt-4">
                <Card className="leonardo-card border-gray-800 mb-4">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center">{r.icon}{r.name} Room</CardTitle>
                    <Button size="sm" variant="outline" className="border-gray-700">+ New {r.name === 'Files' ? 'File' : r.name === 'Notes' ? 'Note' : r.name === 'Tasks' ? 'Task' : 'Message'}</Button>
                  </CardHeader>
                  <CardContent>
                    {r.id === 'general' ? (
                      <div className="space-y-3">
                        {/* Group Chat Selector */}
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-300 mb-1">Select Group Chat</label>
                          <select
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
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
                        <div className="space-y-4 h-[400px] overflow-y-auto pr-4 bg-gray-900 rounded-lg p-4">
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
                                <div key={msg.id} className={`flex items-start gap-3 ${msg.sender_id === user?.id ? 'justify-end' : ''}`}>
                                  {msg.sender_id !== user?.id && (
                                    <Avatar className="w-8 h-8">
                                      <AvatarImage src={msg.sender?.avatar_url || undefined} />
                                      <AvatarFallback>{msg.sender?.name ? msg.sender.name[0] : '?'}</AvatarFallback>
                                    </Avatar>
                                  )}
                                  <div>
                                    <div className={`px-4 py-2 rounded-lg ${isTaskCard || isProjectCard ? 'bg-transparent' : (msg.sender_id === user?.id ? 'bg-cyan-700/80 text-white' : 'bg-gray-800/80 text-gray-100')}`}> 
                                      <span className="font-medium">{msg.sender?.name || 'Unknown'}</span>
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
                        <div className="flex items-center gap-2 mt-4">
                          <Input placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 bg-gray-800 border-gray-700 text-white" onKeyDown={e => e.key === 'Enter' && handleSendMessage()} />
                          <Button className="bg-gradient-to-r from-cyan-500 to-emerald-500" onClick={handleSendMessage}><Send className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ) : r.id === 'tasks' ? (
                      <div className="space-y-3">
                        <div className="space-y-4 h-[400px] overflow-y-auto pr-4 bg-gray-900 rounded-lg p-4">
                          {tasksLoading ? (
                            <div className="text-gray-400">Loading tasks...</div>
                          ) : projectTasks.length === 0 ? (
                            <div className="text-gray-400">No tasks found for this project.</div>
                          ) : (
                            projectTasks.map(task => (
                              <div
                                key={task.id}
                                className="flex items-start gap-3 bg-gray-800/80 rounded-lg p-3 mb-2 cursor-pointer hover:bg-gray-700 transition"
                                onClick={() => router.push(`/task/${task.id}`)}
                              >
                                <div className="flex-1">
                                  <div className="font-semibold text-white text-base">{task.title}</div>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                    <span>Status: <span className="font-medium">{task.status}</span></span>
                                    <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '--'}</span>
                                    <span>Priority: <span className="font-medium">{task.priority}</span></span>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : r.id === 'notes' ? (
                      <div className="space-y-3">
                        <div className="space-y-4 h-[400px] overflow-y-auto pr-4 bg-gray-900 rounded-lg p-4">
                          {notesLoading ? (
                            <div className="text-gray-400">Loading notes...</div>
                          ) : projectNotes.length === 0 ? (
                            <div className="text-gray-400">No notes found for this project.</div>
                          ) : (
                            projectNotes.map(note => (
                              <Link key={note.id} href={`/notes/${note.id}`} className="block bg-gray-800/80 rounded-lg p-3 mb-2 hover:bg-gray-700 transition">
                                <div className="text-gray-200 whitespace-pre-line">{note.content}</div>
                                <div className="text-xs text-gray-500 mt-2">{new Date(note.created_at).toLocaleString()}</div>
                              </Link>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Comments/Threads for other tabs */}
                    <div className="space-y-3">
                      {mockComments.map(c => (
                        <div key={c.id} className="flex items-start gap-3">
                          <User className="w-6 h-6 text-gray-400 mt-1" />
                          <div>
                            <div className="font-semibold text-white">{c.user} <span className="text-xs text-gray-400 ml-2">{c.time}</span></div>
                            <div className="text-gray-300">{c.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Input placeholder="Type a comment..." value={comment} onChange={e => setComment(e.target.value)} className="flex-1 bg-gray-800 border-gray-700 text-white" />
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-500">Send</Button>
                    </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
          {/* Project Timeline */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Flag className="w-5 h-5 mr-2" />
                Project Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTimeline.map((item, index) => (
                  <div key={item.id} className="relative">
                    {/* Timeline line */}
                    {index < mockTimeline.length - 1 && (
                      <div className="absolute left-6 top-8 w-0.5 h-12 bg-gray-700"></div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      {/* Timeline dot */}
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
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white">{item.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${
                              item.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              item.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {item.status === 'completed' ? 'Completed' :
                               item.status === 'in_progress' ? 'In Progress' :
                               'Upcoming'}
                            </Badge>
                            {item.deadline && (
                              <Badge className="bg-red-500/20 text-red-400 text-xs">
                                Due {new Date(item.deadline).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-2">{item.description}</p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-4">
                            <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                            <span>👤 {item.assignee}</span>
                          </div>
                          {item.progress > 0 && (
                            <div className="flex items-center gap-2">
                              <span>{item.progress}%</span>
                              <div className="w-16 bg-gray-700 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    item.status === 'completed' ? 'bg-green-500' :
                                    item.status === 'in_progress' ? 'bg-blue-500' :
                                    'bg-gray-500'
                                  }`}
                                  style={{ width: `${item.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                  <span>Timeline Overview</span>
                  <span>{mockTimeline.filter(item => item.status === 'completed').length}/{mockTimeline.length} completed</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(mockTimeline.filter(item => item.status === 'completed').length / mockTimeline.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center"><Activity className="w-5 h-5 mr-2" />Activity Feed</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {mockActivities.map(a => (
                <div key={a.id} className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-white">{a.user}</span>
                  <span className="text-gray-300">{a.action}</span>
                  <span className="text-xs text-gray-400 ml-2">{a.time}</span>
                </div>
              ))}
              {/* TODO: Integrate real activity data */}
            </CardContent>
          </Card>
        </div>
      </main>
      {/* TODO: Integrate real data, subscriptions, and actions for presence, sessions, rooms, comments, and activity. */}
    </div>
  )
} 
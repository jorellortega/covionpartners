"use client"

import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Send, Users, Plus, Bell, Edit, Trash2, Save, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function GroupChatPage() {
  const router = useRouter()
  const { user } = useAuth();
  const [groupChats, setGroupChats] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    avatar_url: '',
    is_private: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [addMemberLoading, setAddMemberLoading] = useState(false)
  const [addMemberError, setAddMemberError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [userSearch, setUserSearch] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [postTaskDialogOpen, setPostTaskDialogOpen] = useState(false)
  const [taskSearch, setTaskSearch] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [filteredTasks, setFilteredTasks] = useState<any[]>([])
  const [postProjectDialogOpen, setPostProjectDialogOpen] = useState(false)
  const [projectSearch, setProjectSearch] = useState('')
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editMessageContent, setEditMessageContent] = useState('')
  const [groupFiles, setGroupFiles] = useState<any[]>([])

  const fetchGroupChats = async () => {
    const { data, error } = await supabase
      .from('group_chats')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) {
      setGroupChats(data)
      if (!selectedGroup && data.length > 0) setSelectedGroup(data[0])
    }
  }

  // Update fetchMembers to fetch members, then fetch user info and merge
  const fetchMembers = async () => {
    if (!selectedGroup) return;
    // Step 1: Fetch group_chat_members for this group
    const { data: members, error } = await supabase
      .from('group_chat_members')
      .select('user_id, role, status')
      .eq('group_chat_id', selectedGroup.id)
      .eq('status', 'active');
    if (error || !members || members.length === 0) {
      setMembers([]);
      return;
    }
    // Step 2: Fetch user info for those members
    const userIds = members.map(m => m.user_id);
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, avatar_url')
      .in('id', userIds);
    if (userError || !users) {
      setMembers([]);
      return;
    }
    // Step 3: Merge user info into members
    const membersWithUser = members.map(m => ({
      ...m,
      user: users.find(u => u.id === m.user_id)
    }));
    setMembers(membersWithUser);
  }

  // Fetch group chat messages
  const fetchMessages = async () => {
    if (!selectedGroup) return;
    setMessagesLoading(true);
    // Fetch messages for this group, join sender info, and include attachment_url
    const { data, error } = await supabase
      .from('group_chat_messages')
      .select('id, content, created_at, sender_id, sender:sender_id (name, email, avatar_url), attachment_url')
      .eq('group_chat_id', selectedGroup.id)
      .order('created_at', { ascending: true });
    if (!error && data) {
      setMessages(data);
    } else {
      setMessages([]);
    }
    setMessagesLoading(false);
  };

  useEffect(() => {
    fetchGroupChats()
    // eslint-disable-next-line
  }, [])

  // Fetch group members when selectedGroup changes
  useEffect(() => {
    fetchMembers()
  }, [selectedGroup])

  // Fetch all users for the add member dialog
  useEffect(() => {
    if (!addMemberOpen) return
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name')
        .order('name', { ascending: true })
      if (!error && data) {
        setAllUsers(data)
      } else {
        setAllUsers([])
      }
    }
    fetchUsers()
  }, [addMemberOpen])

  // Filter users by name or email
  const filteredUsers = allUsers.filter(u => {
    const q = userSearch.toLowerCase()
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    )
  })

  // Fetch messages when selectedGroup changes
  useEffect(() => {
    fetchMessages();
  }, [selectedGroup]);

  // Update handleSendMessage to insert into group_chat_messages
  const handleSendMessage = async () => {
    if (uploading) return; // Prevent sending while uploading
    if ((!newMessage.trim() && !attachmentUrl) || !selectedGroup || !user) return;
    const { error } = await supabase.from('group_chat_messages').insert({
      group_chat_id: selectedGroup.id,
      sender_id: user.id,
      content: newMessage.trim(),
      attachment_url: attachmentUrl || null,
    });
    if (!error) {
      setNewMessage('');
      setAttachmentUrl(null); // Only clear after successful send
      fetchMessages();
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { name, description, avatar_url, is_private } = form
    if (!name.trim()) {
      setError('Group name is required')
      setLoading(false)
      return
    }
    const { error: insertError } = await supabase.from('group_chats').insert({
      name,
      description,
      avatar_url,
      is_private
    })
    if (insertError) {
      setError(insertError.message)
    } else {
      setForm({ name: '', description: '', avatar_url: '', is_private: false })
      setOpen(false)
      fetchGroupChats()
    }
    setLoading(false)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGroup || !selectedUserId) return
    setAddMemberLoading(true)
    setAddMemberError(null)
    // Check if already a member
    const { data: existing } = await supabase
      .from('group_chat_members')
      .select('id')
      .eq('group_chat_id', selectedGroup.id)
      .eq('user_id', selectedUserId)
      .maybeSingle()
    if (existing) {
      setAddMemberError('User is already a member of this group.')
      setAddMemberLoading(false)
      return
    }
    const { error } = await supabase.from('group_chat_members').insert({
      group_chat_id: selectedGroup.id,
      user_id: selectedUserId,
      role: 'member',
      status: 'active'
    })
    if (error) {
      setAddMemberError(error.message)
    } else {
      setAddMemberOpen(false)
      setSelectedUserId('')
      setTimeout(() => {
        fetchMembers()
      }, 300)
    }
    setAddMemberLoading(false)
  }

  // Fetch projects and tasks when dialog opens
  useEffect(() => {
    if (!postTaskDialogOpen && !postProjectDialogOpen) return;
    const fetchProjectsAndTasks = async () => {
      const { data: projectsData } = await supabase.from('projects').select('id, name');
      setProjects(projectsData || []);
      const { data: tasksData } = await supabase.from('tasks').select('id, title, description, project_id');
      setTasks(tasksData || []);
      setFilteredTasks(tasksData || []);
    };
    fetchProjectsAndTasks();
  }, [postTaskDialogOpen, postProjectDialogOpen]);

  // Filter tasks by project or search
  useEffect(() => {
    let filtered = tasks;
    if (selectedProject) {
      filtered = filtered.filter(t => t.project_id === selectedProject);
    }
    if (taskSearch) {
      filtered = filtered.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()));
    }
    setFilteredTasks(filtered);
  }, [taskSearch, selectedProject, tasks]);

  const handlePostTaskToChat = async (task: any) => {
    if (!selectedGroup || !user) return;
    // Compose the message as a JSON string
    const messageContent = JSON.stringify({
      type: 'task',
      taskId: task.id,
      title: task.title,
      description: task.description,
      projectId: task.project_id,
      projectName: (projects.find(p => p.id === task.project_id)?.name) || ''
    });
    const { error } = await supabase.from('group_chat_messages').insert({
      group_chat_id: selectedGroup.id,
      sender_id: user.id,
      content: messageContent,
    });
    if (!error) {
      setPostTaskDialogOpen(false);
      fetchMessages();
    }
  };

  // Fetch projects when dialog opens
  useEffect(() => {
    if (!postProjectDialogOpen) return;
    const fetchProjects = async () => {
      const { data: projectsData } = await supabase.from('projects').select('id, name, description, status, created_at, owner');
      setProjects(projectsData || []);
      setFilteredProjects(projectsData || []);
    };
    fetchProjects();
  }, [postProjectDialogOpen]);

  // Filter projects by search
  useEffect(() => {
    let filtered = projects;
    if (projectSearch) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));
    }
    setFilteredProjects(filtered);
  }, [projectSearch, projects]);

  const handlePostProjectToChat = async (project: any) => {
    if (!selectedGroup || !user) return;
    // Compose the message as a JSON string
    const messageContent = JSON.stringify({
      type: 'project',
      projectId: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      created_at: project.created_at,
      owner: project.owner || ''
    });
    const { error } = await supabase.from('group_chat_messages').insert({
      group_chat_id: selectedGroup.id,
      sender_id: user.id,
      content: messageContent,
    });
    if (!error) {
      setPostProjectDialogOpen(false);
      fetchMessages();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `groupchat_files/${user.id}/${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage.from('partnerfiles').upload(filePath, file)
    if (error) {
      alert('Failed to upload attachment')
      setUploading(false)
      return
    }
    const { data: publicUrlData } = supabase.storage.from('partnerfiles').getPublicUrl(filePath)
    setAttachmentUrl(publicUrlData.publicUrl)
    setUploading(false)
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
    const { error } = await supabase.from('group_chat_messages').update({ content: editMessageContent.trim() }).eq('id', msg.id)
    if (!error) {
      setEditingMessageId(null)
      setEditMessageContent('')
      fetchMessages()
    }
  }

  const handleDeleteMessage = async (msg: any) => {
    if (!window.confirm('Delete this message?')) return
    const { error } = await supabase.from('group_chat_messages').delete().eq('id', msg.id)
    if (!error) fetchMessages()
  }

  const fetchGroupFiles = async () => {
    if (!selectedGroup) return;
    const { data, error } = await supabase
      .from('group_chat_messages')
      .select('id, attachment_url, created_at, sender_id, sender:sender_id (name, email, avatar_url)')
      .eq('group_chat_id', selectedGroup.id)
      .not('attachment_url', 'is', null)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setGroupFiles(data);
    } else {
      setGroupFiles([]);
    }
  }

  useEffect(() => {
    fetchGroupFiles();
  }, [selectedGroup, messages]);

  return (
    <div className="min-h-screen bg-gray-950 relative">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center">
              <span className="bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full p-1.5 mr-3">
                <MessageSquare className="w-6 h-6 text-white" />
              </span>
              Group Chat
            </h1>
            <Button 
              variant="outline" 
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-cyan-900/20 hover:text-cyan-400"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Group Chats List */}
          <Card className="leonardo-card border-gray-800 lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Groups</CardTitle>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="hover:bg-cyan-900/20 hover:text-cyan-400"
                      aria-label="Create Group"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Group</DialogTitle>
                      <DialogDescription>Fill in the details to create a new group chat.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Group Name</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={form.description}
                          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="avatar_url">Avatar URL</Label>
                        <Input
                          id="avatar_url"
                          value={form.avatar_url}
                          onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="is_private"
                          checked={form.is_private}
                          onCheckedChange={val => setForm(f => ({ ...f, is_private: val }))}
                        />
                        <Label htmlFor="is_private">Private Group</Label>
                      </div>
                      {error && <div className="text-red-500 text-sm">{error}</div>}
                      <DialogFooter>
                        <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Group'}</Button>
                        <DialogClose asChild>
                          <Button type="button" variant="ghost">Cancel</Button>
                        </DialogClose>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {groupChats.length === 0 ? (
                <div className="text-gray-400">No group chats found.</div>
              ) : (
                groupChats.map((group) => (
                  <div
                    key={group.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup && selectedGroup.id === group.id
                        ? 'bg-cyan-900/20 text-cyan-400'
                        : 'hover:bg-gray-800/50'
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={group.avatar_url ? group.avatar_url : undefined} />
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                          <Users className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{group.name}</p>
                        <p className="text-sm text-gray-400 truncate">{group.description}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          {/* Chat Area */}
          <Card className="leonardo-card border-gray-800 lg:col-span-3">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedGroup?.avatar_url ? selectedGroup.avatar_url : undefined} />
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                    <Users className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{selectedGroup?.name}</CardTitle>
                  <p className="text-sm text-gray-400">{selectedGroup?.description}</p>
                </div>
              </div>
              {/* Group Members List */}
              <div className="flex flex-wrap gap-3 mt-4 items-center">
                {members.length === 0 ? (
                  <span className="text-gray-400 text-sm">No members yet</span>
                ) : (
                  members.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-2 bg-gray-800/40 rounded-full px-3 py-1">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={member.user?.avatar_url || undefined} />
                        <AvatarFallback>{member.user?.name ? member.user.name[0] : '?'}</AvatarFallback>
                      </Avatar>
                      <span className="text-gray-200 text-sm font-medium">{member.user?.name || 'Unknown'}</span>
                      {member.user?.email && <span className="text-gray-400 text-xs ml-2">{member.user.email}</span>}
                    </div>
                  ))
                )}
                <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="ml-2" onClick={() => setAddMemberOpen(true)}>
                      + Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Member</DialogTitle>
                      <DialogDescription>Select a user to add to this group chat.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddMember} className="space-y-4">
                      <div>
                        <Label htmlFor="user-search">Search User</Label>
                        <Input
                          id="user-search"
                          ref={searchInputRef}
                          placeholder="Type name or email..."
                          value={userSearch}
                          onChange={e => setUserSearch(e.target.value)}
                          disabled={!!selectedUserId}
                        />
                      </div>
                      {selectedUserId ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-cyan-900/10 rounded mt-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback>{filteredUsers.find(u => u.id === selectedUserId)?.name?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          <span className="text-gray-200 text-sm">{filteredUsers.find(u => u.id === selectedUserId)?.name || 'Unknown'}</span>
                          {filteredUsers.find(u => u.id === selectedUserId)?.email && (
                            <span className="text-gray-400 text-xs ml-2">{filteredUsers.find(u => u.id === selectedUserId)?.email}</span>
                          )}
                          <Button size="sm" variant="ghost" className="ml-auto" type="button" onClick={() => { setSelectedUserId(''); setUserSearch(''); }}>
                            Clear
                          </Button>
                        </div>
                      ) : (
                        <div className="max-h-40 overflow-y-auto border rounded bg-gray-900">
                          {userSearch.length === 0 ? (
                            <div className="p-2 text-gray-400">Type to search for a user by name or email.</div>
                          ) : filteredUsers.length === 0 ? (
                            <div className="p-2 text-gray-400">No users found.</div>
                          ) : (
                            filteredUsers.map(user => (
                              <div
                                key={user.id}
                                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-cyan-900/20 ${selectedUserId === user.id ? 'bg-cyan-900/30' : ''}`}
                                onClick={() => { setSelectedUserId(user.id); setUserSearch(user.name || user.email || ''); }}
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarFallback>{user.name ? user.name[0] : '?'}</AvatarFallback>
                                </Avatar>
                                <span className="text-gray-200 text-sm">{user.name || 'Unknown'}</span>
                                {user.email && <span className="text-gray-400 text-xs ml-2">{user.email}</span>}
                                {selectedUserId === user.id && <span className="ml-auto text-cyan-400">Selected</span>}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                      {addMemberError && <div className="text-red-500 text-sm">{addMemberError}</div>}
                      <DialogFooter>
                        <Button type="submit" disabled={addMemberLoading || !selectedUserId}>{addMemberLoading ? 'Adding...' : 'Add Member'}</Button>
                        <DialogClose asChild>
                          <Button type="button" variant="ghost">Cancel</Button>
                        </DialogClose>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 h-[500px] overflow-y-auto pr-4">
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
                                      // Status and priority badges (fallback to default if not present)
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
                              {msg.sender_id === user?.id && (
                                <>
                                  <Button size="icon" variant="ghost" className="ml-2" onClick={() => handleEditMessage(msg)}><Edit className="w-4 h-4" /></Button>
                                  <Button size="icon" variant="ghost" onClick={() => handleDeleteMessage(msg)}><Trash2 className="w-4 h-4" /></Button>
                                </>
                              )}
                            </div>
                          </div>
                          {msg.attachment_url && (
                            <div className="mt-2">
                              {msg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={msg.attachment_url}
                                    alt="Attachment"
                                    className="max-w-xs max-h-48 rounded shadow border border-gray-700 hover:opacity-90 transition"
                                  />
                                </a>
                              ) : (
                                <a
                                  href={msg.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 underline"
                                >
                                  Download Attachment
                                </a>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-gray-800/50 border-gray-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={handleSendMessage}
                  disabled={uploading || (!newMessage.trim() && !attachmentUrl)}
                >
                  <Send className="w-4 h-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="text-green-400 border-green-500 hover:bg-green-500/10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Attach File'}
                </Button>
                {attachmentUrl && (
                  <span className="text-xs text-green-400 ml-2">Attachment added</span>
                )}
                <Dialog open={postTaskDialogOpen} onOpenChange={setPostTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-cyan-700 text-cyan-400 hover:bg-cyan-900/20 ml-2"
                      onClick={() => setPostTaskDialogOpen(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Post Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Post a Task</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Search by Project</label>
                        <select
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                          value={selectedProject}
                          onChange={e => setSelectedProject(e.target.value)}
                        >
                          <option value="">All Projects</option>
                          {projects.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Search by Task Title</label>
                        <Input
                          placeholder="Type to search tasks..."
                          value={taskSearch}
                          onChange={e => setTaskSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto mt-2">
                        {filteredTasks.length === 0 ? (
                          <div className="text-gray-400">No tasks found.</div>
                        ) : (
                          filteredTasks.map((task: any) => (
                            <div
                              key={task.id}
                              className="p-2 border-b border-gray-800 cursor-pointer hover:bg-cyan-900/10 rounded"
                              onClick={() => handlePostTaskToChat(task)}
                            >
                              <div className="font-medium text-white">{task.title}</div>
                              <div className="text-sm text-gray-400">{task.description}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setPostTaskDialogOpen(false)}>Cancel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button
                  type="button"
                  variant="outline"
                  className="border-purple-700 text-purple-400 hover:bg-purple-900/20 ml-2"
                  onClick={() => setPostProjectDialogOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Post Project
                </Button>
                <Dialog open={postProjectDialogOpen} onOpenChange={setPostProjectDialogOpen}>
                  <DialogTrigger asChild></DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Post a Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Search by Project Name</label>
                        <Input
                          placeholder="Type to search projects..."
                          value={projectSearch}
                          onChange={e => setProjectSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto mt-2">
                        {projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase())).length === 0 ? (
                          <div className="text-gray-400">No projects found.</div>
                        ) : (
                          projects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase())).map((project: any) => (
                            <div
                              key={project.id}
                              className="p-2 border-b border-gray-800 cursor-pointer hover:bg-purple-900/10 rounded"
                              onClick={() => handlePostProjectToChat(project)}
                            >
                              <div className="font-medium text-white">{project.name}</div>
                              <div className="text-sm text-gray-400">{project.description}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setPostProjectDialogOpen(false)}>Cancel</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Files Card below the main cards */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Files</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {groupFiles.length === 0 ? (
                <div className="text-gray-400">No files shared yet.</div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {groupFiles.map((fileMsg, idx) => (
                    <React.Fragment key={fileMsg.id}>
                      <div className="flex flex-col items-center p-2 rounded hover:bg-gray-800/40 transition w-32">
                        <Avatar className="w-8 h-8 mb-1">
                          <AvatarImage src={fileMsg.sender?.avatar_url || undefined} />
                          <AvatarFallback>{fileMsg.sender?.name ? fileMsg.sender.name[0] : '?'}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-xs text-white truncate">{fileMsg.sender?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-400 truncate">{new Date(fileMsg.created_at).toLocaleString()}</div>
                        {fileMsg.attachment_url && (
                          fileMsg.attachment_url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
                            <a href={fileMsg.attachment_url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={fileMsg.attachment_url}
                                alt="Attachment"
                                className="w-12 h-12 object-cover rounded border border-gray-700 mt-1"
                              />
                            </a>
                          ) : (
                            <a
                              href={fileMsg.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 underline block mt-1"
                            >
                              Download File
                            </a>
                          )
                        )}
                      </div>
                      {/* Vertical separator, except after the last item */}
                      {idx < groupFiles.length - 1 && (
                        <div className="flex items-center">
                          <div className="h-20 mx-2 border-l-2 border-white/40 rounded-full" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 
"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageSquare, Send, Users, Plus, Bell } from 'lucide-react'
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
    // Fetch messages for this group, join sender info
    const { data, error } = await supabase
      .from('group_chat_messages')
      .select('id, content, created_at, sender_id, sender:sender_id (name, email, avatar_url)')
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
    if (!newMessage.trim() || !selectedGroup || !user) return;
    const { error } = await supabase.from('group_chat_messages').insert({
      group_chat_id: selectedGroup.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (!error) {
      setNewMessage('');
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
                  messages.map(msg => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender_id === user?.id ? 'justify-end' : ''}`}>
                      {msg.sender_id !== user?.id && (
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={msg.sender?.avatar_url || undefined} />
                          <AvatarFallback>{msg.sender?.name ? msg.sender.name[0] : '?'}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div className={`px-4 py-2 rounded-lg ${msg.sender_id === user?.id ? 'bg-cyan-700/80 text-white' : 'bg-gray-800/80 text-gray-100'}`}>
                          <span className="font-medium">{msg.sender?.name || 'Unknown'}</span>
                          <div>{msg.content}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(msg.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
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
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 
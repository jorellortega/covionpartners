"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Search, Plus, ArrowLeft, Edit, Trash2, Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
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
import { Textarea } from "@/components/ui/textarea"

interface Message {
  id: number
  subject: string
  content: string
  created_at: string
  read: boolean
  sender_id: string
  receiver_id: string
  sender: {
    name: string | null
  } | null
  receiver: {
    name: string | null
  } | null
  parent_id?: number
}

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editForm, setEditForm] = useState({
    subject: "",
    content: ""
  })
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [replyContent, setReplyContent] = useState("")

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      // Step 1: Fetch messages without joins
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        toast.error('Failed to fetch messages')
        throw messagesError
      }

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

      if (usersError) {
        console.error('Error fetching users:', usersError)
        toast.error('Failed to fetch user details')
        throw usersError
      }

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
      setLoading(false)
    }
  }

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.receiver?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleMessageClick = async (message: Message) => {
    // If the message is unread and the current user is the receiver, mark it as read
    if (!message.read && message.receiver_id === user?.id) {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', message.id)

      if (error) {
        console.error('Error marking message as read:', error)
      } else {
        // Update the local state
        setMessages(messages.map(m => 
          m.id === message.id ? { ...m, read: true } : m
        ))
      }
    }
    
    router.push(`/messages/${message.id}`)
  }

  const handleDeleteMessage = async (messageId: number) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      // Update local state
      setMessages(messages.filter(m => m.id !== messageId))
      toast.success('Message deleted successfully')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message)
    setEditForm({
      subject: message.subject,
      content: message.content
    })
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setEditForm({ subject: "", content: "" })
  }

  const handleSaveEdit = async () => {
    if (!editingMessage) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          subject: editForm.subject,
          content: editForm.content
        })
        .eq('id', editingMessage.id)

      if (error) throw error

      // Update local state
      setMessages(messages.map(m => 
        m.id === editingMessage.id 
          ? { ...m, subject: editForm.subject, content: editForm.content }
          : m
      ))
      
      setEditingMessage(null)
      setEditForm({ subject: "", content: "" })
      toast.success('Message updated successfully')
    } catch (error) {
      console.error('Error updating message:', error)
      toast.error('Failed to update message')
    }
  }

  const handleSendReply = async (parentMessage: Message) => {
    if (!replyContent.trim() || !user) return;
    try {
      const { error } = await supabase.from('messages').insert([
        {
          subject: parentMessage.subject || null,
          content: replyContent,
          sender_id: user.id,
          receiver_id: parentMessage.sender_id === user.id ? parentMessage.receiver_id : parentMessage.sender_id,
          parent_id: parentMessage.id,
        },
      ]);
      if (error) throw error;
      toast.success('Reply sent');
      setReplyContent("");
      setReplyTo(null);
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send reply');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-2 sm:mr-4"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <h1 className="text-xl sm:text-3xl font-bold text-white">Messages</h1>
            </div>
            <Button
              onClick={() => router.push('/messages/new')}
              className="w-full sm:w-auto bg-purple-600 text-white hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800 text-white w-full sm:w-96"
            />
          </div>

          {/* Messages List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <Card
                  key={message.id}
                  className="border-gray-800 bg-gray-900/50 hover:bg-gray-900 transition-colors"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      {editingMessage?.id === message.id ? (
                        <div className="flex-1 min-w-0 space-y-4">
                          <Input
                            value={editForm.subject}
                            onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                            className="bg-gray-800 border-gray-700 text-white"
                            placeholder="Subject"
                          />
                          <Textarea
                            value={editForm.content}
                            onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                            className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                            placeholder="Message content"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-gray-400 hover:text-gray-300"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="bg-blue-500 hover:bg-blue-600"
                              onClick={handleSaveEdit}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleMessageClick(message)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                              {message.subject}
                            </h3>
                            {!message.read && message.receiver_id === user?.id && (
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                            {message.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                                <span className="text-white text-xs font-medium">
                                  {message.sender?.name?.split(' ').map(n => n[0]).join('') || '?'}
                                </span>
                              </div>
                              <span className="text-gray-300">
                                {message.sender_id === user?.id ? 'You' : message.sender?.name || 'Unknown'}
                              </span>
                            </div>
                            <span className="text-gray-500">to</span>
                            <span className="text-gray-300">
                              {message.receiver_id === user?.id ? 'You' : message.receiver?.name || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-gray-500">
                          {new Date(message.created_at).toLocaleDateString()}
                        </div>
                        {message.sender_id === user?.id && !editingMessage && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
                              onClick={() => handleEditMessage(message)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Message</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this message? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleDeleteMessage(message.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Show replied-to message snippet if present */}
                    {message.parent_id && (
                      <div className="mt-2 p-2 rounded bg-gray-800 text-gray-400 text-xs">
                        Replying to: {messages.find(m => m.id === message.parent_id)?.content?.slice(0, 100) || 'Message'}
                      </div>
                    )}
                    {/* Reply UI */}
                    {replyTo?.id === message.id ? (
                      <div className="mt-4">
                        <Textarea
                          value={replyContent}
                          onChange={e => setReplyContent(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white min-h-[60px]"
                          placeholder="Type your reply..."
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={() => handleSendReply(message)}>
                            Send Reply
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setReplyTo(null); setReplyContent(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
                        onClick={() => { setReplyTo(message); setReplyContent(""); }}
                      >
                        Reply
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">No messages found</h3>
                <p className="text-gray-500">
                  {searchQuery
                    ? "No messages match your search"
                    : "Start a conversation by sending a new message"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Search, Plus, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

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
}

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user) {
      fetchMessages()
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!sender_id (
            id,
            name,
            email
          ),
          receiver:users!receiver_id (
            id,
            name,
            email
          )
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching messages:', error)
        toast.error('Failed to fetch messages')
        throw error
      }

      setMessages(data || [])
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

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
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
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
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
                  className="border-gray-800 bg-gray-900/50 hover:bg-gray-900 transition-colors cursor-pointer"
                  onClick={() => handleMessageClick(message)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
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
                      <div className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleDateString()}
                      </div>
                    </div>
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
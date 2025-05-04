"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Reply, Save, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
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
import * as React from "react"

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
    email: string | null
  } | null
  receiver: {
    name: string | null
    email: string | null
  } | null
}

export default function MessagePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const paramsObj = React.use(params as any) as { id: string };
  const { id } = paramsObj;
  const [message, setMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    subject: "",
    content: ""
  })

  useEffect(() => {
    if (user) {
      fetchMessage()
    }
  }, [user, id])

  const fetchMessage = async () => {
    try {
      setLoading(true)
      // Step 1: Fetch message without joins
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single()

      if (messageError) throw messageError

      // Verify user has access to this message
      if (messageData.sender_id !== user?.id && messageData.receiver_id !== user?.id) {
        toast.error('You do not have permission to view this message')
        router.push('/messages')
        return
      }

      // Collect user IDs
      const userIds = new Set<string>([messageData.sender_id, messageData.receiver_id])

      // Step 2: Fetch user details
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', Array.from(userIds))

      if (usersError) throw usersError

      // Create a map of user details
      const usersMap = new Map(usersData?.map(user => [user.id, user]))

      // Combine message with user details
      const messageWithUsers = {
        ...messageData,
        sender: usersMap.get(messageData.sender_id) || null,
        receiver: usersMap.get(messageData.receiver_id) || null
      }

      setMessage(messageWithUsers)

      // If message is unread and current user is the receiver, mark as read
      if (!messageData.read && messageData.receiver_id === user?.id) {
        const { error: updateError } = await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', id)

        if (updateError) {
          console.error('Error marking message as read:', updateError)
        }
      }
    } catch (error) {
      console.error('Error fetching message:', error)
      toast.error('Failed to load message')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (!message) return
    setIsEditing(true)
    setEditForm({
      subject: message.subject,
      content: message.content
    })
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditForm({ subject: "", content: "" })
  }

  const handleSaveEdit = async () => {
    if (!message) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({
          subject: editForm.subject,
          content: editForm.content
        })
        .eq('id', message.id)

      if (error) throw error

      setMessage(prev => prev ? {
        ...prev,
        subject: editForm.subject,
        content: editForm.content
      } : null)
      
      setIsEditing(false)
      setEditForm({ subject: "", content: "" })
      toast.success('Message updated successfully')
    } catch (error) {
      console.error('Error updating message:', error)
      toast.error('Failed to update message')
    }
  }

  const handleDelete = async () => {
    if (!message) return

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id)

      if (error) throw error

      toast.success('Message deleted successfully')
      router.push('/messages')
    } catch (error) {
      console.error('Error deleting message:', error)
      toast.error('Failed to delete message')
    }
  }

  const handleReply = () => {
    if (!message) return
    router.push(`/messages/new?reply_to=${message.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400">Message not found</p>
          <Button
            onClick={() => router.push('/messages')}
            variant="ghost"
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Messages
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-full md:max-w-7xl mx-auto py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-2 sm:mr-4"
            >
              <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Message Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-purple-400 hover:text-purple-300"
              onClick={handleReply}
            >
              <Reply className="w-4 h-4 mr-2" />
              Reply
            </Button>
            {message.sender_id === user?.id && (
              <>
                <Button
                  variant="ghost"
                  className="text-blue-400 hover:text-blue-300"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
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
                        onClick={handleDelete}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="w-full px-3 sm:px-6 max-w-full md:max-w-3xl mx-auto py-4 sm:py-6">
        <Card className="border-gray-800 bg-gray-900/50">
          <CardContent className="p-4 sm:p-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-200">Subject:</label>
                  <Input
                    value={editForm.subject}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-200">Message:</label>
                  <Textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[200px] bg-gray-800 border-gray-700 text-white mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">{message.subject}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {message.sender?.name?.split(' ').map(n => n[0]).join('') || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white">
                          {message.sender_id === user?.id ? 'You' : message.sender?.name || 'Unknown'}
                        </p>
                        <p className="text-xs">{message.sender?.email}</p>
                      </div>
                    </div>
                    <span>to</span>
                    <div>
                      <p className="text-white">
                        {message.receiver_id === user?.id ? 'You' : message.receiver?.name || 'Unknown'}
                      </p>
                      <p className="text-xs">{message.receiver?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                    {!message.read && message.receiver_id === user?.id && (
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="border-t border-gray-800 pt-6">
                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-gray-300">{message.content}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 
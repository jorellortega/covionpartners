"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash2, Reply, Save, X, Link as LinkIcon } from "lucide-react"
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
  attachment_url?: string
  link_url?: string
  project_id?: string | null
}

export default function MessagePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const paramsObj = React.use(params as any) as { id: string };
  const { id } = paramsObj;
  const [message, setMessage] = useState<Message | null>(null)
  const [parentMessage, setParentMessage] = useState<Message | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    subject: "",
    content: ""
  })
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [project, setProject] = useState<any>(null)

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

      // Fetch project info if project_id exists
      if (messageData.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', messageData.project_id)
          .single()
        setProject(projectData)
      }

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

      // If this message is a reply (has a parent_id), fetch the parent message
      if (messageData.parent_id) {
        const { data: parentData, error: parentError } = await supabase
          .from('messages')
          .select('*')
          .eq('id', messageData.parent_id)
          .single()

        if (parentError) {
          console.error('Error fetching parent message:', parentError)
        } else {
          // Fetch user details for parent message
          const parentUserIds = new Set<string>([parentData.sender_id, parentData.receiver_id])
          const { data: parentUsersData, error: parentUsersError } = await supabase
            .from('users')
            .select('id, name, email')
            .in('id', Array.from(parentUserIds))

          if (parentUsersError) {
            console.error('Error fetching parent message users:', parentUsersError)
          } else {
            const parentUsersMap = new Map(parentUsersData?.map(user => [user.id, user]))
            const parentMessageWithUsers = {
              ...parentData,
              sender: parentUsersMap.get(parentData.sender_id) || null,
              receiver: parentUsersMap.get(parentData.receiver_id) || null
            }
            setParentMessage(parentMessageWithUsers)
          }
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
    if (!message || !user) return
    // Determine the recipient: if current user is sender, reply goes to receiver, else to sender
    const recipientId = user.id === message.sender_id ? message.receiver_id : message.sender_id
    // Pass project_id and receiver_id as query params
    router.push(`/messages/new?reply_to=${message.id}&project_id=${message.project_id || ''}&receiver_id=${recipientId}`)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/${Date.now()}.${fileExt}`
    const { data, error } = await supabase.storage.from('partnerfiles').upload('messages-attachments/' + filePath, file)
    if (error) {
      toast.error('Failed to upload attachment')
      return
    }
    const { data: publicUrlData } = supabase.storage.from('partnerfiles').getPublicUrl('messages-attachments/' + filePath)
    setAttachmentUrl(publicUrlData.publicUrl)
    toast.success('Attachment uploaded')
  }

  const handleAddLink = () => {
    const url = prompt('Enter a link (https://...)')
    if (url && url.startsWith('http')) {
      setLinkUrl(url)
    } else if (url) {
      toast.error('Please enter a valid URL (must start with http)')
    }
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
            <h1 className="text-xl sm:text-3xl font-bold text-white flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Message Details</span>
              <span className="text-base sm:text-xl font-normal text-gray-300 truncate max-w-xs sm:max-w-md" title={message.subject}>
                {message.subject}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {message.sender_id === user?.id && (
              <>
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
        {parentMessage && (
          <Card className="border border-gray-800/50 bg-gradient-to-b from-gray-900/90 to-gray-900/50 mb-6 shadow-xl rounded-xl overflow-hidden hover:border-gray-700/50 transition-all duration-200">
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 px-1 py-0.5">
              <span className="text-xs font-medium text-gray-400 ml-4">Original Message</span>
            </div>
            <CardContent className="p-5 sm:p-7">
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-white">{parentMessage.subject}</h2>
                    <span className="text-sm text-gray-400">
                      {new Date(parentMessage.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-900/30 rounded-lg p-3">
                    {parentMessage.sender_id === user?.id ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center ring-2 ring-purple-500/20">
                          <span className="text-white text-sm font-medium">
                            {parentMessage.sender?.name?.split(' ').map(n => n[0]).join('') || '?'}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500/50 to-purple-500/50 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {parentMessage.sender?.name?.split(' ').map(n => n[0]).join('') || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium opacity-75 hover:opacity-100 transition-opacity duration-150">From</p>
                          <p className="text-sm text-gray-300 opacity-75 hover:opacity-100 transition-opacity duration-150">{parentMessage.sender?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400 opacity-75 hover:opacity-100 transition-opacity duration-150">{parentMessage.sender?.email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-800/50 pt-6">
                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-white text-xl leading-relaxed font-normal">
                      {parentMessage.content}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border border-gray-800/50 bg-gradient-to-b from-gray-900/90 to-gray-900/50 shadow-xl rounded-xl overflow-hidden hover:border-gray-700/50 transition-all duration-200">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-1 py-0.5 flex items-center justify-between">
            <span className="text-base sm:text-lg font-semibold text-gray-200 ml-4 truncate max-w-xs sm:max-w-md" title={message.subject}>
              {message.subject}
            </span>
            {project && (
              <span
                className="text-sm font-medium text-blue-300 mr-4 cursor-pointer transition-opacity duration-150"
                style={{ opacity: 0.15 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.15')}
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                Project: {project.name}
              </span>
            )}
          </div>
          <CardContent className="p-5 sm:p-7">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-200">Subject:</label>
                  <Input
                    value={editForm.subject}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="bg-gray-800/50 border-gray-700/50 text-white mt-1 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-200">Message:</label>
                  <Textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                    className="min-h-[200px] bg-gray-800/50 border-gray-700/50 text-white mt-1 focus:border-blue-500/50 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    className="px-3 py-1 rounded border border-blue-500 text-blue-300 font-medium bg-transparent hover:bg-blue-500/10 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Attach File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    className="px-3 py-1 rounded border border-green-500 text-green-300 font-medium bg-transparent hover:bg-green-500/10 transition-colors"
                    onClick={handleAddLink}
                  >
                    Add Link
                  </button>
                  {attachmentUrl && (
                    <span className="ml-2 text-xs text-blue-400">Attachment added</span>
                  )}
                  {linkUrl && (
                    <span className="ml-2 text-xs text-green-400">Link added</span>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="text-gray-400 hover:text-gray-300 border-gray-700/50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      await handleSaveEdit()
                      // Save attachment and link to DB
                      if (message) {
                        await supabase
                          .from('messages')
                          .update({ attachment_url: attachmentUrl, link_url: linkUrl })
                          .eq('id', message.id)
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {!message.read && message.receiver_id === user?.id && (
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
                          New
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(message.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-900/30 rounded-lg p-3 justify-between">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      {message.sender_id === user?.id ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center ring-2 ring-blue-500/20">
                            <span className="text-white text-sm font-medium">
                              {message.sender?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500/50 to-blue-500/50 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {message.sender?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium opacity-75 hover:opacity-100 transition-opacity duration-150">From</p>
                            <p className="text-sm text-gray-300 opacity-75 hover:opacity-100 transition-opacity duration-150">{message.sender?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400 opacity-75 hover:opacity-100 transition-opacity duration-150">{message.sender?.email}</p>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex-1 flex justify-end w-full mt-4 sm:mt-0 gap-2 items-center">
                      <button
                        onClick={handleReply}
                        className="px-4 py-1 rounded-lg border border-purple-500 text-purple-300 font-semibold bg-transparent hover:bg-purple-500/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        Reply
                      </button>
                      {message.link_url && (
                        <button
                          type="button"
                          className="ml-2 p-2 rounded-full border border-green-500 text-green-400 bg-transparent hover:bg-green-500/10 transition-colors"
                          title="Open link"
                          onClick={() => window.open(message.link_url, '_blank')}
                          onPointerDown={e => {
                            if (e.pointerType === 'touch' || e.button === 0) {
                              // Start timer for long press
                              const timeout = setTimeout(() => {
                                navigator.clipboard.writeText(message.link_url || '')
                                toast.success('Link copied to clipboard')
                              }, 600)
                              const clear = () => clearTimeout(timeout)
                              e.currentTarget.onpointerup = clear
                              e.currentTarget.onpointerleave = clear
                            }
                          }}
                        >
                          <LinkIcon className="w-5 h-5" />
                        </button>
                      )}
                      {message.sender_id === user?.id && (
                        <Button
                          variant="ghost"
                          className="text-blue-400 hover:text-blue-300 ml-2"
                          onClick={handleEdit}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800/50 pt-6">
                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-white text-xl leading-relaxed font-normal">
                      {message.content}
                    </p>
                  </div>
                </div>

                {message.attachment_url && (
                  <div className="mt-6">
                    {message.attachment_url.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i) ? (
                      <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={message.attachment_url}
                          alt="Attachment"
                          className="max-w-xs max-h-48 rounded shadow border border-gray-700 hover:opacity-90 transition"
                        />
                      </a>
                    ) : (
                      <a
                        href={message.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline"
                      >
                        Download Attachment
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
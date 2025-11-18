"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Home, Bell, MessageCircle, ArrowLeft, Calendar, Tag, FileText, Download, Upload, CheckCircle2, XCircle, Loader2, File, ExternalLink, Signature, Edit, Save, Briefcase, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useUpdates } from "@/hooks/useUpdates"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Update status badge component
function StatusBadge({ status }: { status: string }) {
  // Don't show badge for "upcoming" as it's used internally to mark as read
  if (!status || status === 'upcoming') return null;
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getStatusStyles()} border`} variant="outline">
      {status}
    </Badge>
  )
}

interface Document {
  id: string
  name: string
  type: 'upload' | 'download' | 'sign'
  status: 'pending' | 'completed' | 'required'
  file_path?: string
  signed_at?: string
}

interface UpdateDetails {
  id: number
  title: string
  description: string
  status: string
  date: string
  category: string
  full_content?: string
  impact?: string[]
  nextSteps?: string[]
  documents?: Document[]
  projects?: {
    id: number
    name: string
  }
  project_id?: number
  created_by?: string
  user_name?: string
  created_at?: string
}

interface Project {
  id: number
  name: string
}

export default function UpdateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { updateUpdate, deleteUpdate } = useUpdates()
  const [update, setUpdate] = useState<UpdateDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({})
  const [signing, setSigning] = useState<{ [key: string]: boolean }>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<UpdateDetails | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    console.log('UpdateDetailsPage: useEffect triggered. params.id:', params.id)
    if (params.id) {
      fetchUpdateDetails()
      fetchProjects()
    } else {
      console.warn('UpdateDetailsPage: No ID found in params on mount.')
      setError('Update ID is missing.')
      setLoading(false)
    }
  }, [params.id])

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .order('name')

      if (error) throw error
      setProjects(data || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
    }
  }

  async function fetchUpdateDetails() {
    console.log(`UpdateDetailsPage: Starting fetchUpdateDetails for ID: ${params.id}`)
    setLoading(true)
    setError(null)
    try {
      // Fetch update details with project information
      console.log('UpdateDetailsPage: Fetching update data...')
      const { data: updateData, error: updateError } = await supabase
        .from('updates')
        .select(`
          *,
          projects:project_id (
            id,
            name
          )
        `)
        .eq('id', params.id)
        .single()

      console.log('UpdateDetailsPage: Update fetch result:', { updateData, updateError })
      if (updateError) throw updateError
      if (!updateData) throw new Error('Update not found in database.')

      // If status is "new", set it to "upcoming" to mark as read
      // (Database has CHECK constraint that only allows specific status values)
      if (updateData.status === 'new') {
        const { error: statusUpdateError } = await supabase
          .from('updates')
          .update({ status: 'upcoming' })
          .eq('id', params.id)
        
        if (statusUpdateError) {
          console.error('Error updating status:', statusUpdateError)
        } else {
          // Update local state immediately
          updateData.status = 'upcoming'
        }
      }

      // Fetch user name for created_by
      let userName = 'Unknown User';
      if (updateData.created_by) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', updateData.created_by)
          .single();
        if (!userError && userData && userData.name) {
          userName = userData.name;
        }
      }

      // Fetch associated documents
      console.log('UpdateDetailsPage: Fetching documents data...')
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('update_id', params.id)
        
      console.log('UpdateDetailsPage: Documents fetch result:', { documentsData, documentsError })
      if (documentsError) throw documentsError

      setUpdate({
        ...updateData,
        status: updateData.status || 'upcoming', // use 'upcoming' as default if status was cleared
        user_name: userName,
        documents: documentsData || []
      })
      console.log('UpdateDetailsPage: State updated successfully.')
    } catch (err) {
      console.error('Error fetching update details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load update details')
    } finally {
      console.log('UpdateDetailsPage: fetchUpdateDetails finished.')
      setLoading(false)
    }
  }

  const handleFileSelect = (documentId: string, file: File | null) => {
    setSelectedFiles(prev => ({
      ...prev,
      [documentId]: file
    }))
  }

  const handleFileUpload = async (documentId: string) => {
    const file = selectedFiles[documentId]
    if (!file) return

    setUploading(true)
    let filePath = '' // Define filePath here to be accessible in finally block if needed
    try {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${documentId}-${Date.now()}.${fileExt}`
      filePath = `updates/${params.id}/${fileName}` // Assign value

      // --- Step 1: Upload to Storage (remains the same) ---
      console.log(`Uploading ${filePath} to storage...`)
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('partnerfiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false // Keep upsert false, handle replacement if needed before upload
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        // Attempt to delete the failed upload if it partially exists?
        // Optional: await supabase.storage.from('partnerfiles').remove([filePath])
        throw new Error(`Storage upload failed: ${uploadError.message}`)
      }
      console.log('Storage upload successful:', uploadData)

      // --- Step 2: Invoke Edge Function to update database ---
      console.log('Invoking edge function update-document-status...')
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'update-document-status', 
        {
          body: { documentId, filePath }
        }
      )

      if (functionError) {
        console.error('Edge function invocation error:', functionError)
        // Critical: If function fails, the storage is updated but DB is not.
        // Need to decide on rollback strategy (e.g., delete the uploaded file)
        console.log(`Attempting to delete orphaned file: ${filePath}`)
        await supabase.storage.from('partnerfiles').remove([filePath])
        throw new Error(`Failed to update document status: ${functionError.message}`)
      }

      if (functionData.error) {
        console.error('Edge function returned error:', functionData.error)
        // Also rollback storage if function logic failed
        console.log(`Attempting to delete orphaned file: ${filePath}`)
        await supabase.storage.from('partnerfiles').remove([filePath])
        throw new Error(`Failed to update document status: ${functionData.error}`)
      }
      
      console.log('Edge function returned success:', functionData)

      // --- Step 3: Client-side updates ---
      setSelectedFiles(prev => ({
        ...prev,
        [documentId]: null
      }))
      toast.success('File uploaded and status updated successfully')
      fetchUpdateDetails() // Refresh data to show the changes

    } catch (error) {
      console.error('Error in handleFileUpload process:', error)
      toast.error(error instanceof Error ? error.message : 'File upload process failed')
      // Optional: Consider cleanup here too if filePath was determined
      // if (filePath) { ... await supabase.storage.from('partnerfiles').remove([filePath]) ... }
    } finally {
      setUploading(false)
    }
  }

  const handleFileDownload = async (doc: Document) => {
    if (!doc.file_path) return

    try {
      const { data, error } = await supabase.storage
        .from('partnerfiles')
        .download(doc.file_path)

      if (error) throw error

      const url = window.URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.name
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      link.remove()
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const handleDocumentSign = async (documentId: string) => {
    setSigning(prev => ({ ...prev, [documentId]: true }))
    try {
      // --- Reverted Code: Direct Database Update --- 
      console.log(`Attempting direct update to sign document ID: ${documentId}`)
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: 'completed', 
          signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString() // Keep updated_at consistent
        })
        .eq('id', documentId)
        .eq('type', 'sign') // Match RLS policy conditions
        // .neq('status', 'completed') // Optional: Client-side check, RLS handles enforcement
        .select() // Good practice to select to confirm update
        
      if (error) {
         console.error('Direct update failed:', error)
         // Check if it's an RLS violation specifically
         if (error.code === '42501') { // PostgreSQL permission denied code
            throw new Error("Permission denied. Check RLS policies.")
         } else {
            throw new Error(`Failed to sign document: ${error.message}`)
         }
      }
      // --- End of Reverted Code ---

      console.log('Document signed successfully via direct update.')
      toast.success('Document signed successfully')
      fetchUpdateDetails() // Refresh UI to show updated status

    } catch (error) {
      console.error('Error signing document:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to sign document')
    } finally {
      setSigning(prev => ({ ...prev, [documentId]: false }))
    }
  }

  const getFileUrl = async (filePath: string) => {
    try {
      const { data } = await supabase.storage
        .from('partnerfiles')
        .createSignedUrl(filePath, 60) // URL valid for 60 seconds

      return data?.signedUrl
    } catch (error) {
      console.error('Error getting file URL:', error)
      return null
    }
  }

  const getFilePreview = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (!ext) return null

    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv']
    
    if (imageExts.includes(ext)) return 'image'
    if (documentExts.includes(ext)) return 'document'
    return 'other'
  }

  const handleEdit = () => {
    setEditForm(update)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editForm) return

    try {
      const { error } = await updateUpdate({
        id: editForm.id,
        title: editForm.title,
        description: editForm.description,
        status: editForm.status,
        date: editForm.date,
        category: editForm.category,
        full_content: editForm.full_content,
        impact: editForm.impact,
        nextSteps: editForm.nextSteps,
        project_id: editForm.project_id
      })

      if (error) {
        toast.error(error)
        return
      }

      setUpdate(editForm)
      setIsEditing(false)
      toast.success('Update saved successfully')
    } catch (err) {
      toast.error('Failed to save update')
    }
  }

  const handleCancel = () => {
    setEditForm(null)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!update) return

    try {
      const { error } = await deleteUpdate(update.id)
      if (error) {
        toast.error(error)
        return
      }

      toast.success('Update deleted successfully')
      router.push('/updates')
    } catch (err) {
      toast.error('Failed to delete update')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !update) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error || 'Update not found'}</p>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/updates')}
          className="hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Updates
        </Button>
      </div>
    )
  }

  const canEdit = user && ['partner', 'admin', 'ceo'].includes(user.role)

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-2 sm:mr-4 p-2 sm:p-0"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <h1 className="text-xl sm:text-3xl font-bold text-white">Update Details</h1>
          </div>
          {!isEditing && canEdit && (
            <Button 
              variant="outline" 
              onClick={handleEdit} 
              className="inline-flex items-center border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit Update</span>
            </Button>
          )}
          {isEditing && (
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={handleSave} 
                className="inline-flex items-center border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
              >
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                className="inline-flex items-center border-gray-700 bg-gray-800/30 text-white hover:bg-red-900/20 hover:text-red-400"
              >
                <XCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDelete} 
                className="inline-flex items-center border-gray-700 bg-gray-800/30 text-white hover:bg-red-900/20 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center p-8">{error}</div>
        ) : update ? (
          <>
            <div className="leonardo-card border-gray-800 overflow-visible">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 sm:mb-6 p-4 sm:p-6">
                <div className="space-y-2 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h1 className="text-xl sm:text-2xl font-semibold text-white break-words">{update.title}</h1>
                    <StatusBadge status={update.status} />
                  </div>
                  {update.projects && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <p className="text-sm sm:text-base font-semibold text-purple-400 break-words">
                        {update.projects.name}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-400 w-full sm:w-auto">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{new Date(update.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4 flex-shrink-0" />
                    <span>{update.category}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-800/30 rounded-lg mx-4 sm:mx-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm sm:text-base">
                    {update.created_by === user?.id ? 
                      (user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U') : 
                      (update.user_name?.split(' ').map((n: string) => n[0]).join('') || 'U')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-white truncate">
                      {update.created_by === user?.id ? 'You' : update.user_name || 'Unknown User'}
                    </p>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(update.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Main Update Card */}
                <Card className="border-gray-800 bg-gray-900/50">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                      <div className="space-y-2 w-full">
                        {isEditing && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <Input
                              value={editForm?.title || ''}
                              onChange={(e) => setEditForm(prev => prev ? { ...prev, title: e.target.value } : null)}
                              className="text-xl sm:text-2xl font-bold bg-gray-800 border-gray-700 text-white"
                            />
                            <Select
                              value={editForm?.status || ''}
                              onValueChange={(value) => setEditForm(prev => prev ? { ...prev, status: value } : null)}
                            >
                              <SelectTrigger className="w-full sm:w-32 bg-gray-800 border-gray-700 text-white">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {isEditing && (
                          <Select
                            value={editForm?.project_id?.toString() || "none"}
                            onValueChange={(value) => setEditForm(prev => prev ? { ...prev, project_id: value === "none" ? undefined : parseInt(value) } : null)}
                          >
                            <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                              <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Project</SelectItem>
                              {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id.toString()}>
                                  {project.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {isEditing && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1 w-full sm:w-auto">
                              <Calendar className="h-4 w-4 flex-shrink-0" />
                              <Input
                                type="date"
                                value={editForm?.date || ''}
                                onChange={(e) => setEditForm(prev => prev ? { ...prev, date: e.target.value } : null)}
                                className="bg-gray-800 border-gray-700 text-white w-full"
                              />
                            </div>
                            <div className="flex items-center gap-1 w-full sm:w-auto">
                              <Tag className="h-4 w-4 flex-shrink-0" />
                              <Input
                                value={editForm?.category || ''}
                                onChange={(e) => setEditForm(prev => prev ? { ...prev, category: e.target.value } : null)}
                                className="bg-gray-800 border-gray-700 text-white w-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                    {/* Description */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-white">Description</h3>
                      {isEditing ? (
                        <textarea
                          value={editForm?.description || ''}
                          onChange={(e) => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                          className="w-full min-h-[100px] bg-gray-800 border-gray-700 text-white rounded-md p-2"
                        />
                      ) : (
                        <p className="text-gray-300 break-words">{update.description}</p>
                      )}
                    </div>

                    {/* Full Content */}
                    {(update.full_content || isEditing) && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Full Content</h3>
                        {isEditing ? (
                          <textarea
                            value={editForm?.full_content || ''}
                            onChange={(e) => setEditForm(prev => prev ? { ...prev, full_content: e.target.value } : null)}
                            className="w-full min-h-[150px] bg-gray-800 border-gray-700 text-white rounded-md p-2"
                          />
                        ) : (
                          <p className="text-gray-300 whitespace-pre-wrap break-words">{update.full_content}</p>
                        )}
                      </div>
                    )}

                    {/* Impact */}
                    {((update.impact && update.impact.length > 0) || isEditing) && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Impact</h3>
                        {isEditing ? (
                          <div className="space-y-2">
                            {editForm?.impact?.map((item, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={item}
                                  onChange={(e) => {
                                    const newImpact = [...(editForm?.impact || [])]
                                    newImpact[index] = e.target.value
                                    setEditForm(prev => prev ? { ...prev, impact: newImpact } : null)
                                  }}
                                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newImpact = [...(editForm?.impact || [])]
                                    newImpact.splice(index, 1)
                                    setEditForm(prev => prev ? { ...prev, impact: newImpact } : null)
                                  }}
                                  className="text-red-400 hover:text-red-500 flex-shrink-0"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditForm(prev => prev ? { ...prev, impact: [...(prev.impact || []), ''] } : null)
                              }}
                              className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                            >
                              Add Impact Item
                            </Button>
                          </div>
                        ) : (
                          <ul className="list-disc list-inside space-y-1 text-gray-300">
                            {update.impact?.map((item, index) => (
                              <li key={index} className="break-words">{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {/* Next Steps */}
                    {((update.nextSteps && update.nextSteps.length > 0) || isEditing) && (
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white">Next Steps</h3>
                        {isEditing ? (
                          <div className="space-y-2">
                            {editForm?.nextSteps?.map((step, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={step}
                                  onChange={(e) => {
                                    const newSteps = [...(editForm?.nextSteps || [])]
                                    newSteps[index] = e.target.value
                                    setEditForm(prev => prev ? { ...prev, nextSteps: newSteps } : null)
                                  }}
                                  className="flex-1 bg-gray-800 border-gray-700 text-white"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newSteps = [...(editForm?.nextSteps || [])]
                                    newSteps.splice(index, 1)
                                    setEditForm(prev => prev ? { ...prev, nextSteps: newSteps } : null)
                                  }}
                                  className="text-red-400 hover:text-red-500 flex-shrink-0"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditForm(prev => prev ? { ...prev, nextSteps: [...(prev.nextSteps || []), ''] } : null)
                              }}
                              className="w-full border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                            >
                              Add Next Step
                            </Button>
                          </div>
                        ) : (
                          <ul className="list-disc list-inside space-y-1 text-gray-300">
                            {update.nextSteps?.map((step, index) => (
                              <li key={index} className="break-words">{step}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Documents Section */}
                {update.documents && update.documents.length > 0 && (
                  <Card className="border-gray-800 bg-gray-900/50">
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-xl text-white">Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid gap-4">
                        {update.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-800/50 rounded-lg gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-white font-medium break-words">{doc.name}</p>
                                <p className="text-sm text-gray-400">
                                  {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} Document
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {doc.status === 'completed' ? (
                                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                                  Completed
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                                  Pending
                                </Badge>
                              )}
                              {doc.file_path && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleFileDownload(doc)}
                                  className="hover:bg-gray-700"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              )}
                              {doc.type === 'sign' && doc.status !== 'completed' && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleDocumentSign(doc.id)}
                                  className="w-full sm:w-auto border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                                >
                                  <Signature className="mr-2 h-4 w-4" />
                                  Sign
                                </Button>
                              )}
                              {doc.type === 'upload' && doc.status !== 'completed' && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                                  <Input
                                    type="file"
                                    onChange={(e) => handleFileSelect(doc.id, e.target.files?.[0] || null)}
                                    className="w-full"
                                  />
                                  <Button
                                    variant="outline"
                                    onClick={() => handleFileUpload(doc.id)}
                                    disabled={!selectedFiles[doc.id]}
                                    className="w-full sm:w-auto border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
} 
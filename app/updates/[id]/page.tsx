"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Home, Bell, MessageCircle, ArrowLeft, Calendar, Tag, FileText, Download, Upload, CheckCircle2, XCircle, Loader2, File, ExternalLink, Signature, Edit, Save } from "lucide-react"
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
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "new":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "upcoming":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
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
}

export default function UpdateDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { updateUpdate } = useUpdates()
  const [update, setUpdate] = useState<UpdateDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: File | null }>({})
  const [signing, setSigning] = useState<{ [key: string]: boolean }>({})
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<UpdateDetails | null>(null)

  useEffect(() => {
    console.log('UpdateDetailsPage: useEffect triggered. params.id:', params.id)
    if (params.id) {
      fetchUpdateDetails()
    } else {
      console.warn('UpdateDetailsPage: No ID found in params on mount.')
      setError('Update ID is missing.')
      setLoading(false)
    }
  }, [params.id])

  async function fetchUpdateDetails() {
    console.log(`UpdateDetailsPage: Starting fetchUpdateDetails for ID: ${params.id}`)
    setLoading(true)
    setError(null)
    try {
      // Fetch update details
      console.log('UpdateDetailsPage: Fetching update data...')
      const { data: updateData, error: updateError } = await supabase
        .from('updates')
        .select('*')
        .eq('id', params.id)
        .single()

      console.log('UpdateDetailsPage: Update fetch result:', { updateData, updateError })
      if (updateError) throw updateError
      if (!updateData) throw new Error('Update not found in database.')

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
      })

      if (error) {
        toast.error(error)
        return
      }

      setUpdate(editForm)
      setIsEditing(false)
      toast.success('Update saved successfully')
      fetchUpdateDetails() // Refresh data
    } catch (err) {
      toast.error('Failed to save update')
    }
  }

  const handleCancel = () => {
    setEditForm(update)
    setIsEditing(false)
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
        <Button onClick={() => router.push('/updates')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Updates
        </Button>
      </div>
    )
  }

  const canEdit = user && ['partner', 'admin'].includes(user.role)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/updates')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Updates
            </Button>
            {isEditing ? (
              <Input
                value={editForm?.title || ''}
                onChange={(e) => setEditForm(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="text-3xl font-bold h-auto py-1 px-2"
              />
            ) : (
              <h1 className="text-3xl font-bold">{update.title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              canEdit && (
                <Button onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )
            )}
            {!isEditing && <StatusBadge status={update.status} />}
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {isEditing ? (
                  <Input
                    type="date"
                    value={editForm?.date || ''}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, date: e.target.value } : null)}
                    className="w-40"
                  />
                ) : (
                  new Date(update.date).toLocaleDateString()
                )}
              </div>
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-2" />
                {isEditing ? (
                  <Input
                    value={editForm?.category || ''}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, category: e.target.value } : null)}
                    className="w-40"
                  />
                ) : (
                  update.category
                )}
              </div>
              {isEditing && (
                <div className="flex items-center">
                  <Select
                    value={editForm?.status || ''}
                    onValueChange={(value) => setEditForm(prev => prev ? { ...prev, status: value } : null)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              {isEditing ? (
                <>
                  <Input
                    value={editForm?.description || ''}
                    onChange={(e) => setEditForm(prev => prev ? { ...prev, description: e.target.value } : null)}
                    className="text-lg mb-6"
                  />
                  {editForm?.full_content !== undefined && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-4">Details</h3>
                      <Input
                        value={editForm.full_content || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, full_content: e.target.value } : null)}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-lg mb-6">{update.description}</p>
                  {update.full_content && (
                    <div className="mt-6">
                      <h3 className="text-xl font-semibold mb-4">Details</h3>
                      <p>{update.full_content}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        {update.documents && update.documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {update.documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      {document.type === 'download' && <Download className="w-5 h-5 text-blue-400" />}
                      {document.type === 'upload' && <Upload className="w-5 h-5 text-green-400" />}
                      {document.type === 'sign' && <CheckCircle2 className="w-5 h-5 text-yellow-400" />}
                      <div>
                        <p className="font-medium">{document.name}</p>
                        <p className="text-sm text-gray-500">
                          {document.status === 'completed' ? 'Completed' : 
                           document.status === 'required' ? 'Action Required' : 'Pending'}
                        </p>
                        {document.file_path && (
                          <div className="mt-2">
                            <Button
                              variant="link"
                              className="h-auto p-0 text-sm text-blue-400 hover:text-blue-500"
                              onClick={async () => {
                                const url = await getFileUrl(document.file_path!)
                                if (url) {
                                  window.open(url, '_blank')
                                } else {
                                  toast.error('Failed to get file URL')
                                }
                              }}
                            >
                              <File className="w-4 h-4 mr-1" />
                              View File
                              <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {document.type === 'download' && (
                        <Button
                          variant="outline"
                          onClick={() => handleFileDownload(document)}
                          disabled={!document.file_path}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                      {document.type === 'upload' && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            onChange={(e) => handleFileSelect(document.id, e.target.files?.[0] || null)}
                            className="max-w-[200px]"
                          />
                          <Button
                            variant="outline"
                            onClick={() => handleFileUpload(document.id)}
                            disabled={!selectedFiles[document.id] || uploading}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                      )}
                      {document.type === 'sign' && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/updates/${update?.id}/sign/${document.id}`)}
                          disabled={document.status === 'completed'}
                        >
                          <Signature className="w-4 h-4 mr-2" />
                          {document.status === 'completed' ? 'View Signed' : 'Sign Document'}
                        </Button>
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
  )
} 
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, UploadCloud, Share2, Copy, Trash2, Clock, Eye, Calendar, User, MessageSquare, Plus, Search, Filter, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FileShare {
  id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  message: string
  sender_name: string
  sender_email: string
  expires_at: string
  created_at: string
  download_count: number
}

export default function FileManagementPage() {
  const router = useRouter()
  const [fileShares, setFileShares] = useState<FileShare[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fileToDelete, setFileToDelete] = useState<FileShare | null>(null)
  const [extendDialogOpen, setExtendDialogOpen] = useState(false)
  const [fileToExtend, setFileToExtend] = useState<FileShare | null>(null)
  const [extendDays, setExtendDays] = useState("7")

  useEffect(() => {
    fetchFileShares()
  }, [])

  const fetchFileShares = async () => {
    try {
      setLoading(true)
      // For now, fetch all file shares (in a real app, you'd filter by sender_email)
      const { data, error } = await supabase
        .from('file_shares')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFileShares(data || [])
    } catch (error) {
      console.error('Error fetching file shares:', error)
      toast.error('Failed to load file shares')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (fileShare: FileShare) => {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('file_shares')
        .delete()
        .eq('id', fileShare.id)

      if (dbError) throw dbError

      // Try to delete from storage (optional - file might still exist)
      try {
        const urlParts = fileShare.file_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        await supabase.storage
          .from('partnerfiles')
          .remove([`public_shares/${fileName}`])
      } catch (storageError) {
        console.log('Storage deletion failed (file may not exist):', storageError)
      }

      // Update local state
      setFileShares(prev => prev.filter(f => f.id !== fileShare.id))
      toast.success('File share deleted successfully')
      setDeleteDialogOpen(false)
      setFileToDelete(null)
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete file share')
    }
  }

  const handleExtendExpiration = async (fileShare: FileShare) => {
    try {
      const currentExpiry = new Date(fileShare.expires_at)
      const newExpiry = new Date(currentExpiry)
      newExpiry.setDate(newExpiry.getDate() + parseInt(extendDays))

      const { error } = await supabase
        .from('file_shares')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', fileShare.id)

      if (error) throw error

      // Update local state
      setFileShares(prev => prev.map(f => 
        f.id === fileShare.id 
          ? { ...f, expires_at: newExpiry.toISOString() }
          : f
      ))

      toast.success(`File share extended by ${extendDays} days`)
      setExtendDialogOpen(false)
      setFileToExtend(null)
    } catch (error) {
      console.error('Extend error:', error)
      toast.error('Failed to extend file share')
    }
  }

  const copyToClipboard = async (fileShare: FileShare) => {
    const shareUrl = `/file-download/${fileShare.id}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedId(fileShare.id)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.startsWith('video/')) return '🎥'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️'
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦'
    return '📁'
  }

  const getStatus = (fileShare: FileShare) => {
    const now = new Date()
    const expiresAt = new Date(fileShare.expires_at)
    if (now > expiresAt) return 'expired'
    if (expiresAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'expiring-soon'
    return 'active'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600/20 text-green-400 border-green-500/30">Active</Badge>
      case 'expiring-soon':
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">Expiring Soon</Badge>
      case 'expired':
        return <Badge className="bg-red-600/20 text-red-400 border-red-500/30">Expired</Badge>
      default:
        return <Badge className="bg-gray-600/20 text-gray-400 border-gray-500/30">Unknown</Badge>
    }
  }

  const filteredFileShares = fileShares.filter(fileShare => {
    const matchesSearch = fileShare.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fileShare.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const status = getStatus(fileShare)
    const matchesFilter = statusFilter === 'all' || status === statusFilter
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">File Management</h1>
            <p className="text-gray-400">Manage all your file shares and track downloads</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/file-download')}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>
            <Button
              onClick={() => router.push('/file-download')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload New File
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{fileShares.length}</p>
                  <p className="text-gray-400 text-sm">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mr-4">
                  <Download className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {fileShares.reduce((sum, f) => sum + f.download_count, 0)}
                  </p>
                  <p className="text-gray-400 text-sm">Total Downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {fileShares.filter(f => getStatus(f) === 'expiring-soon').length}
                  </p>
                  <p className="text-gray-400 text-sm">Expiring Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {fileShares.filter(f => getStatus(f) === 'expired').length}
                  </p>
                  <p className="text-gray-400 text-sm">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="leonardo-card border-gray-800 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search files by name or sender..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File List */}
        {filteredFileShares.length === 0 ? (
          <Card className="leonardo-card border-gray-800">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No files found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first file to get started'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => router.push('/file-download')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload First File
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredFileShares.map((fileShare) => {
              const status = getStatus(fileShare)
              const shareUrl = `/file-download/${fileShare.id}`
              
              return (
                <Card key={fileShare.id} className="leonardo-card border-gray-800">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{getFileIcon(fileShare.file_type)}</div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-white text-lg truncate">
                            {fileShare.file_name}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {formatFileSize(fileShare.file_size)}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* File Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <User className="w-4 h-4" />
                        <span className="truncate">{fileShare.sender_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Created {formatDate(fileShare.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>Expires {formatDate(fileShare.expires_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Eye className="w-4 h-4" />
                        <span>{fileShare.download_count} downloads</span>
                      </div>
                    </div>

                    {/* Message */}
                    {fileShare.message && (
                      <div className="p-3 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-3 h-3 text-blue-400" />
                          <span className="text-xs text-gray-400">Message</span>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-2">{fileShare.message}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(fileShare)}
                        className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        {copiedId === fileShare.id ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      
                      {status !== 'expired' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFileToExtend(fileShare)
                            setExtendDialogOpen(true)
                          }}
                          className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                        >
                          <Clock className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFileToDelete(fileShare)
                          setDeleteDialogOpen(true)
                        }}
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete File Share</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{fileToDelete?.file_name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => fileToDelete && handleDelete(fileToDelete)}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Extend Dialog */}
        <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Extend File Share</DialogTitle>
              <DialogDescription>
                Extend the expiration date for "{fileToExtend?.file_name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Extend by
                </label>
                <Select value={extendDays} onValueChange={setExtendDays}>
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setExtendDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => fileToExtend && handleExtendExpiration(fileToExtend)}
              >
                Extend
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

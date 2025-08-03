"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  FileText,
  Plus,
  Home,
  Upload,
  Search,
  Edit,
  Trash2,
  Download,
  Copy,
  Send,
  Eye,
  MoreHorizontal,
  Filter,
  Calendar,
  Users,
  File,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Ban
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

interface Contract {
  id: string
  title: string
  description: string
  contract_text: string
  category: string
  status: string
  file_url?: string
  file_name?: string
  file_type?: string
  created_at: string
  updated_at: string
  expires_at?: string
}

export default function ContractLibraryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrganization, setSelectedOrganization] = useState<string>('')
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  
  // Dialog states
  const [showCreateContract, setShowCreateContract] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  
  // Form states
  const [contractForm, setContractForm] = useState({
    title: '',
    description: '',
    contract_text: '',
    category: 'general',
    expires_at: ''
  })

  // Signature fields state
  const [signatureFields, setSignatureFields] = useState<any[]>([])
  const [showSignatureFieldsDialog, setShowSignatureFieldsDialog] = useState(false)

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'general',
    file: null as File | null
  })

  useEffect(() => {
    if (user) {
      fetchOrganizations()
    }
  }, [user])

  useEffect(() => {
    if (selectedOrganization) {
      fetchContracts()
    }
  }, [selectedOrganization])

  const fetchOrganizations = async () => {
    try {
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching organizations:', error)
        toast({
          title: "Error",
          description: "Failed to load organizations",
          variant: "destructive"
        })
        return
      }

      setOrganizations(orgs || [])
      if (orgs && orgs.length > 0) {
        setSelectedOrganization(orgs[0].id)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchContracts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contracts?organization_id=${selectedOrganization}&status=${statusFilter}&category=${categoryFilter}`)
      const data = await response.json()
      
      if (data.contracts) {
        setContracts(data.contracts)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
      toast({
        title: "Error",
        description: "Failed to load contracts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateContract = async () => {
    try {
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrganization,
          ...contractForm,
          signature_fields: signatureFields
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract created successfully"
        })
        setShowCreateContract(false)
        setContractForm({
          title: '',
          description: '',
          contract_text: '',
          category: 'general',
          expires_at: ''
        })
        fetchContracts()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create contract",
        variant: "destructive"
      })
    }
  }

  const handleUploadFile = async () => {
    if (!uploadForm.file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      })
      return
    }

    try {
      // First, try to create the storage bucket if it doesn't exist
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError)
      }

      const contractsBucket = buckets?.find(bucket => bucket.name === 'contracts')
      if (!contractsBucket) {
        // Try to create the bucket
        const { error: createError } = await supabase.storage.createBucket('contracts', {
          public: true,
          allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
        })
        if (createError) {
          console.error('Error creating bucket:', createError)
          toast({
            title: "Error",
            description: "Failed to create storage bucket. Please contact support.",
            variant: "destructive"
          })
          return
        }
      }

      // Upload file to Supabase storage
      const fileExt = uploadForm.file.name.split('.').pop()
      const fileName = `${Date.now()}-${uploadForm.file.name}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(fileName, uploadForm.file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(fileName)

      // Create contract record
      const response = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: selectedOrganization,
          title: uploadForm.title,
          description: uploadForm.description,
          contract_text: `Uploaded file: ${uploadForm.file.name}`,
          category: uploadForm.category,
          file_url: publicUrl,
          file_name: uploadForm.file.name,
          file_type: uploadForm.file.type
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "File uploaded successfully"
        })
        setShowUploadDialog(false)
        setUploadForm({
          title: '',
          description: '',
          category: 'general',
          file: null
        })
        fetchContracts()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      })
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    try {
      const response = await fetch(`/api/contracts?id=${contractId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract deleted successfully"
        })
        fetchContracts()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contract",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', icon: Clock },
      pending: { color: 'bg-yellow-500', icon: AlertCircle },
      sent: { color: 'bg-blue-500', icon: Send },
      signed: { color: 'bg-green-500', icon: CheckCircle },
      expired: { color: 'bg-red-500', icon: Ban },
      cancelled: { color: 'bg-gray-400', icon: X }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  // Signature field management functions
  const addSignatureField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'name',
      label: '',
      placeholder: '',
      required: true,
      position: { page: 1, x: 100, y: 200 },
      placeholder_text: '_____________'
    }
    setSignatureFields([...signatureFields, newField])
  }

  const updateSignatureField = (index: number, field: any) => {
    const updatedFields = [...signatureFields]
    updatedFields[index] = field
    setSignatureFields(updatedFields)
  }

  const removeSignatureField = (index: number) => {
    setSignatureFields(signatureFields.filter((_, i) => i !== index))
  }

  const generatePlaceholder = (field: any) => {
    return `{{${field.id}}}`
  }

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">You don't have any organizations yet.</p>
            <Button
              onClick={() => router.push('/createorganization')}
              className="gradient-button hover:bg-purple-700"
            >
              Create Organization
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
              >
                <Home className="w-6 h-6 mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Contract Library
                </h1>
                <Button
                  onClick={() => setShowCreateContract(true)}
                  className="ml-0"
                  variant="outline"
                  size="icon"
                  title="Create Contract from Text"
                  aria-label="Create Contract from Text"
                >
                  <Plus className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Organization Selector */}
        <div className="mb-6">
          <Label htmlFor="organization" className="text-white mb-2 block">Select Organization</Label>
          <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
            <SelectTrigger className="w-full max-w-md bg-gray-800/30 border-gray-700 text-white">
              <SelectValue placeholder="Select an organization" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id} className="text-white">
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contract Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-6 mb-8">
          <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <div className="p-2 sm:p-3 rounded-full bg-blue-500/20 mr-2 sm:mr-4">
              <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Total</p>
              <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{contracts.length}</h3>
            </div>
          </div>

          <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "draft" ? "all" : "draft")}>
            <div className="p-2 sm:p-3 rounded-full bg-green-500/20 mr-2 sm:mr-4">
              <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Draft</p>
              <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                {contracts.filter((c) => c.status.toLowerCase() === "draft").length}
              </h3>
            </div>
          </div>

          <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}>
            <div className="p-2 sm:p-3 rounded-full bg-yellow-500/20 mr-2 sm:mr-4">
              <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Pending</p>
              <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                {contracts.filter((c) => c.status.toLowerCase() === "pending").length}
              </h3>
            </div>
          </div>

          <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "sent" ? "all" : "sent")}>
            <div className="p-2 sm:p-3 rounded-full bg-blue-500/20 mr-2 sm:mr-4">
              <Send className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Sent</p>
              <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                {contracts.filter((c) => c.status.toLowerCase() === "sent").length}
              </h3>
            </div>
          </div>

          <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-purple-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "signed" ? "all" : "signed")}>
            <div className="p-2 sm:p-3 rounded-full bg-purple-500/20 mr-2 sm:mr-4">
              <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-400">Signed</p>
              <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                {contracts.filter((c) => c.status.toLowerCase() === "signed").length}
              </h3>
            </div>
          </div>
        </div>

        {/* Contracts List */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white whitespace-nowrap">
                {statusFilter !== 'all' ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Contracts` : 'All Contracts'}
              </h2>
              {/* Search and action buttons */}
              <div className="flex flex-col sm:flex-row flex-1 gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search contracts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800/30 border-gray-700 w-full"
                  />
                </div>
                <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400 whitespace-nowrap">
                      <Upload className="w-5 h-5 mr-2" />
                      <span className="hidden sm:inline">Upload File</span>
                      <span className="sm:hidden">Upload</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-950 border-gray-800 text-white w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Upload Contract File</DialogTitle>
                      <DialogDescription>
                        Upload a PDF, Word document, or other contract file
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="Contract title"
                          value={uploadForm.title}
                          onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                          className="bg-gray-800/30 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Contract description"
                          value={uploadForm.description}
                          onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                          rows={3}
                          className="bg-gray-800/30 border-gray-700 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={uploadForm.category} onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}>
                          <SelectTrigger className="bg-gray-800/30 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="employment">Employment</SelectItem>
                            <SelectItem value="nda">NDA</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="service">Service Agreement</SelectItem>
                            <SelectItem value="lease">Lease Agreement</SelectItem>
                            <SelectItem value="purchase">Purchase Agreement</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>File</Label>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                          className="bg-gray-800/30 border-gray-700 text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUploadFile}>
                        Upload File
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Contracts Grid */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-2 text-gray-400">Loading contracts...</p>
            </div>
          ) : filteredContracts.length === 0 ? (
            <Card className="leonardo-card p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No contracts found</h3>
              <p className="text-gray-400 mb-4">Create your first contract to get started</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setShowCreateContract(true)} className="gradient-button hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create from Text
                </Button>
                <Button variant="outline" onClick={() => setShowUploadDialog(true)} className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="leonardo-card cursor-pointer hover:border-blue-500/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <div>
                          <CardTitle className="text-white text-sm sm:text-base">{contract.title}</CardTitle>
                          <CardDescription className="text-gray-400 text-xs sm:text-sm">
                            {contract.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(contract.status)}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteContract(contract.id)
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(contract.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <File className="w-4 h-4" />
                        <span className="hidden sm:inline">{contract.file_name || 'Text Contract'}</span>
                        <span className="sm:hidden">{contract.file_name ? 'File' : 'Text'}</span>
                      </div>
                      <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                        {contract.category}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/sign-contract?contract_id=${contract.id}`)}
                        className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Send for Signature</span>
                        <span className="sm:hidden">Sign</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/contract-library/${contract.id}`)}
                        className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">View</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                      {contract.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(contract.file_url, '_blank')}
                          className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Download</span>
                          <span className="sm:hidden">Download</span>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Contract Dialog */}
      <Dialog open={showCreateContract} onOpenChange={setShowCreateContract}>
        <DialogContent className="bg-gray-950 border-gray-800 text-white w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Contract</DialogTitle>
            <DialogDescription>
              Create a new contract by entering the text content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Contract title"
                value={contractForm.title}
                onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                className="bg-gray-800/30 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Contract description"
                value={contractForm.description}
                onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                rows={3}
                className="bg-gray-800/30 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={contractForm.category} onValueChange={(value) => setContractForm({ ...contractForm, category: value })}>
                <SelectTrigger className="bg-gray-800/30 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="service">Service Agreement</SelectItem>
                  <SelectItem value="lease">Lease Agreement</SelectItem>
                  <SelectItem value="purchase">Purchase Agreement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Contract Text</Label>
              <Textarea
                placeholder="Paste your contract text here... You can use variables like {{user_name}}, {{date}}, {{company_name}} etc."
                value={contractForm.contract_text}
                onChange={(e) => setContractForm({ ...contractForm, contract_text: e.target.value })}
                rows={15}
                className="bg-gray-800/30 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Expiration Date (Optional)</Label>
              <Input
                type="datetime-local"
                value={contractForm.expires_at}
                onChange={(e) => setContractForm({ ...contractForm, expires_at: e.target.value })}
                className="bg-gray-800/30 border-gray-700 text-white"
              />
            </div>
            
            {/* Signature Fields Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Signature Fields</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSignatureField}
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>
              
              {signatureFields.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No signature fields defined. Add fields to collect names, signatures, and dates.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {signatureFields.map((field, index) => (
                    <div key={field.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-400">Field Type</Label>
                          <select
                            value={field.type}
                            onChange={(e) => updateSignatureField(index, { ...field, type: e.target.value })}
                            className="w-full bg-gray-800/30 border border-gray-700 text-white rounded-md px-3 py-2 text-sm"
                          >
                            <option value="name">Name</option>
                            <option value="signature">Signature</option>
                            <option value="date">Date</option>
                            <option value="email">Email</option>
                            <option value="text">Text</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">Label</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateSignatureField(index, { ...field, label: e.target.value })}
                            placeholder="e.g., Signer Name"
                            className="bg-gray-800/30 border-gray-700 text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">Page</Label>
                          <Input
                            type="number"
                            min="1"
                            value={field.position.page}
                            onChange={(e) => updateSignatureField(index, { 
                              ...field, 
                              position: { ...field.position, page: parseInt(e.target.value) || 1 }
                            })}
                            className="bg-gray-800/30 border-gray-700 text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">Required</Label>
                          <div className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateSignatureField(index, { ...field, required: e.target.checked })}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-300">Required field</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Placeholder: <code className="bg-gray-900 px-1 rounded">{generatePlaceholder(field)}</code>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSignatureField(index)}
                          className="border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {signatureFields.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                  <p className="text-sm text-blue-300">
                    💡 Use the placeholders above in your contract text. For example: "I, {'{field_1234567890}'}, hereby agree..."
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateContract(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateContract} className="gradient-button hover:bg-purple-700">
              Create Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import {
  FileText,
  Home,
  Download,
  Send,
  Eye,
  Calendar,
  File,
  ArrowLeft,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
  Ban,
  X,
  Key,
  Share2,
  Plus
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
  organization_id: string
  signature_fields?: any[]
}

interface AccessCode {
  id: string
  contract_id: string
  access_code: string
  expires_at?: string
  max_uses: number
  current_uses: number
  created_at: string
  created_by: string
}

export default function ContractViewPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [showGenerateCode, setShowGenerateCode] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [newCodeForm, setNewCodeForm] = useState({
    expires_at: '',
    max_uses: 1
  })
  const [userAccessLevel, setUserAccessLevel] = useState<number | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [hasEditAccess, setHasEditAccess] = useState(false)
  const [accessCode, setAccessCode] = useState<string>('')
  const [showAccessDialog, setShowAccessDialog] = useState(false)
  const [isExternalUser, setIsExternalUser] = useState(false)

  // CRUD states
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    contract_text: '',
    category: '',
    status: ''
  })

  // Edit signature fields state
  const [editSignatureFields, setEditSignatureFields] = useState<any[]>([])
  const [showFieldLabelDialog, setShowFieldLabelDialog] = useState(false)
  const [selectedTextForField, setSelectedTextForField] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState('name')
  
  // Field mode state
  const [fieldMode, setFieldMode] = useState(false)
  const [inlineFieldMode, setInlineFieldMode] = useState(false)
  const [inlineFieldStart, setInlineFieldStart] = useState(0)
  const [inlineFieldEnd, setInlineFieldEnd] = useState(0)
  const [inlineFieldText, setInlineFieldText] = useState('')
  const [inlineFieldLabel, setInlineFieldLabel] = useState('')
  const [inlineFieldType, setInlineFieldType] = useState('name')

  // Pagination states - Use consistent page size
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(1500) // Match edit dialog page size for consistency

  // Edit dialog pagination states
  const [editCurrentPage, setEditCurrentPage] = useState(1)
  const [editItemsPerPage] = useState(1500) // Same as view page
  const [editPages, setEditPages] = useState<string[]>([])

  useEffect(() => {
    if (params.id) {
      // Check if there's an access code in the URL
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      
      if (code) {
        // External user with access code
        setAccessCode(code)
        setIsExternalUser(true)
        fetchContractByCode(code)
      } else if (user) {
        // Authenticated user
        fetchContract()
        fetchAccessCodes()
      } else {
        // No user and no access code - show access dialog
        setShowAccessDialog(true)
      }
    }
  }, [params.id, user])

  // Check user's access level and ownership for the contract's organization
  useEffect(() => {
    if (contract?.organization_id && user) {
      checkUserAccess()
    }
  }, [contract?.organization_id, user])

  const checkUserAccess = async () => {
    if (!contract?.organization_id || !user) {
      console.log('🔍 Debug: checkUserAccess - No contract org ID or user:', { 
        hasOrgId: !!contract?.organization_id, 
        hasUser: !!user,
        isExternalUser 
      })
      return
    }

    try {
      console.log('🔍 Debug: Checking access for user:', user.id, 'in organization:', contract.organization_id)
      
      // Check if user is organization owner
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('owner_id')
        .eq('id', contract.organization_id)
        .single()

      console.log('🔍 Debug: Organization check result:', { orgData, orgError })

      if (!orgError && orgData) {
        const userIsOwner = orgData.owner_id === user.id
        setIsOwner(userIsOwner)
        console.log('🔍 Debug: User is owner:', userIsOwner)
        
        if (userIsOwner) {
          setUserAccessLevel(5)
          setHasEditAccess(true)
          return
        }
      }

      // Check user's access level in organization staff
      const { data: staffData, error: staffError } = await supabase
        .from('organization_staff')
        .select('access_level')
        .eq('user_id', user.id)
        .eq('organization_id', contract.organization_id)
        .single()

      console.log('🔍 Debug: Staff check result:', { staffData, staffError })

      if (!staffError && staffData) {
        const accessLevel = staffData.access_level
        setUserAccessLevel(accessLevel)
        setHasEditAccess(accessLevel >= 4)
        console.log('🔍 Debug: User access level:', accessLevel, 'Has edit access:', accessLevel >= 4)
      } else {
        setUserAccessLevel(null)
        setHasEditAccess(false)
        console.log('🔍 Debug: No staff record found, setting no access')
      }
    } catch (error) {
      console.error('Error checking user access:', error)
      setUserAccessLevel(null)
      setHasEditAccess(false)
    }
  }



  const fetchContractByCode = async (code: string) => {
    try {
      setLoading(true)
      console.log('🔍 Debug: Fetching contract with access code:', code)
      
      const response = await fetch(`/api/contract-access?code=${code}`)
      const data = await response.json()
      
      console.log('🔍 Debug: Contract access API response:', data)
      
      if (response.ok && data.contract) {
        setContract(data.contract)
        // For external users, we might not have organization details
        if (data.contract.organization_id) {
          try {
            const { data: org } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', data.contract.organization_id)
              .single()
            setOrganization(org)
          } catch (orgError) {
            console.log('🔍 Debug: Could not fetch organization details for external user')
          }
        }
      } else {
        throw new Error(data.error || 'Invalid access code')
      }
    } catch (error: any) {
      console.error('Error fetching contract by code:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load contract",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchContract = async () => {
    try {
      setLoading(true)
      console.log('🔍 Debug: Fetching contract for authenticated user')
      
      const response = await fetch(`/api/contracts?id=${params.id}`)
      const data = await response.json()
      
      console.log('🔍 Debug: Contracts API response:', data)
      
      if (response.ok && data.contract) {
        setContract(data.contract)
        // Fetch organization details
        if (data.contract.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', data.contract.organization_id)
            .single()
          setOrganization(org)
        }
      } else {
        throw new Error(data.error || 'Contract not found')
      }
    } catch (error: any) {
      console.error('Error fetching contract:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to load contract",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAccessCodes = async () => {
    try {
      const response = await fetch(`/api/contract-access?contract_id=${params.id}`)
      const data = await response.json()
      
      if (response.ok && data.access_codes) {
        setAccessCodes(data.access_codes)
      } else {
        // No access codes found, set empty array
        setAccessCodes([])
      }
    } catch (error) {
      console.error('Error fetching access codes:', error)
      // Set empty array on error so page still loads
      setAccessCodes([])
    }
  }

  const generateAccessCode = async () => {
    try {
      setGeneratingCode(true)
      const response = await fetch('/api/contract-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: params.id,
          expires_at: newCodeForm.expires_at || null,
          max_uses: newCodeForm.max_uses
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Access code generated successfully"
        })
        setShowGenerateCode(false)
        setNewCodeForm({ expires_at: '', max_uses: 1 })
        fetchAccessCodes() // Refresh the list
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate access code",
        variant: "destructive"
      })
    } finally {
      setGeneratingCode(false)
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Text copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  const copyAccessLink = async (code: string) => {
    const link = `${window.location.origin}/sign-contract?code=${code}`
    
    // Try to use native sharing if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Contract: ${contract?.title || 'Contract'}`,
          text: `Please review and sign this contract: ${contract?.title || 'Contract'}`,
          url: link
        })
        toast({
          title: "Shared!",
          description: "Contract shared successfully"
        })
        return
      } catch (error) {
        // If sharing is cancelled or fails, fall back to clipboard
        console.log('Native sharing failed, falling back to clipboard')
      }
    }
    
    // Fallback to clipboard copy
    try {
      await navigator.clipboard.writeText(link)
      toast({
        title: "Link Copied!",
        description: "Contract access link copied to clipboard"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive"
      })
    }
  }

  // CRUD Functions
  const handleEdit = () => {
    if (contract) {
      setEditForm({
        title: contract.title,
        description: contract.description || '',
        contract_text: contract.contract_text,
        category: contract.category,
        status: contract.status
      })
      setEditPages(splitTextIntoPages(contract.contract_text))
      setEditCurrentPage(1)
      setEditSignatureFields(contract.signature_fields || [])
      setShowEditDialog(true)
    }
  }

  const handleUpdateContract = async () => {
    if (!contract) return
    
    try {
      setEditing(true)
      const response = await fetch(`/api/contracts?id=${contract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          signature_fields: editSignatureFields
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract updated successfully"
        })
        setShowEditDialog(false)
        fetchContract() // Refresh contract data
      } else {
        throw new Error(data.error || 'Failed to update contract')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update contract",
        variant: "destructive"
      })
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteContract = async () => {
    if (!contract) return
    
    try {
      setDeleting(true)
      const response = await fetch(`/api/contracts?id=${contract.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract deleted successfully"
        })
        router.push('/contract-library')
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete contract')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete contract",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
    }
  }

  // Pagination functions
  const getPaginatedText = () => {
    if (!contract?.contract_text) return { text: '', totalPages: 1 }
    
    const text = contract.contract_text
    const totalPages = Math.ceil(text.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    
    return {
      text: text.slice(startIndex, endIndex),
      totalPages
    }
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const nextPage = () => {
    const { totalPages } = getPaginatedText()
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Edit dialog pagination functions - Uses same page size as view pagination
  const splitTextIntoPages = (text: string) => {
    const pages: string[] = []
    for (let i = 0; i < text.length; i += editItemsPerPage) {
      pages.push(text.slice(i, i + editItemsPerPage))
    }
    return pages
  }

  // Function to handle text selection in field mode
  const handleTextSelection = () => {
    if (!fieldMode) return
    
    const textarea = document.getElementById('contract_text') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)

    if (selectedText.trim() && start !== end) {
      // Enter inline field mode
      setInlineFieldMode(true)
      setInlineFieldStart(start)
      setInlineFieldEnd(end)
      setInlineFieldText(selectedText)
      setInlineFieldLabel(selectedText.trim())
      setInlineFieldType('name')
      
      // Temporarily replace selected text with purple-highlighted version
      const currentText = editPages[editCurrentPage - 1]
      const newText = currentText.substring(0, start) + `[PURPLE]${selectedText}[/PURPLE]` + currentText.substring(end)
      updateEditPage(editCurrentPage - 1, newText)
      
      // Focus the textarea
      textarea.focus()
    }
  }

  // Function to convert selected text to signature field (manual button)
  const convertSelectionToField = () => {
    const textarea = document.getElementById('contract_text') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)

    if (!selectedText.trim()) {
      toast({
        title: "No text selected",
        description: "Please select some text to convert to a signature field",
        variant: "destructive"
      })
      return
    }

    // Enter inline field mode
    setInlineFieldMode(true)
    setInlineFieldStart(start)
    setInlineFieldEnd(end)
    setInlineFieldText(selectedText)
    setInlineFieldLabel(selectedText.trim())
    setInlineFieldType('name')
    
    // Focus the textarea
    textarea.focus()
  }

  const saveInlineField = () => {
    if (!inlineFieldLabel.trim()) {
      toast({
        title: "Label required",
        description: "Please enter a label for the field",
        variant: "destructive"
      })
      return
    }

    const textarea = document.getElementById('contract_text') as HTMLTextAreaElement
    if (!textarea) return

    // Create new field
    const newField = {
      id: `field_${Date.now()}`,
      type: inlineFieldType,
      label: inlineFieldLabel,
      placeholder: inlineFieldText, // Use original text as placeholder
      required: true,
      position: { page: editCurrentPage, x: 100, y: 200 },
      placeholder_text: inlineFieldText
    }

    // Add field to list
    setEditSignatureFields([...editSignatureFields, newField])

    // Keep original text, just remove purple tags
    const currentText = editPages[editCurrentPage - 1]
    const purpleText = `[PURPLE]${inlineFieldText}[/PURPLE]`
    const newText = currentText.replace(purpleText, inlineFieldText)
    updateEditPage(editCurrentPage - 1, newText)

    // Exit inline mode
    setInlineFieldMode(false)
    setInlineFieldStart(0)
    setInlineFieldEnd(0)
    setInlineFieldText('')
    setInlineFieldLabel('')
    setInlineFieldType('name')

    toast({
      title: "Field created",
      description: `"${inlineFieldText}" converted to signature field "${inlineFieldLabel}"`
    })
  }

  const cancelInlineField = () => {
    // Restore original text by removing purple tags
    const currentText = editPages[editCurrentPage - 1]
    const purpleText = `[PURPLE]${inlineFieldText}[/PURPLE]`
    const newText = currentText.replace(purpleText, inlineFieldText)
    updateEditPage(editCurrentPage - 1, newText)

    // Exit inline mode
    setInlineFieldMode(false)
    setInlineFieldStart(0)
    setInlineFieldEnd(0)
    setInlineFieldText('')
    setInlineFieldLabel('')
    setInlineFieldType('name')
  }



  const confirmCreateField = () => {
    const textarea = document.getElementById('contract_text') as HTMLTextAreaElement
    if (!textarea || !selectedTextForField) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    // Create new field
    const newField = {
      id: `field_${Date.now()}`,
      type: newFieldType,
      label: newFieldLabel,
      placeholder: `{{field_${Date.now()}}}`,
      required: true,
      position: { page: editCurrentPage, x: 100, y: 200 },
      placeholder_text: selectedTextForField
    }

    // Add field to list
    setEditSignatureFields([...editSignatureFields, newField])

    // Replace selected text with placeholder
    const newText = textarea.value.substring(0, start) + newField.placeholder + textarea.value.substring(end)
    updateEditPage(editCurrentPage - 1, newText)

    // Clear selection and close dialog
    textarea.setSelectionRange(start, start + newField.placeholder.length)
    textarea.focus()
    setShowFieldLabelDialog(false)

    toast({
      title: "Field created",
      description: `"${selectedTextForField}" converted to signature field "${newFieldLabel}"`
    })
  }

  const updateEditPage = (pageIndex: number, newText: string) => {
    const newPages = [...editPages]
    newPages[pageIndex] = newText
    setEditPages(newPages)
    
    // Update the main editForm with combined text
    const combinedText = newPages.join('')
    setEditForm(prev => ({ ...prev, contract_text: combinedText }))
  }

  const addNewPage = () => {
    setEditPages([...editPages, ''])
    setEditCurrentPage(editPages.length + 1)
  }

  const removePage = (pageIndex: number) => {
    if (editPages.length > 1) {
      const newPages = editPages.filter((_, index) => index !== pageIndex)
      setEditPages(newPages)
      
      // Update the main editForm
      const combinedText = newPages.join('')
      setEditForm(prev => ({ ...prev, contract_text: combinedText }))
      
      // Adjust current page if needed
      if (editCurrentPage > newPages.length) {
        setEditCurrentPage(newPages.length)
      }
    }
  }

  // Signature field management functions for edit dialog
  const addEditSignatureField = () => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'name',
      label: '',
      placeholder: '',
      required: true,
      position: { page: 1, x: 100, y: 200 },
      placeholder_text: '_____________'
    }
    setEditSignatureFields([...editSignatureFields, newField])
  }

  const updateEditSignatureField = (index: number, field: any) => {
    const updatedFields = [...editSignatureFields]
    updatedFields[index] = field
    setEditSignatureFields(updatedFields)
  }

  const removeEditSignatureField = (index: number) => {
    setEditSignatureFields(editSignatureFields.filter((_, i) => i !== index))
  }

  const generateEditPlaceholder = (field: any) => {
    return `{{${field.id}}}`
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading contract...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Contract not found</p>
            <Button
              onClick={() => router.push('/contract-library')}
              className="gradient-button hover:bg-purple-700"
            >
              Back to Contract Library
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
                href="/contract-library"
                className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
              >
                <ArrowLeft className="w-6 h-6 mr-2" />
                <span className="hidden sm:inline">Back to Library</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <div className="flex items-center gap-4">
                <h1 className="text-xl sm:text-3xl font-bold text-white">
                  {contract.title}
                </h1>
                {getStatusBadge(contract.status)}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hasEditAccess && (
                <>
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="border-gray-700 bg-gray-800/30 text-white hover:bg-blue-900/20 hover:text-blue-400"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Edit Contract</span>
                    <span className="sm:hidden">Edit</span>
                  </Button>
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="outline"
                    className="border-gray-700 bg-gray-800/30 text-white hover:bg-red-900/20 hover:text-red-400"
                  >
                    <X className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Delete Contract</span>
                    <span className="sm:hidden">Delete</span>
                  </Button>
                </>
              )}
              <Button
                onClick={() => {
                  if (accessCodes.length > 0) {
                    copyAccessLink(accessCodes[0].access_code)
                  } else {
                    toast({
                      title: "No Access Code",
                      description: "Generate an access code first to share this contract",
                      variant: "destructive"
                    })
                  }
                }}
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
              >
                <Share2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Share Contract</span>
                <span className="sm:hidden">Share</span>
              </Button>
              {hasEditAccess && (
                <Dialog open={showGenerateCode} onOpenChange={setShowGenerateCode}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Generate Access Code</span>
                      <span className="sm:hidden">Code</span>
                    </Button>
                  </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle>Generate Access Code</DialogTitle>
                    <DialogDescription>
                      Create an access code to share this contract with others
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Expiration Date (Optional)</Label>
                      <DatePicker
                        date={newCodeForm.expires_at ? new Date(newCodeForm.expires_at) : undefined}
                        onDateChange={(date) => setNewCodeForm({ 
                          ...newCodeForm, 
                          expires_at: date ? date.toISOString() : '' 
                        })}
                        placeholder="Select expiration date"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Uses</Label>
                      <Input
                        type="number"
                        min="1"
                        value={newCodeForm.max_uses}
                        onChange={(e) => setNewCodeForm({ ...newCodeForm, max_uses: parseInt(e.target.value) || 1 })}
                        className="bg-gray-800/30 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowGenerateCode(false)} className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400">
                      Cancel
                    </Button>
                    <Button onClick={generateAccessCode} disabled={generatingCode} className="gradient-button hover:bg-purple-700">
                      {generatingCode ? 'Generating...' : 'Generate Code'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
                </Dialog>
              )}
              <Button
                onClick={() => router.push(`/sign-contract?contract_id=${contract.id}`)}
                className="gradient-button hover:bg-purple-700"
              >
                <Send className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Send for Signature</span>
                <span className="sm:hidden">Sign</span>
              </Button>
              {contract.file_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(contract.file_url, '_blank')}
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Download File</span>
                  <span className="sm:hidden">Download</span>
                </Button>
              )}
              
              {/* Access Level Information */}
              {!hasEditAccess && userAccessLevel && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    <strong>Access Restricted:</strong> You have Access Level {userAccessLevel}. 
                    Only users with Access Level 4 or 5 can edit contracts.
                  </p>
                </div>
              )}
              
              {/* Access Level Information */}
              {!hasEditAccess && userAccessLevel && !isExternalUser && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                  <p className="text-yellow-300 text-sm">
                    <strong>Access Restricted:</strong> You have Access Level {userAccessLevel}. 
                    Only users with Access Level 4 or 5 can edit contracts.
                  </p>
                </div>
              )}
              
              {/* External User Notice */}
              {isExternalUser && (
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-blue-300 text-sm">
                    <strong>External Access:</strong> You are viewing this contract using an access code.
                    You have read-only access.
                  </p>
                </div>
              )}
              
              {/* Debug Information */}
              <div className="mt-4 p-3 bg-gray-900/20 border border-gray-700/50 rounded-lg">
                <p className="text-gray-300 text-sm">
                  <strong>Debug Info:</strong> User: {user ? 'Authenticated' : 'Not authenticated'}, 
                  Access Level: {userAccessLevel || 'None'}, 
                  Is Owner: {isOwner ? 'Yes' : 'No'}, 
                  Has Edit Access: {hasEditAccess ? 'Yes' : 'No'}, 
                  Is External: {isExternalUser ? 'Yes' : 'No'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract Details */}
          <div className="leonardo-card p-6">
            <div className="mb-6">
              {/* Main Title and Status - Most Prominent */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{contract.title}</h1>
                <div className="flex items-center gap-2">
                  {getStatusBadge(contract.status)}
                </div>
              </div>
              
              {/* Description - Secondary but still visible */}
              {contract.description && (
                <p className="text-base sm:text-lg text-gray-300 mb-4">{contract.description}</p>
              )}
              
              {/* Category - Less prominent */}
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm text-gray-400">Category:</span>
                <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-800/30">
                  {contract.category}
                </Badge>
              </div>
            </div>

            {/* Secondary Details - Collapsible or less prominent */}
            <div className="border-t border-gray-700 pt-4">
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 flex items-center gap-2">
                  <span>Additional Details</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created:</span>
                    <span className="text-gray-300">{new Date(contract.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="text-gray-300">{new Date(contract.updated_at).toLocaleDateString()}</span>
                  </div>
                  {contract.expires_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expires:</span>
                      <span className="text-gray-300">{new Date(contract.expires_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">File Type:</span>
                    <span className="text-gray-300">{contract.file_name || 'Text Contract'}</span>
                  </div>
                  {organization && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Organization:</span>
                      <span className="text-gray-300">{organization.name}</span>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>

          {/* Contract Content */}
          <div className="lg:col-span-2">
            <div className="leonardo-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Contract Content</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(contract.contract_text)}
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Text
                </Button>
              </div>
              
              {contract.file_url ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span>This contract has an uploaded file</span>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                    <p className="text-white mb-2">File: {contract.file_name}</p>
                    <p className="text-gray-400 text-sm mb-4">Type: {contract.file_type}</p>
                    <Button
                      onClick={() => window.open(contract.file_url, '_blank')}
                      className="gradient-button hover:bg-purple-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                  {contract.contract_text && contract.contract_text !== `Uploaded file: ${contract.file_name}` && (
                    <div>
                      <h4 className="text-md font-semibold text-white mb-2">Additional Notes</h4>
                      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                        <pre className="text-white whitespace-pre-wrap font-sans">{contract.contract_text}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 mb-4 relative">
                    <pre className="text-white whitespace-pre-wrap font-sans">
                      {getPaginatedText().text}
                    </pre>
                    
                    {/* Highlight labeled fields in contract view */}
                    {contract.signature_fields && contract.signature_fields.map((field, index) => {
                      const text = getPaginatedText().text
                      const fieldText = field.placeholder_text || field.label
                      const startIndex = text.indexOf(fieldText)
                      
                      if (startIndex !== -1) {
                        return (
                          <div
                            key={field.id || index}
                            className="absolute pointer-events-none bg-purple-500/40 border border-purple-400/60 rounded px-1"
                            style={{
                              left: '16px',
                              top: `${16 + (startIndex / 50) * 20}px`,
                              width: `${fieldText.length * 8}px`,
                              height: '20px',
                              zIndex: 10
                            }}
                          />
                        )
                      }
                      return null
                    })}
                  </div>
                  
                  {/* Pagination Controls */}
                  {getPaginatedText().totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <Button
                          onClick={prevPage}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400 disabled:opacity-50"
                        >
                          ← Previous
                        </Button>
                        <span className="text-gray-400 text-sm">
                          Page {currentPage} of {getPaginatedText().totalPages}
                        </span>
                        <Button
                          onClick={nextPage}
                          disabled={currentPage === getPaginatedText().totalPages}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400 disabled:opacity-50"
                        >
                          Next →
                        </Button>
                      </div>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center gap-1 justify-center sm:justify-start flex-wrap">
                        {Array.from({ length: Math.min(5, getPaginatedText().totalPages) }, (_, i) => {
                          const pageNum = i + 1
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className={
                                currentPage === pageNum
                                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                                  : "border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                              }
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                        {getPaginatedText().totalPages > 5 && (
                          <span className="text-gray-400 text-sm mx-2">...</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Signature Fields */}
        {contract.signature_fields && contract.signature_fields.length > 0 && (
          <div className="leonardo-card p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Signature Fields</h2>
              <Badge variant="outline" className="border-gray-600 text-gray-300 bg-gray-800/30">
                {contract.signature_fields.length} fields
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contract.signature_fields.map((field, index) => (
                <div key={field.id || index} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm sm:text-base">{field.label || `Field ${index + 1}`}</span>
                    <Badge 
                      variant="outline" 
                      className={`${
                        field.type === 'signature' ? 'border-purple-600 text-purple-400' :
                        field.type === 'name' ? 'border-blue-600 text-blue-400' :
                        field.type === 'date' ? 'border-green-600 text-green-400' :
                        'border-gray-600 text-gray-400'
                      } bg-gray-800/30 text-xs`}
                    >
                      {field.type}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Page:</span>
                      <span className="text-white">{field.position?.page || 1}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Required:</span>
                      <span className="text-white">{field.required ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Placeholder:</span>
                      <code className="text-blue-400 bg-gray-900 px-1 rounded text-xs">
                        {field.placeholder || `{{${field.id}}}`}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 These fields will be collected when someone signs this contract. Use the placeholders in your contract text.
              </p>
            </div>
          </div>
        )}

        {/* Access Codes - Moved to bottom */}
        <div className="leonardo-card p-6 mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-white">Access Codes</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGenerateCode(true)}
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
            >
              <Key className="w-4 h-4 mr-2" />
              New Code
            </Button>
          </div>
          
          {accessCodes.length === 0 ? (
            <p className="text-gray-400 text-center py-4">No access codes generated yet</p>
          ) : (
            <div className="space-y-3">
              {accessCodes.map((code) => (
                <div key={code.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <span className="text-white font-mono text-sm break-all">{code.access_code}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code.access_code)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyAccessLink(code.access_code)}
                        className="text-gray-400 hover:text-white"
                      >
                        <Share2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-400">
                    <span>Uses: {code.current_uses}/{code.max_uses}</span>
                    {code.expires_at && (
                      <span>Expires: {new Date(code.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Contract Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Contract</DialogTitle>
            <DialogDescription>
              Update the contract details and content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="bg-gray-800/30 border-gray-700 text-white"
                  placeholder="Contract title"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="bg-gray-800/30 border-gray-700 text-white"
                  placeholder="Contract category"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="bg-gray-800/30 border-gray-700 text-white"
                placeholder="Contract description"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full bg-gray-800/30 border border-gray-700 text-white rounded-md px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="signed">Signed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <Label htmlFor="contract_text">Contract Text *</Label>
              <div className="space-y-4">
                {/* Page Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 bg-gray-800/30 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    {editPages.length > 1 && (
                      <>
                        <Button
                          onClick={() => setEditCurrentPage(editCurrentPage - 1)}
                          disabled={editCurrentPage === 1}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400 disabled:opacity-50"
                        >
                          ← Previous
                        </Button>
                        <span className="text-gray-300 text-sm">
                          Page {editCurrentPage} of {editPages.length}
                        </span>
                        <Button
                          onClick={() => setEditCurrentPage(editCurrentPage + 1)}
                          disabled={editCurrentPage === editPages.length}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400 disabled:opacity-50"
                        >
                          Next →
                        </Button>
                      </>
                    )}
                    {editPages.length === 1 && (
                      <span className="text-gray-300 text-sm">
                        Single page - Click "Add Page" to create more pages
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <Button
                      onClick={() => setFieldMode(!fieldMode)}
                      variant={fieldMode ? "default" : "outline"}
                      size="sm"
                      className={
                        fieldMode 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "border-gray-700 bg-gray-800/30 text-white hover:bg-blue-900/20 hover:text-blue-400"
                      }
                      title={fieldMode ? "Field mode active - highlight text to create fields" : "Enable field mode"}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">{fieldMode ? 'Field Mode ON' : 'Field Mode'}</span>
                      <span className="sm:hidden">{fieldMode ? 'ON' : 'Mode'}</span>
                    </Button>
                    <Button
                      onClick={convertSelectionToField}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 bg-gray-800/30 text-white hover:bg-blue-900/20 hover:text-blue-400"
                      title="Convert selected text to signature field"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Convert to Field</span>
                      <span className="sm:hidden">Convert</span>
                    </Button>
                    <Button
                      onClick={addNewPage}
                      variant="outline"
                      size="sm"
                      className="border-gray-700 bg-gray-800/30 text-white hover:bg-green-900/20 hover:text-green-400"
                    >
                      + Add Page
                    </Button>
                    {editPages.length > 1 && (
                      <Button
                        onClick={() => removePage(editCurrentPage - 1)}
                        variant="outline"
                        size="sm"
                        className="border-gray-700 bg-gray-800/30 text-white hover:bg-red-900/20 hover:text-red-400"
                      >
                        - Remove Page
                      </Button>
                    )}
                  </div>
                </div>

                {/* Page Numbers */}
                {editPages.length > 1 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {editPages.map((_, index) => (
                      <Button
                        key={index}
                        onClick={() => setEditCurrentPage(index + 1)}
                        variant={editCurrentPage === index + 1 ? "default" : "outline"}
                        size="sm"
                        className={
                          editCurrentPage === index + 1
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                        }
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Field Mode Indicator */}
                {fieldMode && (
                  <div className="mb-2 p-2 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-300 text-sm font-medium">Field Mode Active</span>
                      <span className="text-blue-400 text-sm">Highlight any text to create a signature field</span>
                    </div>
                  </div>
                )}

                {/* Text Editor */}
                <textarea
                  id="contract_text"
                  value={editPages[editCurrentPage - 1] || ''}
                  onChange={(e) => updateEditPage(editCurrentPage - 1, e.target.value)}
                  onMouseUp={handleTextSelection}
                  onKeyUp={handleTextSelection}
                  className={`w-full bg-gray-800/30 border border-gray-700 text-white rounded-md px-3 py-2 min-h-[300px] resize-y ${
                    fieldMode ? 'border-blue-500 ring-1 ring-blue-500' : ''
                  }`}
                  style={{
                    background: editSignatureFields.length > 0 ? 'linear-gradient(45deg, rgba(147, 51, 234, 0.05) 0%, rgba(147, 51, 234, 0.02) 100%)' : undefined
                  }}
                  placeholder={`Enter contract text for page ${editCurrentPage}...`}
                />
                
                {/* Labeled Fields Indicator */}
                {editSignatureFields.length > 0 && (
                  <div className="mt-2 p-2 bg-purple-900/20 border border-purple-700 rounded-lg">
                    <p className="text-sm text-purple-300 mb-2">
                      💜 Labeled Fields ({editSignatureFields.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {editSignatureFields.map((field, index) => (
                        <span 
                          key={field.id} 
                          className="bg-purple-500/40 text-purple-200 px-2 py-1 rounded text-xs"
                        >
                          {field.label}: "{field.placeholder_text}"
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Inline Field Input */}
                {inlineFieldMode && (
                  <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-300 font-medium">Create Signature Field</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-400">Selected Text (will be replaced):</Label>
                        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-2 mt-1">
                          <p className="text-purple-300 font-mono text-sm bg-purple-500/20 px-1 rounded">{inlineFieldText}</p>
                        </div>
                        <p className="text-xs text-purple-400 mt-1">
                          💡 This text is currently highlighted in the textarea above
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>Field Label *</Label>
                          <Input
                            value={inlineFieldLabel}
                            onChange={(e) => setInlineFieldLabel(e.target.value)}
                            placeholder="e.g., Client Name"
                            className="bg-gray-800/30 border-gray-700 text-white"
                            autoFocus
                          />
                        </div>
                        
                        <div>
                          <Label>Field Type</Label>
                          <select
                            value={inlineFieldType}
                            onChange={(e) => setInlineFieldType(e.target.value)}
                            className="w-full bg-gray-800/30 border border-gray-700 text-white rounded-md px-3 py-2"
                          >
                            <option value="name">Name</option>
                            <option value="signature">Signature</option>
                            <option value="date">Date</option>
                            <option value="email">Email</option>
                            <option value="text">Text</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={saveInlineField}
                          disabled={!inlineFieldLabel.trim()}
                          className="gradient-button hover:bg-purple-700 disabled:opacity-50"
                        >
                          Save Field
                        </Button>
                        <Button
                          onClick={cancelInlineField}
                          variant="outline"
                          className="border-gray-700 bg-gray-800/30 text-white hover:bg-red-900/20 hover:text-red-400"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Character Count */}
                <div className="text-xs text-gray-400 flex justify-between">
                  <span>Page {editCurrentPage} characters: {editPages[editCurrentPage - 1]?.length || 0}</span>
                  <span>Total characters: {editForm.contract_text.length}</span>
                </div>
              </div>
            </div>

            {/* Signature Fields Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Signature Fields</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEditSignatureField}
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Field
                </Button>
              </div>
              
              {editSignatureFields.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No signature fields defined. Select text and click "Convert to Field" or add fields manually.
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {editSignatureFields.map((field, index) => (
                    <div key={field.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-400">Field Type</Label>
                          <select
                            value={field.type}
                            onChange={(e) => updateEditSignatureField(index, { ...field, type: e.target.value })}
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
                            onChange={(e) => updateEditSignatureField(index, { ...field, label: e.target.value })}
                            placeholder="e.g., Client Name"
                            className="bg-gray-800/30 border-gray-700 text-white text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-400">Page</Label>
                          <Input
                            type="number"
                            min="1"
                            value={field.position.page}
                            onChange={(e) => updateEditSignatureField(index, { 
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
                              onChange={(e) => updateEditSignatureField(index, { ...field, required: e.target.checked })}
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-300">Required field</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          Placeholder: <code className="bg-gray-900 px-1 rounded">{generateEditPlaceholder(field)}</code>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEditSignatureField(index)}
                          className="border-red-700 bg-red-900/20 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {editSignatureFields.length > 0 && (
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                  <p className="text-sm text-blue-300">
                    💡 These fields will be collected when someone signs this contract. The placeholders are already in your contract text.
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateContract}
              disabled={editing || !editForm.title.trim() || !editForm.contract_text.trim()}
              className="gradient-button hover:bg-purple-700 disabled:opacity-50"
            >
              {editing ? 'Updating...' : 'Update Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Label Dialog */}
      <Dialog open={showFieldLabelDialog} onOpenChange={setShowFieldLabelDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Create Signature Field</DialogTitle>
            <DialogDescription>
              Set the label for this signature field
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm text-gray-400">Selected Text:</Label>
              <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 mt-1">
                <p className="text-white font-mono text-sm">{selectedTextForField}</p>
              </div>
            </div>
            
            <div>
              <Label>Field Label *</Label>
              <Input
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                placeholder="e.g., Client Name, Signature, Date"
                className="bg-gray-800/30 border-gray-700 text-white"
              />
            </div>
            
            <div>
              <Label>Field Type</Label>
              <select
                value={newFieldType}
                onChange={(e) => setNewFieldType(e.target.value)}
                className="w-full bg-gray-800/30 border border-gray-700 text-white rounded-md px-3 py-2"
              >
                <option value="name">Name</option>
                <option value="signature">Signature</option>
                <option value="date">Date</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowFieldLabelDialog(false)}
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmCreateField}
              disabled={!newFieldLabel.trim()}
              className="gradient-button hover:bg-purple-700 disabled:opacity-50"
            >
              Create Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Access Code Dialog */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Access Required</DialogTitle>
            <DialogDescription>
              Enter an access code to view this contract
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Access Code</Label>
              <Input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter your access code"
                className="bg-gray-800/30 border-gray-700 text-white"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAccessDialog(false)}
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-red-900/20 hover:text-red-400"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (accessCode.trim()) {
                  fetchContractByCode(accessCode.trim())
                  setShowAccessDialog(false)
                }
              }}
              disabled={!accessCode.trim()}
              className="gradient-button hover:bg-purple-700 disabled:opacity-50"
            >
              Access Contract
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contract Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Delete Contract</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{contract?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-400">
              This will permanently delete the contract and all associated signatures and access codes.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeleteContract}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete Contract'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
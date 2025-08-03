"use client"

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  PenTool, 
  Save, 
  User, 
  Edit3,
  RotateCcw,
  Trash2,
  Clock,
  AlertCircle,
  Send,
  CheckCircle,
  Ban,
  X
} from 'lucide-react'
import { Contract, ContractSignature, ContractStatus } from '@/types/contract-library'
import jsPDF from 'jspdf'

interface Placeholder {
  id: string
  original: string
  type: 'name' | 'date' | 'signature' | 'text'
  start: number
  end: number
  value: string
  suggested?: string
}

function SignContractContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [contract, setContract] = useState<Contract | null>(null)
  const [signatures, setSignatures] = useState<ContractSignature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accessCode, setAccessCode] = useState<string>('')
  const [showAccessDialog, setShowAccessDialog] = useState(false)
  const [showSignatureDialog, setShowSignatureDialog] = useState(false)
  const [showPlaceholderDialog, setShowPlaceholderDialog] = useState(false)
  
  // Placeholder management
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([])
  const [processedText, setProcessedText] = useState<string>('')
  
  // Signature form
  const [signatureForm, setSignatureForm] = useState({
    signer_name: '',
    signer_email: '',
    signature_data: ''
  })

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureImage, setSignatureImage] = useState<string>('')

  // Pagination states - Use consistent page size
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(1500) // Match contract-library page size for consistency

  const contractId = searchParams.get('contract_id')
  const code = searchParams.get('code')

  useEffect(() => {
    if (code) {
      fetchContractByCode(code)
    } else if (contractId) {
      fetchContract()
    } else {
      setShowAccessDialog(true)
    }
  }, [contractId, code])

  // Debug canvas rendering
  useEffect(() => {
    console.log('Canvas ref current:', canvasRef.current)
    if (canvasRef.current) {
      console.log('Canvas element found:', canvasRef.current)
      console.log('Canvas dimensions:', canvasRef.current.width, 'x', canvasRef.current.height)
    }
  }, [])

  // Process contract text to find placeholders
  useEffect(() => {
    if (contract?.contract_text) {
      processContractText(contract.contract_text)
    }
  }, [contract])

  // Initialize canvas when dialog opens
  useEffect(() => {
    if (showSignatureDialog && canvasRef.current) {
      console.log('Dialog opened, initializing canvas')
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Get the display size
        const rect = canvas.getBoundingClientRect()
        
        // Set canvas size to match display size
        canvas.width = rect.width
        canvas.height = rect.height
        
        // Set drawing styles
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        console.log('Canvas initialized with size:', canvas.width, 'x', canvas.height)
      } else {
        console.log('Failed to get canvas context')
      }
    } else {
      console.log('Dialog not open or canvas ref not available')
    }
  }, [showSignatureDialog])

  const processContractText = (text: string) => {
    const foundPlaceholders: Placeholder[] = []
    let processedText = text

    // Common placeholder patterns - simplified and more reliable
    const patterns = [
      // Underscores: ___, _____, etc.
      { regex: /_{3,}/g, type: 'text' as const },
      // Parentheses: (name), (date), (signature), etc.
      { regex: /\(([^)]+)\)/g, type: 'text' as const },
      // Brackets: [name], [date], [signature], etc.
      { regex: /\[([^\]]+)\]/g, type: 'text' as const },
      // Curly braces: {name}, {date}, {signature}, etc.
      { regex: /\{([^}]+)\}/g, type: 'text' as const },
      // Signature patterns: Signature____, Signature______, etc.
      { regex: /Signature_{3,}/g, type: 'signature' as const }
    ]

    patterns.forEach((pattern, index) => {
      const matches = [...text.matchAll(pattern.regex)]
      matches.forEach((match, matchIndex) => {
        const placeholder: Placeholder = {
          id: `placeholder-${index}-${matchIndex}`,
          original: match[0],
          type: pattern.type,
          start: match.index!,
          end: match.index! + match[0].length,
          value: '',
          suggested: getSuggestedValue(pattern.type, match[1] || match[0])
        }
        foundPlaceholders.push(placeholder)
      })
    })

    // Sort by position in text
    foundPlaceholders.sort((a, b) => a.start - b.start)

    console.log('Found placeholders:', foundPlaceholders) // Debug log

    setPlaceholders(foundPlaceholders)
    setProcessedText(processedText)
  }

  const getSuggestedValue = (type: string, original: string): string => {
    switch (type) {
      case 'date':
        return new Date().toLocaleDateString()
      case 'name':
        return (user as any)?.user_metadata?.full_name || user?.email || ''
      case 'signature':
        return (user as any)?.user_metadata?.full_name || user?.email || '[DIGITAL SIGNATURE]'
      default:
        if (original.toLowerCase().includes('date')) {
          return new Date().toLocaleDateString()
        }
        if (original.toLowerCase().includes('name')) {
          return (user as any)?.user_metadata?.full_name || user?.email || ''
        }
        if (original.toLowerCase().includes('signature')) {
          return '[DIGITAL SIGNATURE]'
        }
        return ''
    }
  }

  const updatePlaceholder = (id: string, value: string) => {
    setPlaceholders(prev => prev.map(p => 
      p.id === id ? { ...p, value } : p
    ))
  }

  const autoFillAll = () => {
    setPlaceholders(prev => prev.map(p => ({
      ...p,
      value: p.suggested || ''
    })))
  }

  const getFinalContractText = (): string => {
    let finalText = contract?.contract_text || ''
    placeholders.forEach(placeholder => {
      if (placeholder.value) {
        finalText = finalText.replace(placeholder.original, placeholder.value)
      }
    })
    return finalText
  }

  // Signature drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set drawing properties for black signature
    ctx.strokeStyle = '#000000' // Black color
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    ctx.beginPath()
    ctx.moveTo(
      (clientX - rect.left) * scaleX,
      (clientY - rect.top) * scaleY
    )
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    ctx.lineTo(
      (clientX - rect.left) * scaleX,
      (clientY - rect.top) * scaleY
    )
    ctx.stroke()
  }

  const stopDrawing = () => {
    console.log('Stopping drawing')
    setIsDrawing(false)
    saveSignature()
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.log('Canvas not found for saving')
      return
    }

    // Create a new canvas with white background and black signature
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    
    if (tempCtx) {
      // Fill with white background
      tempCtx.fillStyle = '#ffffff'
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)
      
      // Draw the original canvas content (which should be black on transparent)
      tempCtx.drawImage(canvas, 0, 0)
    }

    const imageData = tempCanvas.toDataURL('image/png')
    console.log('Saving signature, image data length:', imageData.length)
    
    setSignatureImage(imageData)
    setSignatureForm(prev => {
      const updated = { ...prev, signature_data: imageData }
      console.log('Updated signature form:', updated)
      return updated
    })
    
    // Show toast notification
    toast({
      title: "Signature Saved",
      description: "Your signature has been saved successfully",
    })
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureImage('')
    setSignatureForm(prev => ({ ...prev, signature_data: '' }))
  }

  const fetchContract = async () => {
    try {
      setLoading(true)
      // For authenticated users, use the regular contracts API
      const response = await fetch(`/api/contracts?id=${contractId}`)
      const data = await response.json()
      
      console.log('Fetch contract response:', data)
      
      if (response.ok && data.contract) {
        setContract(data.contract)
        setSignatures(data.contract.signatures || [])
        console.log('Contract loaded with signatures:', data.contract.signatures?.length || 0)
        console.log('Signature details:', data.contract.signatures?.map((s: any) => ({
          id: s.id,
          name: s.signer_name,
          hasData: !!s.signature_data,
          dataLength: s.signature_data?.length
        })))
      } else {
        // If regular API fails, try the contract-access API as fallback
        const fallbackResponse = await fetch(`/api/contract-access?contract_id=${contractId}`)
        const fallbackData = await fallbackResponse.json()
        
        console.log('Fallback response:', fallbackData)
        
        if (fallbackResponse.ok && fallbackData.contract) {
          setContract(fallbackData.contract)
          setSignatures(fallbackData.contract.signatures || [])
          console.log('Contract loaded via fallback with signatures:', fallbackData.contract.signatures?.length || 0)
        } else {
          setError(fallbackData.error || data.error || 'Failed to load contract')
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      setError('Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  const fetchContractByCode = async (code: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contract-access?code=${code}`)
      const data = await response.json()
      
      if (response.ok && data.contract) {
        setContract(data.contract)
        setSignatures(data.contract.signatures || [])
      } else {
        setError(data.error || 'Failed to load contract')
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      setError('Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  const handleAccessCodeSubmit = async () => {
    if (!accessCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an access code",
        variant: "destructive"
      })
      return
    }

    await fetchContractByCode(accessCode)
    setShowAccessDialog(false)
  }

  const handleSignatureSubmit = async () => {
    if (!signatureForm.signer_name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive"
      })
      return
    }

    if (!signatureForm.signature_data) {
      toast({
        title: "Error",
        description: "Please draw your signature first",
        variant: "destructive"
      })
      return
    }

    console.log('Submitting signature with data:', {
      signer_name: signatureForm.signer_name,
      signer_email: signatureForm.signer_email,
      signature_data_length: signatureForm.signature_data.length,
      contract_id: contract?.id
    })

    try {
      const finalContractText = getFinalContractText()
      
      const response = await fetch('/api/contract-signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contract_id: contract?.id,
          signer_name: signatureForm.signer_name,
          signer_email: signatureForm.signer_email,
          signature_data: signatureForm.signature_data,
          filled_contract_text: finalContractText
        })
      })

      const data = await response.json()
      console.log('Signature submission response:', data)
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract signed successfully"
        })
        setShowSignatureDialog(false)
        setSignatureForm({
          signer_name: '',
          signer_email: '',
          signature_data: ''
        })
        // Refresh contract data
        if (code) {
          await fetchContractByCode(code)
        } else if (contractId) {
          await fetchContract()
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      console.error('Signature submission error:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to sign contract",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: ContractStatus) => {
    const statusConfig = {
      draft: { color: 'bg-gray-500', icon: Clock },
      pending: { color: 'bg-yellow-500', icon: AlertCircle },
      sent: { color: 'bg-blue-500', icon: Send },
      signed: { color: 'bg-green-500', icon: CheckCircle },
      expired: { color: 'bg-red-500', icon: Ban },
      cancelled: { color: 'bg-gray-400', icon: X }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const canSign = contract && ['pending', 'sent'].includes(contract.status)

  // Function to make contract signable for testing
  const makeContractSignable = async () => {
    if (!contract) return
    
    try {
      const response = await fetch(`/api/contracts?id=${contract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'sent'
        })
      })
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Contract status updated to 'sent' - now signable"
        })
        // Refresh contract data
        if (code) {
          await fetchContractByCode(code)
        } else if (contractId) {
          await fetchContract()
        }
      }
    } catch (error) {
      console.error('Error updating contract status:', error)
    }
  }

  // Pagination functions - Uses same page size as contract-library page
  const getPaginatedText = () => {
    if (!contract?.contract_text) return { text: '', totalPages: 0 }
    
    const text = processedText || contract.contract_text
    const contentPages = Math.ceil(text.length / itemsPerPage)
    const totalPages = contentPages + (signatures.length > 0 ? 1 : 0) // Add signature page if signatures exist
    
    // If we're on the last page and there are signatures, show signature page
    if (currentPage === totalPages && signatures.length > 0) {
      return { 
        text: generateSignaturePageText(), 
        totalPages: totalPages,
        isSignaturePage: true 
      }
    }
    
    // If we're beyond content pages but there are no signatures, show empty
    if (currentPage > contentPages) {
      return { text: '', totalPages: totalPages }
    }
    
    // Show regular content page
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const pageText = text.substring(startIndex, endIndex)
    
    return { text: pageText, totalPages: totalPages }
  }

  // Generate signature page text
  const generateSignaturePageText = () => {
    let signatureText = '\n' + '='.repeat(80) + '\n'
    signatureText += 'SIGNATURE PAGE\n'
    signatureText += '='.repeat(80) + '\n\n'
    
    if (signatures.length > 0) {
      signatureText += 'SIGNATURES:\n\n'
      signatures.forEach((signature, index) => {
        signatureText += `${index + 1}. ${signature.signer_name}`
        if (signature.signer_email) {
          signatureText += ` (${signature.signer_email})`
        }
        signatureText += `\n   Signed: ${new Date(signature.signed_at).toLocaleString()}\n`
        signatureText += `   Status: ${signature.status.toUpperCase()}\n`
        
        // Add signature image placeholder
        if (signature.signature_data) {
          signatureText += `   [SIGNATURE IMAGE - ${signature.signature_data.length} characters]\n`
        } else {
          signatureText += `   [NO SIGNATURE IMAGE]\n`
        }
        signatureText += '\n'
      })
    } else {
      signatureText += 'No signatures yet.\n\n'
    }
    
    signatureText += `\nContract: ${contract?.title}\n`
    signatureText += `Generated: ${new Date().toLocaleString()}\n`
    signatureText += `Total Pages: ${Math.ceil((contract?.contract_text?.length || 0) / itemsPerPage) + 1}\n`
    
    return signatureText
  }

  const goToPage = (page: number) => {
    const { totalPages } = getPaginatedText()
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
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

  // Download contract with signatures
  const downloadContract = () => {
    console.log('=== PDF GENERATION DEBUG START ===')
    if (!contract) {
      console.log('ERROR: No contract available')
      return
    }

    console.log('Contract details:', {
      title: contract.title,
      hasText: !!contract.contract_text,
      textLength: contract.contract_text?.length,
      signaturesCount: signatures.length
    })

    const doc = new jsPDF()
    console.log('jsPDF instance created successfully')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const lineHeight = 7
    const maxWidth = pageWidth - (margin * 2)

    // Function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number) => {
      const lines = doc.splitTextToSize(text, maxWidth)
      doc.text(lines, x, y)
      return lines.length * lineHeight
    }

    // Add contract title page
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(contract.title, pageWidth / 2, 40, { align: 'center' })
    
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Category: ${contract.category}`, pageWidth / 2, 60, { align: 'center' })
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 70, { align: 'center' })

    // Use the same pagination logic as the UI
    const contractText = processedText || contract.contract_text || ''
    const contentPages = Math.ceil(contractText.length / itemsPerPage)
    const totalPages = contentPages + (signatures.length > 0 ? 1 : 0)

    console.log('PDF pagination details:', {
      contractTextLength: contractText.length,
      itemsPerPage,
      contentPages,
      totalPages,
      hasSignatures: signatures.length > 0
    })

    // Add each content page using the same logic as getPaginatedText
    for (let pageNum = 1; pageNum <= contentPages; pageNum++) {
      if (pageNum > 1) {
        doc.addPage()
      }
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      
      // Add page header
      doc.setFontSize(10)
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, 15, { align: 'right' })
      
      // Get the same page content as the UI
      const startIndex = (pageNum - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const pageText = contractText.substring(startIndex, endIndex)
      
      // Add page content
      doc.setFontSize(12)
      addWrappedText(pageText, margin, 30, maxWidth)
    }

    // Add signature page as the last page (if signatures exist)
    if (signatures.length > 0) {
      console.log('Adding signature page to PDF...')
      doc.addPage()
      
      // Signature page header
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('SIGNATURE PAGE', pageWidth / 2, 30, { align: 'center' })
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      
      let yPosition = 45
      
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('SIGNATURES:', margin, yPosition)
      yPosition += 15
      
      signatures.forEach((signature, index) => {
        // Check if we need a new page (leave 50px margin at bottom)
        if (yPosition > pageHeight - 100) {
          doc.addPage()
          yPosition = 30 // Reset to top of new page
          
          // Add header to new page
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text('SIGNATURES (continued):', margin, yPosition)
          yPosition += 15
        }
        
        console.log(`Processing signature ${index + 1}:`, {
          name: signature.signer_name,
          email: signature.signer_email,
          hasSignatureData: !!signature.signature_data,
          dataLength: signature.signature_data?.length,
          dataStart: signature.signature_data?.substring(0, 50)
        })

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}. ${signature.signer_name}`, margin, yPosition)
        yPosition += 8
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        if (signature.signer_email) {
          doc.text(`   Email: ${signature.signer_email}`, margin, yPosition)
          yPosition += 6
        }
        
        doc.text(`   Signed: ${new Date(signature.signed_at).toLocaleString()}`, margin, yPosition)
        yPosition += 6
        
        doc.text(`   Status: ${signature.status.toUpperCase()}`, margin, yPosition)
        yPosition += 8
        
        // Debug signature data in detail
        console.log(`=== DETAILED SIGNATURE DEBUG FOR ${signature.signer_name} ===`)
        console.log('Raw signature data:', signature.signature_data)
        console.log('Data type:', typeof signature.signature_data)
        console.log('Data length:', signature.signature_data?.length)
        console.log('Starts with data:image:', signature.signature_data?.startsWith('data:image'))
        console.log('First 100 chars:', signature.signature_data?.substring(0, 100))
        console.log('Last 100 chars:', signature.signature_data?.substring(signature.signature_data.length - 100))
        
        // Try to add actual signature image if available
        if (signature.signature_data && signature.signature_data.startsWith('data:image')) {
          console.log('🔄 Attempting to add actual signature image...')
          
          try {
            // Extract base64 data
            const base64Data = signature.signature_data.split(',')[1]
            console.log('Extracted base64 length:', base64Data.length)
            console.log('Base64 start:', base64Data.substring(0, 50))
            
            // Add the image with appropriate size for PDF
            doc.addImage(
              base64Data,
              'PNG',
              margin,
              yPosition,
              120, // reasonable width for signature
              60   // reasonable height for signature
            )
            yPosition += 70 // Space for image
            console.log('✅ ACTUAL SIGNATURE IMAGE ADDED SUCCESSFULLY!')
            
            // Add a border around the signature area
            doc.setLineWidth(0.5)
            doc.rect(margin - 2, yPosition - 62, 124, 62)
            doc.text(`   Signature`, margin, yPosition)
            yPosition += 10
            
          } catch (imageError) {
            console.log('❌ Failed to add signature image:', imageError)
            console.log('Image error details:', {
              name: (imageError as Error).name,
              message: (imageError as Error).message
            })
            
            // Fallback to text representation
            console.log('🔄 Using text fallback...')
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text(`   [SIGNATURE]`, margin, yPosition)
            yPosition += 10
            
            // Draw a signature line
            doc.setLineWidth(2)
            doc.line(margin, yPosition, margin + 100, yPosition)
            yPosition += 15
            
            // Add error indicator
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text(`   ❌ Image failed: ${(imageError as Error).message}`, margin, yPosition)
            yPosition += 10
          }
        } else {
          console.log('❌ No valid signature image data available')
          
          // Text representation
          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.text(`   [SIGNATURE]`, margin, yPosition)
          yPosition += 10
          
          // Draw a signature line
          doc.setLineWidth(2)
          doc.line(margin, yPosition, margin + 100, yPosition)
          yPosition += 15
          
          // Add signature details
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          doc.text(`   Signature Data: ${signature.signature_data ? 'Available' : 'Not Available'}`, margin, yPosition)
          yPosition += 8
          if (signature.signature_data) {
            doc.text(`   Data Length: ${signature.signature_data.length} characters`, margin, yPosition)
            yPosition += 8
          }
        }
        
        console.log('✅ Signature processing completed')
        
        yPosition += 5 // Reduced space between signatures
      })
      
      // Add contract footer info
      yPosition += 20
      doc.setFontSize(10)
      doc.text(`Contract: ${contract.title}`, margin, yPosition)
      yPosition += 10
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition)
      yPosition += 10
      doc.text(`Total Pages: ${totalPages}`, margin, yPosition)
    } else {
      doc.text('No signatures yet.', margin, 50)
    }

    console.log('=== PDF GENERATION COMPLETE ===')
    console.log('About to save PDF with signatures...')

    // Save the PDF

    // Save the PDF
    doc.save(`${contract.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_signed_${new Date().toISOString().split('T')[0]}.pdf`)
    
    toast({
      title: "Contract Downloaded",
      description: `Contract with ${signatures.length} signature(s) has been downloaded as a PDF`
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading contract...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">Error Loading Contract</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => setShowAccessDialog(true)} className="gradient-button hover:bg-purple-700">
                Enter Access Code
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400">
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
        
        {/* Access Code Dialog */}
        <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle>Enter Access Code</DialogTitle>
              <DialogDescription>
                Please enter the access code provided to view this contract
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="access_code">Access Code</Label>
                <Input
                  id="access_code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="bg-gray-800/30 border-gray-700 text-white"
                  placeholder="Enter 8-character code"
                  maxLength={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400">
                Cancel
              </Button>
              <Button onClick={handleAccessCodeSubmit} className="gradient-button hover:bg-purple-700">
                Access Contract
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-white">Contract Not Found</h2>
            <p className="text-gray-400 mb-4">The contract you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => setShowAccessDialog(true)} className="gradient-button hover:bg-purple-700">
              Enter Access Code
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          {/* Mobile: Stacked layout */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="ml-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Sign Contract
                </h1>
                <p className="text-gray-400 text-sm sm:text-lg hidden sm:block">
                  Review and sign the contract
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(contract.status)}
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Contract Details */}
        <div className="leonardo-card p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">{contract.title}</h2>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">
                {contract.description}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {contract.category}
              </Badge>
              <Button 
                onClick={downloadContract}
                variant="outline" 
                size="sm" 
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-green-900/20 hover:text-green-400"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Download Contract</span>
                <span className="sm:hidden">Download</span>
              </Button>
              <Button 
                onClick={() => {
                  console.log('Testing PDF generation...')
                  console.log('Signatures for PDF:', signatures.map(s => ({
                    name: s.signer_name,
                    hasData: !!s.signature_data,
                    dataLength: s.signature_data?.length,
                    startsWithDataImage: s.signature_data?.startsWith('data:image'),
                    first50Chars: s.signature_data?.substring(0, 50)
                  })))
                  downloadContract()
                }}
                variant="outline" 
                size="sm" 
                className="border-blue-700 bg-blue-900/20 text-blue-300 hover:bg-blue-900/30"
              >
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Test PDF Generation</span>
                <span className="sm:hidden">Test PDF</span>
              </Button>
              <Button 
                onClick={() => {
                  console.log('Testing signature data...')
                  signatures.forEach((sig, index) => {
                    console.log(`Signature ${index + 1} data test:`, {
                      name: sig.signer_name,
                      hasData: !!sig.signature_data,
                      dataLength: sig.signature_data?.length,
                      startsWithDataImage: sig.signature_data?.startsWith('data:image'),
                      first100Chars: sig.signature_data?.substring(0, 100),
                      last100Chars: sig.signature_data?.substring(sig.signature_data.length - 100),
                      isBlackSignature: sig.signature_data?.includes('iVBORw0KGgo')
                    })
                  })
                }}
                variant="outline" 
                size="sm" 
                className="border-green-700 bg-green-900/20 text-green-300 hover:bg-green-900/30"
              >
                <span className="hidden sm:inline">Test Signature Data</span>
                <span className="sm:hidden">Test Data</span>
              </Button>
              <Button 
                onClick={() => {
                  console.log('Regenerating signatures with black color...')
                  // This would require re-signing the contract with black signatures
                  alert('To get black signatures in PDF, please re-sign the contract using the "Test Save Black" button in the signature dialog.')
                }}
                variant="outline" 
                size="sm" 
                className="border-yellow-700 bg-yellow-900/20 text-yellow-300 hover:bg-yellow-900/30"
              >
                <span className="hidden sm:inline">Fix Black Signatures</span>
                <span className="sm:hidden">Fix Signatures</span>
              </Button>
              <Button 
                onClick={() => {
                  console.log('Creating PDF with drawn signatures...')
                  
                  // Create a PDF with drawn signatures (guaranteed to work)
                  const doc = new jsPDF()
                  doc.setFontSize(16)
                  doc.text('PDF with Drawn Signatures (Guaranteed to Work)', 20, 30)
                  
                  signatures.forEach((sig, index) => {
                    const yPos = 50 + (index * 120)
                    
                    // Signature box
                    doc.setLineWidth(2)
                    doc.rect(20, yPos, 300, 100)
                    
                    // Signature label
                    doc.setFontSize(12)
                    doc.setFont('helvetica', 'bold')
                    doc.text(`Signature ${index + 1}: ${sig.signer_name}`, 25, yPos + 10)
                    
                    // Signature line
                    doc.setLineWidth(3)
                    doc.line(25, yPos + 25, 315, yPos + 25)
                    
                    // Draw signature curve
                    doc.setLineWidth(2)
                    doc.setDrawColor(0, 0, 0)
                    
                    const startX = 30
                    const startY = yPos + 35
                    doc.line(startX, startY, startX + 30, startY - 10)
                    doc.line(startX + 30, startY - 10, startX + 60, startY)
                    doc.line(startX + 60, startY, startX + 90, startY - 15)
                    doc.line(startX + 90, startY - 15, startX + 120, startY - 5)
                    doc.line(startX + 120, startY - 5, startX + 150, startY - 20)
                    doc.line(startX + 150, startY - 20, startX + 180, startY - 10)
                    doc.line(startX + 180, startY - 10, startX + 210, startY - 25)
                    doc.line(startX + 210, startY - 25, startX + 240, startY - 15)
                    doc.line(startX + 240, startY - 15, startX + 270, startY - 30)
                    
                    // Signature details
                    doc.setFontSize(10)
                    doc.setFont('helvetica', 'normal')
                    doc.text(`Signed: ${new Date(sig.signed_at).toLocaleString()}`, 25, yPos + 70)
                    doc.text(`Email: ${sig.signer_email}`, 25, yPos + 80)
                    doc.text(`Data: ${sig.signature_data ? sig.signature_data.length + ' chars' : 'None'}`, 25, yPos + 90)
                  })
                  
                  doc.save('drawn_signatures.pdf')
                  console.log('PDF with drawn signatures created')
                }}
                variant="outline" 
                size="sm" 
                className="border-purple-700 bg-purple-900/20 text-purple-300 hover:bg-purple-900/30"
              >
                <span className="hidden sm:inline">Create Drawn Signatures PDF</span>
                <span className="sm:hidden">Drawn PDF</span>
              </Button>
              {contract.file_url && (
                <Button variant="outline" size="sm" className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400">
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Download Original</span>
                  <span className="sm:hidden">Original</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Contract Content */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Contract Content</h3>
              {placeholders.length > 0 && (
                <Button 
                  onClick={() => setShowPlaceholderDialog(true)}
                  variant="outline" 
                  size="sm"
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Fill Placeholders ({placeholders.length})
                </Button>
              )}
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
              <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 relative">
                {/* Signature Page Indicator */}
                {getPaginatedText().isSignaturePage && (
                  <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-300 font-medium">Signature Page</span>
                      <span className="text-green-400 text-sm">This page will be included in the downloaded PDF</span>
                    </div>
                  </div>
                )}
                
                <pre className="text-white whitespace-pre-wrap font-sans">
                  {getPaginatedText().text}
                </pre>
                
                {/* Visual Signature Display - only on signature page */}
                {getPaginatedText().isSignaturePage && signatures.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-900/50 border border-gray-600 rounded-lg">
                    <h4 className="text-lg font-semibold text-white mb-4">Signature Images:</h4>
                    
                    {/* Debug info */}
                    <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                      <p className="text-blue-300 text-sm">
                        Debug: Found {signatures.length} signatures. 
                        {signatures.filter(s => s.signature_data).length} have signature data.
                      </p>
                      <Button 
                        onClick={() => {
                          console.log('All signatures in detail:', signatures)
                          signatures.forEach((sig, i) => {
                            console.log(`Signature ${i + 1}:`, {
                              id: sig.id,
                              name: sig.signer_name,
                              hasData: !!sig.signature_data,
                              dataLength: sig.signature_data?.length,
                              dataStart: sig.signature_data?.substring(0, 50),
                              isImageData: sig.signature_data?.startsWith('data:image')
                            })
                          })
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-blue-700 bg-blue-900/20 text-blue-300 hover:bg-blue-900/30"
                      >
                        Debug Signatures
                      </Button>
                      <Button 
                        onClick={async () => {
                          console.log('Refreshing signatures...')
                          if (code) {
                            await fetchContractByCode(code)
                          } else if (contractId) {
                            await fetchContract()
                          }
                          console.log('Signatures after refresh:', signatures)
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-2 border-green-700 bg-green-900/20 text-green-300 hover:bg-green-900/30"
                      >
                        Refresh Signatures
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {signatures.map((signature, index) => (
                        <div key={signature.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-white text-sm sm:text-base">
                              {index + 1}. {signature.signer_name}
                            </h5>
                            <Badge 
                              variant={signature.status === 'signed' ? 'default' : 'secondary'}
                              className={signature.status === 'signed' ? 'bg-green-500' : 'bg-yellow-500'}
                            >
                              {signature.status.charAt(0).toUpperCase() + signature.status.slice(1)}
                            </Badge>
                          </div>
                          
                          {/* Debug signature data */}
                          <div className="mb-2 p-2 bg-gray-900/50 rounded text-xs text-gray-400">
                            <div>Has signature data: {signature.signature_data ? 'Yes' : 'No'}</div>
                            {signature.signature_data && (
                              <div>Data length: {signature.signature_data.length}</div>
                            )}
                            {signature.signature_data && (
                              <div>Starts with data:image: {signature.signature_data.startsWith('data:image') ? 'Yes' : 'No'}</div>
                            )}
                          </div>
                          
                          {signature.signature_data ? (
                            <div className="flex flex-col items-center">
                              <img 
                                src={signature.signature_data} 
                                alt={`Signature of ${signature.signer_name}`}
                                className="w-24 sm:w-32 h-16 sm:h-20 object-contain border border-gray-600 rounded bg-transparent mb-2"
                                style={{ 
                                  minHeight: '64px',
                                  maxHeight: '80px',
                                  width: 'auto',
                                  maxWidth: '128px'
                                }}
                                onError={(e) => {
                                  console.log('Signature image failed to load in preview:', signature.signature_data?.substring(0, 100))
                                  console.log('Full signature data:', signature.signature_data)
                                  e.currentTarget.style.display = 'none'
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                  if (fallback) fallback.style.display = 'block'
                                }}
                                onLoad={(e) => {
                                  console.log('Signature image loaded successfully in preview')
                                  console.log('Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight)
                                  e.currentTarget.style.display = 'block'
                                  e.currentTarget.style.opacity = '1'
                                }}
                              />
                              {/* Fallback for failed images */}
                              <div 
                                className="w-24 sm:w-32 h-16 sm:h-20 border border-gray-600 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600 hidden"
                                style={{ display: 'none' }}
                              >
                                <div className="text-center">
                                  <div className="text-gray-400">📝</div>
                                  <div className="text-xs">Signature</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-24 sm:w-32 h-16 sm:h-20 border border-gray-600 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                              <div className="text-center">
                                <div className="text-gray-400">❌</div>
                                <div className="text-xs">No Signature</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3 text-xs text-gray-400">
                            <div>Email: {signature.signer_email || 'N/A'}</div>
                            <div>Signed: {new Date(signature.signed_at).toLocaleString()}</div>
                            {signature.signature_data && (
                              <div>Data: {signature.signature_data.length} characters</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Highlight labeled fields in sign contract page - only on content pages */}
                {!getPaginatedText().isSignaturePage && contract.signature_fields && contract.signature_fields.map((field, index) => {
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
            )}

            {/* Pagination Controls */}
            {getPaginatedText().totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-3 bg-gray-800/30 border border-gray-700 rounded-lg mt-4">
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
                  <span className="text-gray-300 text-sm">
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-400 text-sm text-center sm:text-left">Go to page:</span>
                  <div className="flex gap-1 justify-center sm:justify-start flex-wrap">
                    {Array.from({ length: getPaginatedText().totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        onClick={() => goToPage(page)}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className={
                          currentPage === page
                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                            : "border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                        }
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Character Count */}
            <div className="mt-3 text-right">
              <span className="text-xs text-gray-500">
                {getPaginatedText().isSignaturePage ? (
                  <span className="text-green-400">
                    Signature page • {signatures.length} signature(s) included
                  </span>
                ) : (
                  <>
                    {getPaginatedText().text.length} characters on this page
                    {getPaginatedText().totalPages > 1 && (
                      <span className="ml-2">
                        • {contract.contract_text?.length || 0} total characters
                      </span>
                    )}
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Signature Page Preview */}
        {signatures.length > 0 && (
          <div className="leonardo-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Signature Page Preview</h3>
              <Badge variant="outline" className="border-green-600 text-green-400 bg-green-900/20">
                Will be included in download
              </Badge>
            </div>
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
              <pre className="text-white whitespace-pre-wrap font-sans text-sm">
{`${'='.repeat(80)}
SIGNATURE PAGE
${'='.repeat(80)}

SIGNATURES:

${signatures.map((signature, index) => 
  `${index + 1}. ${signature.signer_name}${signature.signer_email ? ` (${signature.signer_email})` : ''}
   Signed: ${new Date(signature.signed_at).toLocaleString()}
   Status: ${signature.status.toUpperCase()}

`
).join('')}
Contract: ${contract?.title}
Generated: ${new Date().toLocaleString()}
Total Pages: ${getPaginatedText().totalPages}`}
              </pre>
              
              {/* Signature Images in Preview */}
              <div className="mt-6 p-4 bg-gray-900/50 border border-gray-600 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-4">Signature Images (will be included in PDF):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {signatures.map((signature, index) => (
                    <div key={signature.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-white text-sm sm:text-base">
                          {index + 1}. {signature.signer_name}
                        </h5>
                        <Badge 
                          variant={signature.status === 'signed' ? 'default' : 'secondary'}
                          className={signature.status === 'signed' ? 'bg-green-500' : 'bg-yellow-500'}
                        >
                          {signature.status.charAt(0).toUpperCase() + signature.status.slice(1)}
                        </Badge>
                      </div>
                      
                      {signature.signature_data ? (
                        <div className="flex flex-col items-center">
                          <img 
                            src={signature.signature_data} 
                            alt={`Signature of ${signature.signer_name}`}
                            className="w-24 sm:w-32 h-16 sm:h-20 object-contain border border-gray-600 rounded bg-transparent mb-2"
                            style={{ 
                              minHeight: '64px',
                              maxHeight: '80px',
                              width: 'auto',
                              maxWidth: '128px'
                            }}
                            onError={(e) => {
                              console.log('Signature image failed to load in preview:', signature.signature_data?.substring(0, 100))
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'block'
                            }}
                            onLoad={(e) => {
                              console.log('Signature image loaded successfully in preview')
                              e.currentTarget.style.display = 'block'
                              e.currentTarget.style.opacity = '1'
                            }}
                          />
                          {/* Fallback for failed images */}
                          <div 
                            className="w-24 sm:w-32 h-16 sm:h-20 border border-gray-600 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600 hidden"
                            style={{ display: 'none' }}
                          >
                            <div className="text-center">
                              <div className="text-gray-400">📝</div>
                              <div className="text-xs">Signature</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 sm:w-32 h-16 sm:h-20 border border-gray-600 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                          <div className="text-center">
                            <div className="text-gray-400">❌</div>
                            <div className="text-xs">No Signature</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-400">
                        <div>Email: {signature.signer_email || 'N/A'}</div>
                        <div>Signed: {new Date(signature.signed_at).toLocaleString()}</div>
                        {signature.signature_data && (
                          <div>Data: {signature.signature_data.length} characters</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signatures Section */}
        <div className="leonardo-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-white">Signatures</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => {
                  console.log('Opening signature dialog')
                  setShowSignatureDialog(true)
                }}
                variant="outline"
                size="sm"
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
              >
                <span className="hidden sm:inline">Test Dialog</span>
                <span className="sm:hidden">Test</span>
              </Button>
              <Button 
                onClick={() => {
                  console.log('All signatures:', signatures)
                  signatures.forEach((sig, index) => {
                    console.log(`Signature ${index + 1}:`, {
                      id: sig.id,
                      name: sig.signer_name,
                      dataLength: sig.signature_data?.length,
                      dataStart: sig.signature_data?.substring(0, 50),
                      isImageData: sig.signature_data?.startsWith('data:image')
                    })
                  })
                }}
                variant="outline"
                size="sm"
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-blue-900/20 hover:text-blue-400"
              >
                <span className="hidden sm:inline">Debug Signatures</span>
                <span className="sm:hidden">Debug</span>
              </Button>
              <Button onClick={() => setShowSignatureDialog(true)} className="gradient-button hover:bg-purple-700">
                <PenTool className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Sign Contract</span>
                <span className="sm:hidden">Sign</span>
              </Button>
            </div>
          </div>
          
          {signatures.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No signatures yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {signatures.map((signature) => (
                <div key={signature.id} className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{signature.signer_name}</p>
                      {signature.signer_email && (
                        <p className="text-sm text-gray-400">{signature.signer_email}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Signed: {new Date(signature.signed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {signature.signature_data && (
                      <div className="flex flex-col items-center">
                        <p className="text-xs text-gray-400 mb-1">Signature:</p>
                        <div className="relative">
                          <img 
                            src={signature.signature_data} 
                            alt="Signature" 
                            className="w-20 h-12 object-contain border border-gray-600 rounded bg-transparent"
                            style={{ 
                              minHeight: '48px',
                              maxHeight: '48px',
                              width: 'auto',
                              maxWidth: '80px'
                            }}
                            onError={(e) => {
                              console.log('Signature image failed to load:', signature.signature_data?.substring(0, 100))
                              console.log('Full signature data length:', signature.signature_data?.length)
                              // Show fallback instead of hiding
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'block'
                            }}
                            onLoad={(e) => {
                              console.log('Signature image loaded successfully')
                              console.log('Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight)
                              // Ensure the image is visible
                              e.currentTarget.style.display = 'block'
                              e.currentTarget.style.opacity = '1'
                            }}
                          />
                          {/* Fallback display for failed images */}
                          <div 
                            className="w-20 h-12 border border-gray-600 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-600 hidden"
                            style={{ display: 'none' }}
                          >
                            <div className="text-center">
                              <div className="text-gray-400">📝</div>
                              <div className="text-xs">Signature</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Data length: {signature.signature_data?.length || 0}
                        </div>
                        {/* Debug info */}
                        <div className="text-xs text-gray-600 mt-1">
                          {signature.signature_data?.startsWith('data:image') ? 'Valid image data' : 'Raw data'}
                        </div>
                      </div>
                    )}
                    <Badge 
                      variant={signature.status === 'signed' ? 'default' : 'secondary'}
                      className={signature.status === 'signed' ? 'bg-green-500' : 'bg-yellow-500'}
                    >
                      {signature.status.charAt(0).toUpperCase() + signature.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Signature Dialog */}
        {showSignatureDialog && (
          <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Sign Contract</DialogTitle>
                <DialogDescription>
                  Please provide your signature information and draw your signature below
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="signer_name">Full Name *</Label>
                    <Input
                      id="signer_name"
                      value={signatureForm.signer_name}
                      onChange={(e) => setSignatureForm({ ...signatureForm, signer_name: e.target.value })}
                      className="bg-gray-800/30 border-gray-700 text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signer_email">Email Address</Label>
                    <Input
                      id="signer_email"
                      type="email"
                      value={signatureForm.signer_email}
                      onChange={(e) => setSignatureForm({ ...signatureForm, signer_email: e.target.value })}
                      className="bg-gray-800/30 border-gray-700 text-white"
                      placeholder="Enter your email address"
                    />
                  </div>
                </div>

                <div>
                  <Label>Digital Signature *</Label>
                  <div className="mt-2 space-y-3">
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                      <canvas
                        ref={canvasRef}
                        width={400}
                        height={150}
                        className="w-full h-[150px] border border-gray-600 rounded cursor-crosshair bg-white"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={clearSignature}
                        variant="outline"
                        size="sm"
                        className="border-gray-700 bg-gray-800/30 text-white hover:bg-red-900/20 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                      <Button
                        onClick={saveSignature}
                        variant="outline"
                        size="sm"
                        className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Signature
                      </Button>
                      <Button
                        onClick={() => {
                          console.log('Testing signature saving process...')
                          const canvas = canvasRef.current
                          if (canvas) {
                            // Create a test signature with black color
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              // Clear canvas
                              ctx.clearRect(0, 0, canvas.width, canvas.height)
                              
                              // Draw a test signature in black
                              ctx.strokeStyle = '#000000'
                              ctx.lineWidth = 3
                              ctx.lineCap = 'round'
                              ctx.lineJoin = 'round'
                              ctx.beginPath()
                              ctx.moveTo(50, 50)
                              ctx.lineTo(150, 50)
                              ctx.lineTo(100, 100)
                              ctx.stroke()
                              
                              console.log('Test signature drawn, now saving...')
                              saveSignature()
                            }
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="border-gray-700 bg-gray-800/30 text-white hover:bg-green-900/20 hover:text-green-400"
                      >
                        <span className="hidden sm:inline">Test Save Black</span>
                        <span className="sm:hidden">Test Black</span>
                      </Button>
                      <Button
                        onClick={() => {
                          const canvas = canvasRef.current
                          if (canvas) {
                            const ctx = canvas.getContext('2d')
                            if (ctx) {
                              const rect = canvas.getBoundingClientRect()
                              const scaleX = canvas.width / rect.width
                              const scaleY = canvas.height / rect.height
                              
                              // Draw a black test signature
                              ctx.strokeStyle = '#000000' // Black color
                              ctx.lineWidth = 3
                              ctx.lineCap = 'round'
                              ctx.lineJoin = 'round'
                              ctx.beginPath()
                              ctx.moveTo(50 * scaleX, 50 * scaleY)
                              ctx.lineTo(150 * scaleX, 50 * scaleY)
                              ctx.lineTo(100 * scaleX, 100 * scaleY)
                              ctx.stroke()
                              console.log('Black test signature drawn with scaling:', scaleX, scaleY)
                            }
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="border-gray-700 bg-gray-800/30 text-white hover:bg-blue-900/20 hover:text-blue-400"
                      >
                        <span className="hidden sm:inline">Test Black Signature</span>
                        <span className="sm:hidden">Test Black</span>
                      </Button>
                    </div>
                    {signatureImage && (
                      <div className="text-xs text-green-400 flex items-center gap-1">
                        <span>✓</span>
                        Signature saved ({Math.round(signatureImage.length / 1024)}KB)
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowSignatureDialog(false)} 
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSignatureSubmit} 
                  disabled={!signatureForm.signer_name || !signatureImage}
                  className="gradient-button hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Sign Contract
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Placeholder Management Dialog */}
        {showPlaceholderDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Fill Contract Placeholders</h2>
                <button 
                  onClick={() => setShowPlaceholderDialog(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              {placeholders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No placeholders detected in this contract.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-white">Found {placeholders.length} placeholders to fill:</p>
                  
                  <div className="space-y-4">
                    {placeholders.map((placeholder, index) => (
                      <div key={placeholder.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-white">
                            Placeholder {index + 1}: <span className="text-gray-400 font-mono">"{placeholder.original}"</span>
                          </Label>
                          <span className="text-xs text-gray-500 capitalize">({placeholder.type})</span>
                        </div>
                        <Input
                          value={placeholder.value}
                          onChange={(e) => updatePlaceholder(placeholder.id, e.target.value)}
                          className="bg-gray-800/30 border-gray-700 text-white"
                          placeholder={placeholder.suggested || `Enter ${placeholder.type}`}
                        />
                        {placeholder.suggested && (
                          <p className="text-xs text-gray-400">Suggested: {placeholder.suggested}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={autoFillAll}
                      variant="outline"
                      className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                    >
                      Auto-Fill All
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('Final contract text:', getFinalContractText())
                        alert('Contract text updated! Check console for details.')
                      }}
                      variant="outline"
                      className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                    >
                      Preview
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-6 gap-2">
                <Button 
                  onClick={() => setShowPlaceholderDialog(false)} 
                  variant="outline"
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setShowPlaceholderDialog(false)
                    // Update the processed text with filled placeholders
                    setProcessedText(getFinalContractText())
                  }}
                  className="gradient-button hover:bg-purple-700"
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Access Code Dialog */}
        <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Enter Access Code</DialogTitle>
              <DialogDescription>
                Please enter the access code provided to view this contract
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="access_code">Access Code</Label>
                <Input
                  id="access_code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="bg-gray-800/30 border-gray-700 text-white"
                  placeholder="Enter 8-character code"
                  maxLength={8}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => router.push('/dashboard')} className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400">
                Cancel
              </Button>
              <Button onClick={handleAccessCodeSubmit} className="gradient-button hover:bg-purple-700">
                Access Contract
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

export default function SignContractPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignContractContent />
    </Suspense>
  )
} 
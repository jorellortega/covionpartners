'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowLeft, CalendarIcon, Signature } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface DocumentToSign {
  id: string
  name: string
  file_path: string
  // Add other fields if needed for display
}

export default function SignDocumentPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.documentId as string
  const updateId = params.id as string // For navigating back

  const [documentData, setDocumentData] = useState<DocumentToSign | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)

  const [typedSignature, setTypedSignature] = useState('')
  const [signatureDate, setSignatureDate] = useState<Date | undefined>(new Date())

  // Fetch document details and PDF URL
  useEffect(() => {
    async function loadDocument() {
      if (!documentId) {
        setError('Document ID missing');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch document record
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .select('id, name, file_path')
          .eq('id', documentId)
          .single()

        if (docError) throw new Error(`Failed to fetch document: ${docError.message}`)
        if (!doc) throw new Error('Document not found.')
        if (!doc.file_path) throw new Error('Document file path is missing.')
        setDocumentData(doc)

        // Get signed URL for the PDF
        const { data: urlData, error: urlError } = await supabase.storage
          .from('partnerfiles')
          .createSignedUrl(doc.file_path, 300) // URL valid for 5 minutes

        if (urlError) throw new Error(`Failed to get PDF URL: ${urlError.message}`)
        if (!urlData?.signedUrl) throw new Error('Could not retrieve signed URL for PDF.')
        setPdfUrl(urlData.signedUrl)

      } catch (err) {
        console.error("Error loading document:", err)
        setError(err instanceof Error ? err.message : "Failed to load document for signing")
        setPdfUrl(null)
      } finally {
        setLoading(false)
      }
    }
    loadDocument()
  }, [documentId])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }): void => {
    setNumPages(numPages)
  }

  const handleConfirmSignature = async () => {
    if (!typedSignature || !signatureDate || !documentId) {
        toast.error("Please type your signature and select a date.")
        return
    }
    setSigning(true)
    try {
      // --- Call the Edge Function --- 
      console.log("Invoking edge function confirm-signature...")
      const signatureDateString = signatureDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'confirm-signature', 
        {
          body: { 
            documentId, 
            signerName: typedSignature, 
            signatureDate: signatureDateString
          }
        }
      )
      
      if (functionError) {
        console.error('Edge function invocation error:', functionError)
        throw new Error(`Failed to confirm signature: ${functionError.message}`)
      }

      if (functionData.error) {
        console.error('Edge function returned error:', functionData.error)
        throw new Error(`Failed to confirm signature: ${functionData.error}`)
      }
      // --- End Edge Function Call ---
      
      console.log('Signature confirmation successful:', functionData)
      toast.success("Document signed and details saved!") 
      
      // Navigate back to the update details page after success
      router.push(`/updates/${updateId}`)

    } catch (err) {
      console.error("Error confirming signature:", err)
      toast.error(err instanceof Error ? err.message : "Failed to confirm signature")
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="container mx-auto py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(`/updates/${updateId}`)} disabled={signing}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Update
          </Button>
          <h1 className="text-2xl font-bold">Sign Document: {documentData?.name ?? 'Loading...'}</h1>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin" />
        </div>
      )}

      {error && (
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-destructive">Error Loading Document</CardTitle></CardHeader>
          <CardContent><p>{error}</p></CardContent>
        </Card>
      )}

      {!loading && !error && pdfUrl && documentData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PDF Viewer Column */}          
          <div className="md:col-span-2 border rounded-md overflow-hidden max-h-[80vh] overflow-y-auto bg-gray-50">
            <Document 
              file={pdfUrl} 
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(err: Error) => {
                  console.error("PDF Load Error:", err)
                  setError(`Failed to load PDF: ${err.message}`)
              }}
              loading={<Loader2 className="h-8 w-8 animate-spin mx-auto my-10" />}
              error={<p>Error loading PDF preview.</p>}
            >
              {Array.from(new Array(numPages), (el, index) => (
                <Page 
                  key={`page_${index + 1}`} 
                  pageNumber={index + 1} 
                  renderTextLayer={false} // Simplify rendering
                  renderAnnotationLayer={false} // Simplify rendering
                  width={800} // Adjust width as needed
                />
              ))}
            </Document>
          </div>

          {/* Signing Column */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Signature size={20}/>Provide Your Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="signature">Type Your Full Name as Signature</Label>
                  <Input 
                    id="signature"
                    placeholder="Your Full Name"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    className="mt-1 font-cursive text-lg" // Simple styling
                    disabled={signing}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Typing your name constitutes a legally binding signature.</p>
                </div>
                <div>
                  <Label>Date of Signing</Label>
                   <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={`w-full justify-start text-left font-normal mt-1 ${!signatureDate && "text-muted-foreground"}`}
                        disabled={signing}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {signatureDate ? signatureDate.toLocaleDateString() : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={signatureDate}
                        onSelect={setSignatureDate}
                        initialFocus
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")} // Example disabled dates
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleConfirmSignature}
                  disabled={signing || !typedSignature || !signatureDate}
                >
                  {signing ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : null}
                  Confirm and Sign Document
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
} 